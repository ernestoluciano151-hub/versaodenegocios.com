import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireCustomer } from '@/lib/customer-auth'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { error: authError, customer: session } = await requireCustomer(req)
  if (authError) return authError
  const items = await prisma.wishlist.findMany({
    where: { customerId: session!.id },
    take: 100,
    include: { product: { include: { category: { select: { name: true } } } } },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(items)
}
