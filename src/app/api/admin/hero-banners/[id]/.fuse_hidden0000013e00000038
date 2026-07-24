import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

function requireAdmin(session: Awaited<ReturnType<typeof auth>>) {
  return (session?.user as { type?: string })?.type === 'admin'
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!requireAdmin(session)) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const banner = await prisma.heroBanner.update({ where: { id }, data: body })
  return NextResponse.json(banner)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!requireAdmin(session)) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params
  await prisma.heroBanner.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
