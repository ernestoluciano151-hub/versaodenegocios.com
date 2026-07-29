import { NextRequest, NextResponse } from 'next/server'
import { requireCustomer } from '@/lib/customer-auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// Cancellation window: 1 hour after order creation
const CANCEL_WINDOW_MS = 60 * 60 * 1000

export async function POST(req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error: authError, customer } = await requireCustomer(req)
  if (authError) return authError

  const { id } = await params

  const order = await prisma.order.findFirst({
    where: {
      id,
      OR: [
        { customerId: customer.id },
        { guestEmail: customer.email }, // pedidos feitos sem sessão mas com o mesmo email
      ],
    },
    select: { id: true, status: true, createdAt: true, total: true, stockDeducted: true, customerId: true },
  })

  if (!order) return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 })

  // Only cancellable if awaiting_confirmation or confirmed
  const cancellableStatuses = ['awaiting_confirmation', 'confirmed']
  if (!cancellableStatuses.includes(order.status)) {
    return NextResponse.json({ error: 'Este pedido já não pode ser cancelado.' }, { status: 400 })
  }

  // Check time window
  const elapsed = Date.now() - new Date(order.createdAt).getTime()
  if (elapsed > CANCEL_WINDOW_MS) {
    return NextResponse.json({ error: 'O prazo de cancelamento (1 hora) já expirou.' }, { status: 400 })
  }

  // Cancel order and restore stock in a transaction
  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id },
      data: { status: 'cancelled', ...(order.stockDeducted ? { stockDeducted: false } : {}) },
    })

    // Repor stock APENAS se foi deduzido (cash on delivery não deduz no checkout)
    if (order.stockDeducted) {
      const items = await tx.orderItem.findMany({ where: { orderId: id }, select: { productId: true, quantity: true } })
      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        })
      }
    }

    // Update customer stats (só se o pedido pertence à conta)
    if (order.customerId) {
      await tx.customer.update({
        where: { id: order.customerId },
        data: {
          totalSpent: { decrement: order.total },
          ordersCount: { decrement: 1 },
        },
      })
    }
  })

  return NextResponse.json({ ok: true, message: 'Pedido cancelado com sucesso.' })
}
