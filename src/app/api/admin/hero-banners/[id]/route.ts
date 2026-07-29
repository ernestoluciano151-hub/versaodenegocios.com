import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error: _authErr } = await requireAdmin(req)
  if (_authErr) return _authErr

  const { id } = await params
  const body = await req.json()
  const banner = await prisma.heroBanner.update({ where: { id }, data: body })
  return NextResponse.json(banner)
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error: _authErr } = await requireAdmin(req)
  if (_authErr) return _authErr

  const { id } = await params
  await prisma.heroBanner.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
