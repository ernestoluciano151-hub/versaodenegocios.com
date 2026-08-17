import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-auth'
import { logError } from '@/lib/logger'
import { revokePointsForOrder } from '@/lib/loyalty'
import { cancelCommissionForOrder } from '@/lib/affiliate'

export const dynamic = 'force-dynamic'

// Estados de pagamento a partir dos quais o admin pode cancelar — falha,
// atraso ou desistência antes da confirmação. Pagamentos já confirmados,
// reembolsados ou já cancelados não passam por aqui.
const CANCELLABLE_STATUSES = new Set(['pending', 'awaiting_delivery', 'failed'])

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error: authError, session: authSession } = await requireAdmin(req)
  if (authError) return authError

  const { id } = await params

  const payment = await prisma.payment.findUnique({
    where: { id },
    include: {
      order: {
        select: {
          id: true, status: true, stockDeducted: true, customerId: true, total: true,
          items: { select: { productId: true, quantity: true } },
        },
      },
    },
  })
  if (!payment) return NextResponse.json({ error: 'Pagamento não encontrado' }, { status: 404 })

  if (!CANCELLABLE_STATUSES.has(payment.paymentStatus)) {
    return NextResponse.json(
      { error: `Não é possível cancelar um pagamento com estado "${payment.paymentStatus}".` },
      { status: 409 }
    )
  }

  const order = payment.order
  const orderWasAlreadyCancelled = order.status === 'cancelled'

  const updated = await prisma.$transaction(async (tx) => {
    const updatedPayment = await tx.payment.update({
      where: { id },
      data: { paymentStatus: 'cancelled' },
    })

    if (!orderWasAlreadyCancelled) {
      await tx.order.update({ where: { id: order.id }, data: { status: 'cancelled', stockDeducted: false } })

      // Repor stock exactamente como no cancelamento manual de um pedido —
      // só se já tinha sido deduzido (entregas COD só deduzem na entrega).
      if (order.stockDeducted) {
        for (const item of order.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          })
          await tx.inventoryMovement.create({
            data: {
              productId: item.productId,
              type: 'in',
              quantity: item.quantity,
              reference: `Pedido #${order.id.slice(-8).toUpperCase()}`,
              notes: 'Reposição — pagamento cancelado',
            },
          })
        }
      }

      if (order.customerId) {
        await tx.customer.update({
          where: { id: order.customerId },
          data: { totalSpent: { decrement: order.total }, ordersCount: { decrement: 1 } },
        })
      }
    }

    return updatedPayment
  })

  // Reverter pontos de fidelização e comissão de afiliado — best-effort, não
  // pode bloquear o cancelamento do pagamento em si.
  if (!orderWasAlreadyCancelled) {
    try { await revokePointsForOrder(order.id) } catch (err) { logError(err, 'payments:cancel:revoke-points') }
    try { await cancelCommissionForOrder(order.id) } catch (err) { logError(err, 'payments:cancel:cancel-commission') }
  }

  try {
    await prisma.auditLog.create({
      data: {
        userId: authSession?.user?.id ?? null,
        action: 'CANCEL_PAYMENT',
        entity: 'Payment',
        entityId: id,
        oldData: { paymentStatus: payment.paymentStatus, orderStatus: order.status },
        newData: { paymentStatus: 'cancelled', orderStatus: 'cancelled' },
      },
    })
  } catch { /* audit failure must not block the cancellation */ }

  return NextResponse.json(updated)
}
