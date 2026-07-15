import { NextRequest, NextResponse } from 'next/server'
import { requireCustomerSession } from '@/lib/customer-auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest) {
  let customer: { id: string; name: string; email: string; image?: string | null; type: string }
  try {
    customer = await requireCustomerSession()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const affiliate = await prisma.affiliate.findUnique({
    where: { customerId: customer.id },
    select: { id: true },
  })

  if (!affiliate) {
    return NextResponse.json({ error: 'Perfil de afiliado não encontrado.' }, { status: 404 })
  }

  const links = await prisma.affiliateLink.findMany({
    where: { affiliateId: affiliate.id },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(links)
}

export async function POST(req: NextRequest) {
  let customer: { id: string; name: string; email: string; image?: string | null; type: string }
  try {
    customer = await requireCustomerSession()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { name, targetType, targetId, url } = body

  if (!name || !url) {
    return NextResponse.json({ error: 'name e url são obrigatórios.' }, { status: 400 })
  }

  const affiliate = await prisma.affiliate.findUnique({
    where: { customerId: customer.id },
    select: { id: true, code: true, status: true },
  })

  if (!affiliate) {
    return NextResponse.json({ error: 'Perfil de afiliado não encontrado.' }, { status: 404 })
  }

  if (affiliate.status !== 'active') {
    return NextResponse.json(
      { error: 'O seu perfil de afiliado ainda não está activo.' },
      { status: 403 }
    )
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://versaodenegocios.com'
  const trackingUrl = `${baseUrl}${url.startsWith('/') ? url : '/' + url}?ref=${affiliate.code}`

  const link = await prisma.affiliateLink.create({
    data: {
      affiliateId: affiliate.id,
      name,
      targetType: targetType ?? null,
      targetId: targetId ?? null,
      url: trackingUrl,
      active: true,
    },
  })

  return NextResponse.json(link, { status: 201 })
}
