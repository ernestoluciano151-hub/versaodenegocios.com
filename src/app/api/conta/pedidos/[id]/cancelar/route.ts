import { NextRequest, NextResponse } from 'next/server'
import { requireCustomerSession } from '@/lib/customer-auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// Cancellation window: 1 hour after order creation
const CANCEL_WINDOW_MS = 60 * 60 * 1000

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let customer
  try { customer = await requireCustomerSession() } catch {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { id } = await params

  const order = await prisma.order.findUnique({
    where: { id, customerId: customer.id },
    select: { id: true, status: true, createdAt: true, total: true },
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
    await tx.order.update({ where: { id }, data: { status: 'cancelled' } })

    // Restore stock for each item
    const items = await tx.orderItem.findMany({ where: { orderId: id }, select: { productId: true, quantity: true } })
    for (const item of items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { increment: item.quantity } },
      })
    }

    // Update customer stats
    await tx.customer.update({
      where: { id: customer.id },
      data: {
        totalSpent: { decrement: order.total },
        ordersCount: { decrement: 1 },
      },
    })
  })

  return NextResponse.json({ ok: true, message: 'Pedido cancelado com sucesso.' })
}
