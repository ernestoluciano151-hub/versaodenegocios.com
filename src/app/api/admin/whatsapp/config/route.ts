import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

function isAdmin(session: Awaited<ReturnType<typeof auth>>) {
  return session && (session.user as { type?: string })?.type === 'admin'
}

export async function GET() {
  const session = await auth()
  if (!isAdmin(session)) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const config = await prisma.whatsAppConfig.findFirst()
  return NextResponse.json(config ?? {})
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!isAdmin(session)) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const body = await req.json()
  const existing = await prisma.whatsAppConfig.findFirst()
  const config = existing
    ? await prisma.whatsAppConfig.update({ where: { id: existing.id }, data: body })
    : await prisma.whatsAppConfig.create({ data: body })
  return NextResponse.json(config)
}
