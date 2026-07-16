import { NextRequest, NextResponse } from 'next/server'
import { requireCustomerSession } from '@/lib/customer-auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

function generateCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

export async function GET(_req: NextRequest) {
  let customer: { id: string; name: string; email: string; image?: string | null; type: string }
  try {
    customer = await requireCustomerSession()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let affiliate
  try {
    affiliate = await prisma.affiliate.findUnique({
      where: { customerId: customer.id },
      include: {
        commissions: { orderBy: { createdAt: 'desc' }, take: 10 },
        links: { where: { active: true } },
        payoutRequests: { orderBy: { createdAt: 'desc' }, take: 5 },
      },
    })
  } catch (err) {
    console.error('Affiliate GET error:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }

  if (!affiliate) {
    return NextResponse.json(null)
  }

  const conversionRate =
    affiliate.totalClicks > 0
      ? ((affiliate.totalSales / affiliate.totalClicks) * 100).toFixed(1)
      : '0'

  return NextResponse.json({
    ...affiliate,
    conversionRate,
    clicks: [],
    _count: { commissions: affiliate.commissions.length, clicks: affiliate.totalClicks, referrals: affiliate.totalSales },
  })
}

export async function POST(_req: NextRequest) {
  let customer: { id: string; name: string; email: string; image?: string | null; type: string }
  try {
    customer = await requireCustomerSession()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const existing = await prisma.affiliate.findUnique({ where: { customerId: customer.id } })
  if (existing) {
    return NextResponse.json({ error: 'Já tem um perfil de afiliado.' }, { status: 409 })
  }

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
      customerId: customer.id,
      code,
      link,
      status: 'pending',
    },
  })

  return NextResponse.json(affiliate, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  let customer: { id: string; name: string; email: string; image?: string | null; type: string }
  try {
    customer = await requireCustomerSession()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { paymentDetails } = body

  if (!paymentDetails) {
    return NextResponse.json({ error: 'paymentDetails é obrigatório.' }, { status: 400 })
  }

  const affiliate = await prisma.affiliate.findUnique({
    where: { customerId: customer.id },
    select: { id: true },
  })

  if (!affiliate) {
    return NextResponse.json({ error: 'Perfil de afiliado não encontrado.' }, { status: 404 })
  }

  const updated = await prisma.affiliate.update({
    where: { id: affiliate.id },
    data: { paymentDetails },
  })

  return NextResponse.json(updated)
}
