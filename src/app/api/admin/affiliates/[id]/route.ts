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

  const affiliate = await prisma.affiliate.findUnique({
    where: { id },
    include: {
      customer: { select: { name: true, email: true, phone: true } },
      commissions: { orderBy: { createdAt: 'desc' }, take: 20 },
      clicks: { orderBy: { createdAt: 'desc' }, take: 10 },
      links: { where: { active: true } },
      payoutRequests: { orderBy: { createdAt: 'desc' }, take: 10 },
      _count: { select: { commissions: true, clicks: true, referrals: true } },
    },
  })

  if (!affiliate) {
    return NextResponse.json({ error: 'Afiliado não encontrado.' }, { status: 404 })
  }

  return NextResponse.json(affiliate)
}

export async function PATCH(
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

  const data: Record<string, unknown> = {}
  if (body.commissionRate !== undefined) data.commissionRate = parseFloat(body.commissionRate)
  if (body.commissionType !== undefined) data.commissionType = body.commissionType
  if (body.status !== undefined) data.status = body.status
  if (body.notes !== undefined) data.notes = body.notes
  if (body.cookieDays !== undefined) data.cookieDays = parseInt(body.cookieDays)

  const affiliate = await prisma.affiliate.update({
    where: { id },
    data,
  })

  return NextResponse.json(affiliate)
}
