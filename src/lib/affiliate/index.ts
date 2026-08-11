import type { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

export const AFFILIATE_COOKIE = 'vn_aff'

/**
 * Gera a comissão de afiliado para um pedido, se o cliente chegou através
 * de um link de afiliado (cookie definido por /api/affiliate/track).
 *
 * Sem isto, o painel admin de Afiliados nunca recebia vendas nem comissões
 * — só mostrava o que estivesse na base de dados, que nunca era escrito.
 */
export async function createCommissionForOrder(
  req: NextRequest,
  params: { orderId: string; customerId?: string; total: number },
): Promise<void> {
  const code = req.cookies.get(AFFILIATE_COOKIE)?.value
  if (!code) return

  const affiliate = await prisma.affiliate.findUnique({
    where: { code },
    select: { id: true, customerId: true, status: true, commissionType: true, commissionRate: true },
  })
  if (!affiliate || affiliate.status !== 'active') return

  // Não permitir que o afiliado ganhe comissão sobre as próprias compras
  if (params.customerId && affiliate.customerId === params.customerId) return

  const rate = Number(affiliate.commissionRate)
  const amount = affiliate.commissionType === 'percentage'
    ? Math.round(params.total * (rate / 100) * 100) / 100
    : rate
  if (amount <= 0) return

  await prisma.$transaction([
    prisma.affiliateCommission.create({
      data: {
        affiliateId: affiliate.id,
        orderId: params.orderId,
        amount,
        rate,
        status: 'pending',
      },
    }),
    prisma.affiliate.update({
      where: { id: affiliate.id },
      data: {
        totalSales: { increment: 1 },
        totalEarned: { increment: amount },
        balance: { increment: amount },
      },
    }),
  ])
}

/**
 * Reverte a comissão de um pedido cancelado — espelha revokePointsForOrder.
 */
export async function cancelCommissionForOrder(orderId: string): Promise<void> {
  const commission = await prisma.affiliateCommission.findFirst({
    where: { orderId, status: { not: 'cancelled' } },
  })
  if (!commission) return

  const affiliate = await prisma.affiliate.findUnique({
    where: { id: commission.affiliateId },
    select: { totalSales: true, totalEarned: true, balance: true },
  })
  if (!affiliate) return

  const amount = Number(commission.amount)

  await prisma.$transaction([
    prisma.affiliateCommission.update({
      where: { id: commission.id },
      data: { status: 'cancelled' },
    }),
    prisma.affiliate.update({
      where: { id: commission.affiliateId },
      data: {
        totalSales: { decrement: Math.min(1, affiliate.totalSales) },
        totalEarned: { decrement: Math.min(amount, Number(affiliate.totalEarned)) },
        balance: { decrement: Math.min(amount, Number(affiliate.balance)) },
      },
    }),
  ])
}
