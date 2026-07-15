import { NextRequest, NextResponse } from 'next/server'
import { requireAdminUser } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminUser()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const links = await prisma.affiliateLink.findMany({
    where: { affiliateId: id },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(links)
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminUser()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const body = await req.json()
  const { name, targetType, targetId, url } = body

  if (!name || !url) {
    return NextResponse.json({ error: 'name e url são obrigatórios.' }, { status: 400 })
  }

  const affiliate = await prisma.affiliate.findUnique({
    where: { id },
    select: { id: true, code: true },
  })

  if (!affiliate) {
    return NextResponse.json({ error: 'Afiliado não encontrado.' }, { status: 404 })
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://versaodenegocios.com'
  const trackingUrl = `${baseUrl}${url.startsWith('/') ? url : '/' + url}?ref=${affiliate.code}`

  const link = await prisma.affiliateLink.create({
    data: {
      affiliateId: id,
      name,
      targetType: targetType ?? null,
      targetId: targetId ?? null,
      url: trackingUrl,
      active: true,
    },
  })

  return NextResponse.json(link, { status: 201 })
}
