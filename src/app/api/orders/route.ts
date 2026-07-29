import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { error: authError, session: authSession } = await requireAdmin(req)
  if (authError) return authError
  const user = authSession!.user as { id: string; type: string }

  const { searchParams } = req.nextUrl
  const status = searchParams.get('status')

  // Admins may pass ?customerId= to filter; customers always see their own orders
  const customerId = user.type === 'admin'
    ? (searchParams.get('customerId') ?? undefined)
    : user.id

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {}
  if (customerId) where.customerId = customerId
  if (status) where.status = status

  const orders = await prisma.order.findMany({
    where,
    include: {
      items: { include: { product: { select: { name: true, images: true } } } },
      payments: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(orders)
}
