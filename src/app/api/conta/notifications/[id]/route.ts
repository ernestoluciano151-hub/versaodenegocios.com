import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCustomerSession } from '@/lib/customer-auth'

export async function PATCH(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getCustomerSession()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const { id } = await params
  // Only mark as read if belongs to this customer
  await prisma.notification.updateMany({
    where: { id, customerId: session.id },
    data: { read: true },
  })
  return NextResponse.json({ success: true })
}
