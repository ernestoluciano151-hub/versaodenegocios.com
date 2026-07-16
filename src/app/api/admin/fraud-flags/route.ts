import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

function requireAdmin(s: Awaited<ReturnType<typeof auth>>) {
  return (s?.user as { type?: string })?.type === 'admin'
}

export async function GET() {
  const session = await auth()
  if (!requireAdmin(session)) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const flags = await prisma.fraudFlag.findMany({
    include: { customer: { select: { id: true, name: true, email: true } } },
    orderBy: [{ resolved: 'asc' }, { createdAt: 'desc' }],
    take: 50,
  })
  return NextResponse.json(flags)
}

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!requireAdmin(session)) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const { id, resolved } = await req.json()
  const flag = await prisma.fraudFlag.update({
    where: { id },
    data: { resolved, resolvedAt: resolved ? new Date() : null },
  })
  return NextResponse.json(flag)
}
