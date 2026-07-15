import { NextRequest, NextResponse } from 'next/server'
import { requireAdminUser } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    await requireAdminUser()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const q = searchParams.get('q')
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20')))
  const skip = (page - 1) * limit

  const where: Record<string, unknown> = { deletedAt: null }

  if (status && status !== 'all') {
    where.status = status
  }

  if (q) {
    where.OR = [
      { reference: { contains: q, mode: 'insensitive' } },
      { productName: { contains: q, mode: 'insensitive' } },
      { customer: { name: { contains: q, mode: 'insensitive' } } },
      { customer: { email: { contains: q, mode: 'insensitive' } } },
    ]
  }

  const [orders, total, allOrders] = await Promise.all([
    prisma.customOrder.findMany({
      include: {
        customer: { select: { name: true, email: true, phone: true } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.customOrder.count({ where }),
    prisma.customOrder.groupBy({
      by: ['status'],
      where: { deletedAt: null },
      _count: { _all: true },
    }),
  ])

  const statusMap: Record<string, number> = {}
  for (const row of allOrders) {
    statusMap[row.status] = row._count._all
  }

  const stats = {
    received: statusMap['received'] ?? 0,
    analyzing: statusMap['analyzing'] ?? 0,
    negotiating: statusMap['negotiating'] ?? 0,
    approved: statusMap['approved'] ?? 0,
    rejected: statusMap['rejected'] ?? 0,
    purchasing: statusMap['purchasing'] ?? 0,
    in_transit: statusMap['in_transit'] ?? 0,
    delivered: statusMap['delivered'] ?? 0,
    cancelled: statusMap['cancelled'] ?? 0,
  }

  return NextResponse.json({ orders, total, stats })
}

export async function POST(req: NextRequest) {
  try {
    await requireAdminUser()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const {
    customerId,
    productName,
    categoryId,
    origin,
    productLink,
    quantity,
    color,
    model,
    size,
    notes,
    budget,
  } = body

  if (!customerId || !productName || !origin || !quantity) {
    return NextResponse.json(
      { error: 'customerId, productName, origin e quantity são obrigatórios.' },
      { status: 400 }
    )
  }

  const year = new Date().getFullYear()
  const count = await prisma.customOrder.count()
  const reference = `EP-${year}-${String(count + 1).padStart(4, '0')}`

  const order = await prisma.customOrder.create({
    data: {
      customerId,
      productName,
      categoryId: categoryId ?? null,
      origin,
      productLink: productLink ?? null,
      quantity: parseInt(quantity),
      color: color ?? null,
      model: model ?? null,
      size: size ?? null,
      notes: notes ?? null,
      budget: budget ? parseFloat(budget) : null,
      reference,
      status: 'received',
    },
  })

  return NextResponse.json(order, { status: 201 })
}
