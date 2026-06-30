import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const [totalOrders, monthRevenue, totalCustomers, lowStock, topProducts] = await Promise.all([
    prisma.order.count({ where: { status: { not: 'cancelled' } } }),
    prisma.order.aggregate({
      _sum: { total: true },
      where: { createdAt: { gte: startOfMonth }, status: { not: 'cancelled' } },
    }),
    prisma.customer.count({ where: { active: true } }),
    prisma.product.count({ where: { active: true, stock: { lte: 5 } } }),
    prisma.orderItem.groupBy({
      by: ['productId'],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 5,
    }),
  ])

  return NextResponse.json({
    totalOrders,
    monthRevenue: Number(monthRevenue._sum.total ?? 0),
    totalCustomers,
    lowStock,
    topProducts,
  })
}
