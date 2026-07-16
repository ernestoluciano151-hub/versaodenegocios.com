import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { sendOrderShippedEmail } from '@/lib/email'
import { logError } from '@/lib/logger'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  const user = session?.user as { id?: string; type?: string } | undefined

  if (!session || !user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

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
  const session = await auth()
  if ((session?.user as { type?: string })?.type !== 'admin') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

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
    select: { status: true, customer: { select: { email: true, name: true } }, guestEmail: true, guestName: true, trackingNumber: true },
  })

  const order = await prisma.order.update({ where: { id }, data })

  // Audit log — record every status change
  if (status !== undefined && prevOrder?.status !== status) {
    try {
      const adminUser = session?.user as { id?: string } | undefined
      await prisma.auditLog.create({
        data: {
          userId: adminUser?.id ?? null,
          action: 'UPDATE_STATUS',
          entity: 'Order',
          entityId: id,
          oldData: { status: prevOrder?.status },
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
