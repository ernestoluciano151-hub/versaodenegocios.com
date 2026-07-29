import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin(req)
  if (error) return error

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
