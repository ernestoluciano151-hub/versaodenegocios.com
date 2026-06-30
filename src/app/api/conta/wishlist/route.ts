import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCustomerSession } from '@/lib/customer-auth'

export async function GET() {
  const session = await getCustomerSession()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const items = await prisma.wishlist.findMany({
    where: { customerId: session.id },
    include: { product: { include: { category: { select: { name: true } } } } },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(items)
}
