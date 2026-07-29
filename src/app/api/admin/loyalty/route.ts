import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'
import { getConfig, addPoints } from '@/lib/loyalty'

export const dynamic = 'force-dynamic'

export async function GET() {


  const [config, totalAccounts, totalPoints] = await Promise.all([
    getConfig(),
    prisma.loyaltyAccount.count(),
    prisma.loyaltyAccount.aggregate({ _sum: { points: true } }),
  ])

  const tierBreakdown = await prisma.loyaltyAccount.groupBy({
    by: ['tier'],
    _count: { _all: true },
  })

  return NextResponse.json({ config, totalAccounts, totalPoints: totalPoints._sum.points ?? 0, tierBreakdown })
}

export async function POST(req: NextRequest) {


  const body = await req.json()

  if (body.action === 'award') {
    await addPoints(body.customerId, body.points, 'adjusted', body.description ?? 'Ajuste manual (admin)')
    return NextResponse.json({ ok: true })
  }

  const existing = await prisma.loyaltyConfig.findFirst()
  const config = existing
    ? await prisma.loyaltyConfig.update({ where: { id: existing.id }, data: body })
    : await prisma.loyaltyConfig.create({ data: body })
  return NextResponse.json(config)
}
