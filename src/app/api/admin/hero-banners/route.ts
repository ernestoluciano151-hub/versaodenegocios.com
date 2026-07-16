import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

function requireAdmin(session: Awaited<ReturnType<typeof auth>>) {
  return (session?.user as { type?: string })?.type === 'admin'
}

export async function GET() {
  const session = await auth()
  if (!requireAdmin(session)) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const banners = await prisma.heroBanner.findMany({ orderBy: { order: 'asc' } })
  return NextResponse.json(banners)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!requireAdmin(session)) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await req.json()
  const banner = await prisma.heroBanner.create({ data: body })
  return NextResponse.json(banner, { status: 201 })
}
