import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'
import { sendOrderShippedEmail } from '@/lib/email'
import { logError } from '@/lib/logger'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error: authError, session: authSession } = await requireAdmin(req)
  if (authError) return authError
  const user = authSession!.user as { id: string; type: string }

  const { id } = await params
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      customer: true,
      items: { include: { product: { select: { name: true, images: true, slug: true } } } },
      payments: true,
    },
  })

  if (!order) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

  // Customers can only view their own orders
  if (user.type !== 'admin' && order.customerId !== user.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  }

  return NextResponse.json(order)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error: authError, session: authSession } = await requireAdmin(req)
  if (authError) return authError

  const { id } = await params
  const body = await req.json()
  // Allowlist only safe fields — never pass raw body to Prisma (mass assignment)
  const { status, notes, trackingNumber } = body
  const data: Record<string, unknown> = {}
  if (status !== undefined) data.status = status
  if (notes !== undefined) data.notes = notes
  if (trackingNumber !== undefined) data.trackingNumber = trackingNumber

  // Fetch current order before update (to detect status transition)
  const prevOrder = await prisma.order.findUnique({
    where: { id },
    select: {
      status: true, stockDeducted: true, customerId: true, total: true,
      customer: { select: { email: true, name: true } },
      guestEmail: true, guestName: true, trackingNumber: true,
      items: { select: { productId: true, quantity: true } },
    },
  })
  if (!prevOrder) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

  // ── Transições de stock ─────────────────────────────────────────────────────
  // entregue  + stock ainda não deduzido (cash on delivery) → deduzir agora
  // cancelado + stock já deduzido → repor stock exacto
  const statusChanged = status !== undefined && prevOrder.status !== status
  if (statusChanged && status === 'delivered' && !prevOrder.stockDeducted) {
    data.stockDeducted = true
  }
  if (statusChanged && status === 'cancelled' && prevOrder.stockDeducted) {
    data.stockDeducted = false
  }

  const order = await prisma.$transaction(async (tx) => {
    const updated = await tx.order.update({ where: { id }, data })

    if (statusChanged && status === 'delivered' && !prevOrder.stockDeducted) {
      for (const item of prevOrder.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        })
        await tx.inventoryMovement.create({
          data: {
            productId: item.productId,
            type: 'out',
            quantity: item.quantity,
            reference: `Pedido #${id.slice(-8).toUpperCase()}`,
            notes: 'Saída — entrega confirmada (cash on delivery)',
          },
        })
      }
    }

    if (statusChanged && status === 'cancelled' && prevOrder.stockDeducted) {
      for (const item of prevOrder.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        })
        await tx.inventoryMovement.create({
          data: {
            productId: item.productId,
            type: 'in',
            quantity: item.quantity,
            reference: `Pedido #${id.slice(-8).toUpperCase()}`,
            notes: 'Reposição — pedido cancelado',
          },
        })
      }
      // Ajustar estatísticas do cliente
      if (prevOrder.customerId) {
        await tx.customer.update({
          where: { id: prevOrder.customerId },
          data: {
            totalSpent: { decrement: prevOrder.total },
            ordersCount: { decrement: 1 },
          },
        })
      }
    }

    return updated
  })

  // Audit log — record every status change
  if (statusChanged) {
    try {
      await prisma.auditLog.create({
        data: {
          userId: authSession?.user?.id ?? null,
          action: 'UPDATE_STATUS',
          entity: 'Order',
          entityId: id,
          oldData: { status: prevOrder.status },
          newData: { status },
        },
      })
    } catch { /* audit failure must not block the update */ }
  }

  // Trigger shipped email when status transitions to 'shipped'
  if (status === 'shipped' && prevOrder?.status !== 'shipped') {
    const toEmail = prevOrder?.customer?.email ?? prevOrder?.guestEmail
    const toName = prevOrder?.customer?.name ?? prevOrder?.guestName ?? 'Cliente'
    const tracking = (trackingNumber as string | undefined) ?? prevOrder?.trackingNumber ?? undefined
    if (toEmail) {
      try {
        await sendOrderShippedEmail(toEmail, { customerName: toName, orderId: id, trackingNumber: tracking })
      } catch (err) { logError(err, 'orders:shipped-email') }
    }
  }

  return NextResponse.json(order)
}

// PUT is intentionally removed — use PATCH which includes audit log + shipped email logic
