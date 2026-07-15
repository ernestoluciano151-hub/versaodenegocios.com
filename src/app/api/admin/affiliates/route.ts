import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

function generateCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

export async function GET(req: NextRequest) {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const q = searchParams.get('q')
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
  const limit = 20
  const skip = (page - 1) * limit

  const where: Record<string, unknown> = {}

  if (status && status !== 'all') {
    where.status = status
  }

  if (q) {
    where.OR = [
      { code: { contains: q, mode: 'insensitive' } },
      { customer: { name: { contains: q, mode: 'insensitive' } } },
      { customer: { email: { contains: q, mode: 'insensitive' } } },
    ]
  }

  const [affiliates, total, allStats] = await Promise.all([
    prisma.affiliate.findMany({
      where,
      include: {
        customer: { select: { name: true, email: true, phone: true } },
        _count: { select: { commissions: true, clicks: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.affiliate.count({ where }),
    prisma.affiliate.groupBy({
      by: ['status'],
      _count: { _all: true },
    }),
  ])

  const statusMap: Record<string, number> = {}
  for (const row of allStats) {
    statusMap[row.status] = row._count._all
  }

  const stats = {
    total: await prisma.affiliate.count(),
    active: statusMap['active'] ?? 0,
    pending: statusMap['pending'] ?? 0,
    suspended: statusMap['suspended'] ?? 0,
  }

  return NextResponse.json({ affiliates, total, stats })
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { customerId, commissionType, commissionRate, cookieDays } = body

  if (!customerId || !commissionType || commissionRate === undefined) {
    return NextResponse.json(
      { error: 'customerId, commissionType e commissionRate são obrigatórios.' },
      { status: 400 }
    )
  }

  const existing = await prisma.affiliate.findUnique({ where: { customerId } })
  if (existing) {
    return NextResponse.json({ error: 'Este cliente já tem um perfil de afiliado.' }, { status: 409 })
  }

  // Gera código único
  let code = generateCode()
  let attempts = 0
  while (attempts < 10) {
    const conflict = await prisma.affiliate.findUnique({ where: { code } })
    if (!conflict) break
    code = generateCode()
    attempts++
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://versaodenegocios.com'
  const link = `${baseUrl}?ref=${code}`

  const affiliate = await prisma.affiliate.create({
    data: {
      customerId,
      code,
      link,
      commissionType,
      commissionRate: parseFloat(commissionRate),
      cookieDays: cookieDays ? parseInt(cookieDays) : 30,
      status: 'active',
    },
  })

  return NextResponse.json(affiliate, { status: 201 })
}
