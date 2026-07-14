import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const session = await auth()
  const user = session?.user as { id?: string; type?: string } | undefined

  if (!session || !user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

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
