import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET() {
  const session = await auth()
  if ((session?.user as { type?: string })?.type !== 'admin') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const affiliates = await prisma.affiliate.findMany({
    include: {
      customer: { select: { name: true, email: true, phone: true } },
      _count: { select: { clicks: true, referrals: true, commissions: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(affiliates)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if ((session?.user as { type?: string })?.type !== 'admin') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }
  const body = await req.json()
  const affiliate = await prisma.affiliate.update({
    where: { id: body.id },
    data: {
      status: body.status,
      commissionType: body.commissionType,
      commissionRate: body.commissionRate,
      cookieDays: body.cookieDays,
      notes: body.notes,
    },
  })
  return NextResponse.json(affiliate)
}
