import { NextRequest, NextResponse } from 'next/server'
import { requireCustomer } from '@/lib/customer-auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error: authError, customer } = await requireCustomer(req)
  if (authError) return authError
  const { id } = await params
  const notification = await prisma.notification.findFirst({
    where: { id, customerId: customer.id },
  })
  if (!notification) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })
  return NextResponse.json(notification)
}

export async function PATCH(req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error: authError, customer } = await requireCustomer(req)
  if (authError) return authError
  const { id } = await params
  const notification = await prisma.notification.updateMany({
    where: { id, customerId: customer.id },
    data: { read: true },
  })
  return NextResponse.json({ ok: true, updated: notification.count })
}
