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

  const order = await prisma.customOrder.findUnique({
    where: { id },
    include: {
      messages: { orderBy: { createdAt: 'asc' } },
    },
  })

  if (!order || order.customerId !== customer.id || order.deletedAt) {
    return NextResponse.json({ error: 'Encomenda não encontrada.' }, { status: 404 })
  }

  return NextResponse.json(order)
}
