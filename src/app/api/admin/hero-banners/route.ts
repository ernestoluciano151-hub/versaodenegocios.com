import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

function requireAdmin(session: Awaited<ReturnType<typeof auth>>) {
  return (session?.user as { type?: string })?.type === 'admin'
}

export async function GET(req: NextRequest) {
  const { error: _authErr } = await requireAdmin(req)
  if (_authErr) return _authErr

  const banners = await prisma.heroBanner.findMany({ orderBy: { order: 'asc'     take: 50,
  } })
  return NextResponse.json(banners)
}

export async function POST(req: NextRequest) {
  const { error: _authErr } = await requireAdmin(req)
  if (_authErr) return _authErr

  const body = await req.json()
  const banner = await prisma.heroBanner.create({ data: body })
  return NextResponse.json(banner, { status: 201 })
}
