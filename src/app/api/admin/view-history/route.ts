import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { error } = await requireAdmin(req)
  if (error) return error

  const views = await prisma.viewHistory.findMany({
    include: {
      customer: { select: { name: true, email: true } },
      product: { select: { name: true, slug: true } },
    },
    orderBy: { viewedAt: 'desc' },
    take: 100,
  })
  return NextResponse.json(views)
}
