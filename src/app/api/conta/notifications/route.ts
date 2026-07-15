import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireCustomerSession } from '@/lib/customer-auth'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  let customer
  try { customer = await requireCustomerSession() } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }

  const notifications = await prisma.notification.findMany({
    where: { customerId: customer.id },
    orderBy: { createdAt: 'desc' },
    take: 30,
  })

  const unreadCount = notifications.filter(n => !n.read).length

  return NextResponse.json({ notifications, unreadCount })
}

export async function PATCH(req: NextRequest) {
  let customer
  try { customer = await requireCustomerSession() } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }

  const result = await prisma.notification.updateMany({
    where: { customerId: customer.id, read: false },
    data: { read: true },
  })

  return NextResponse.json({ ok: true, updated: result.count })
}
