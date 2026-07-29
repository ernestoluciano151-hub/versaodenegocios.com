import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { error } = await requireAdmin(req)
  if (error) return error

  const banners = await prisma.heroBanner.findMany({
    orderBy: { order: 'asc' },
    take: 50,
  })
  return NextResponse.json(banners)
}

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin(req)
  if (error) return error

  const body = await req.json()
  const banner = await prisma.heroBanner.create({ data: body })
  return NextResponse.json(banner, { status: 201 })
}
