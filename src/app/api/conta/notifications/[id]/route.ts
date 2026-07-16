import { NextRequest, NextResponse } from 'next/server'
import { requireCustomerSession } from '@/lib/customer-auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let customer
  try { customer = await requireCustomerSession() } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await params
  const notification = await prisma.notification.updateMany({
    where: { id, customerId: customer.id },
    data: { read: true },
  })
  return NextResponse.json({ ok: true, updated: notification.count })
}
