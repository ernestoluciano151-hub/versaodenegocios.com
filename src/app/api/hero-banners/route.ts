import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Revalidate at most once per 5 minutes — banners change rarely
export const revalidate = 300

/** Public endpoint — returns active banners ordered by `order` */
export async function GET() {
  const banners = await prisma.heroBanner.findMany({
    where: { active: true },
    orderBy: { order: 'asc' },
  })
  return NextResponse.json(banners, {
    headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
  })
}
