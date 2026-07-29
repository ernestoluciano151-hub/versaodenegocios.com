import { NextRequest, NextResponse } from 'next/server'
import { requireCustomer } from '@/lib/customer-auth'
import { prisma } from '@/lib/prisma'
import { getOrCreateAccount, getConfig, TIER_LABELS, TIER_COLORS } from '@/lib/loyalty'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { error: _authErr, customer: customerSession } = await requireCustomer(req)
  if (_authErr) return _authErr

  const [account, transactions, config] = await Promise.all([
    getOrCreateAccount(customerSession.id!),
    prisma.pointsTransaction.findMany({
      where: { customerId: customerSession.id! },
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
