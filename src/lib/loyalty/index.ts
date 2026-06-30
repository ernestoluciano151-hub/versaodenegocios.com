import { prisma } from '@/lib/prisma'
import type { LoyaltyTier, PointsTransactionType } from '@prisma/client'

// ─── Tier calculation ─────────────────────────────────────────────────────────

export function calcTier(points: number, config: { silverThreshold: number; goldThreshold: number; platinumThreshold: number }): LoyaltyTier {
  if (points >= config.platinumThreshold) return 'platinum'
  if (points >= config.goldThreshold) return 'gold'
  if (points >= config.silverThreshold) return 'silver'
  return 'bronze'
}

export const TIER_LABELS: Record<LoyaltyTier, string> = {
  bronze: '🥉 Bronze',
  silver: '🥈 Prata',
  gold: '🥇 Ouro',
  platinum: '💎 Platinum',
}

export const TIER_COLORS: Record<LoyaltyTier, string> = {
  bronze: 'bg-amber-100 text-amber-800',
  silver: 'bg-gray-100 text-gray-700',
  gold: 'bg-yellow-100 text-yellow-800',
  platinum: 'bg-purple-100 text-purple-800',
}

// ─── Get or create loyalty account ────────────────────────────────────────────

export async function getOrCreateAccount(customerId: string) {
  const existing = await prisma.loyaltyAccount.findUnique({ where: { customerId } })
  if (existing) return existing
  return prisma.loyaltyAccount.create({
    data: { customerId },
  })
}

// ─── Add points ───────────────────────────────────────────────────────────────

export async function addPoints(
  customerId: string,
  points: number,
  type: PointsTransactionType,
  description: string,
  orderId?: string,
): Promise<void> {
  const config = await getConfig()
  const account = await getOrCreateAccount(customerId)
  const newTotal = account.points + points
  const newTier = calcTier(newTotal, config)

  await prisma.$transaction([
    prisma.loyaltyAccount.update({
      where: { id: account.id },
      data: { points: newTotal, tier: newTier, tierUpdatedAt: newTier !== account.tier ? new Date() : undefined },
    }),
    prisma.pointsTransaction.create({
      data: {
        customerId,
        loyaltyAccountId: account.id,
        type,
        points,
        description,
        orderId: orderId ?? null,
      },
    }),
  ])
}

// ─── Redeem points ────────────────────────────────────────────────────────────

export async function redeemPoints(
  customerId: string,
  points: number,
  type: PointsTransactionType,
  description: string,
): Promise<{ success: boolean; error?: string }> {
  const account = await getOrCreateAccount(customerId)
  if (account.points < points) {
    return { success: false, error: 'Pontos insuficientes' }
  }
  const config = await getConfig()
  const newTotal = account.points - points
  const newTier = calcTier(newTotal, config)

  await prisma.$transaction([
    prisma.loyaltyAccount.update({
      where: { id: account.id },
      data: { points: newTotal, pointsUsed: account.pointsUsed + points, tier: newTier },
    }),
    prisma.pointsTransaction.create({
      data: {
        customerId,
        loyaltyAccountId: account.id,
        type,
        points: -points,
        description,
      },
    }),
  ])

  return { success: true }
}

// ─── Points from purchase ─────────────────────────────────────────────────────

export async function awardPurchasePoints(customerId: string, totalAOA: number, orderId: string) {
  const config = await getConfig()
  const points = Math.floor(totalAOA * Number(config.pointsPerKwanza))
  if (points <= 0) return
  await addPoints(customerId, points, 'earned_purchase', `Compra #${orderId} — ${totalAOA} AOA`, orderId)
}

// ─── Config helpers ───────────────────────────────────────────────────────────

export async function getConfig() {
  const cfg = await prisma.loyaltyConfig.findFirst()
  if (cfg) return cfg
  return prisma.loyaltyConfig.create({ data: {} })
}

export async function pointsToKwanza(points: number): Promise<number> {
  const config = await getConfig()
  return Math.floor(points * Number(config.kwanzaPerPoint))
}
