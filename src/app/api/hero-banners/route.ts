import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/** Public endpoint — returns active banners ordered by `order` */
export async function GET() {
  const banners = await prisma.heroBanner.findMany({
    where: { active: true },
    orderBy: { order: 'asc' },
  })
  return NextResponse.json(banners)
}
