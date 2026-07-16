import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-auth'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin()
  if (error) return NextResponse.json({ error }, { status: 401 })

  const { id } = await params

  const payment = await prisma.payment.update({
    where: { id },
    data: { paymentStatus: 'paid', paymentDate: new Date() },
  })

  // Update order status
  await prisma.order.update({
    where: { id: payment.orderId },
    data: { status: 'confirmed' },
  })

  return NextResponse.json(payment)
}
