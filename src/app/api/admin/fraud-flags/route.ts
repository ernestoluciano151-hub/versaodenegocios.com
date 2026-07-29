import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { error: _authErr } = await requireAdmin(req)
  if (_authErr) return _authErr
  const flags = await prisma.fraudFlag.findMany({
    include: { customer: { select: { id: true, name: true, email: true } } },
    orderBy: [{ resolved: 'asc' }, { createdAt: 'desc' }],
    take: 50,
  })
  return NextResponse.json(flags)
}

export async function PATCH(req: NextRequest) {
  const { error: _authErr } = await requireAdmin(req)
  if (_authErr) return _authErr
  const { id, resolved } = await req.json()
  const flag = await prisma.fraudFlag.update({
    where: { id },
    data: { resolved, resolvedAt: resolved ? new Date() : null },
  })
  return NextResponse.json(flag)
}
