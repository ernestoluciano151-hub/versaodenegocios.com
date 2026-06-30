import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getOrCreateAccount, getConfig, TIER_LABELS, TIER_COLORS } from '@/lib/loyalty'

export async function GET() {
  const session = await auth()
  const user = session?.user as { id?: string; type?: string } | undefined
  if (!session || user?.type !== 'customer') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const [account, transactions, config] = await Promise.all([
    getOrCreateAccount(user.id!),
    prisma.pointsTransaction.findMany({
      where: { customerId: user.id! },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
    getConfig(),
  ])

  return NextResponse.json({
    account,
    transactions,
    config,
    tierLabel: TIER_LABELS[account.tier],
    tierColor: TIER_COLORS[account.tier],
    nextTier: account.tier === 'bronze' ? { name: 'Prata', pointsNeeded: config.silverThreshold - account.points }
      : account.tier === 'silver' ? { name: 'Ouro', pointsNeeded: config.goldThreshold - account.points }
      : account.tier === 'gold' ? { name: 'Platinum', pointsNeeded: config.platinumThreshold - account.points }
      : null,
  })
}
