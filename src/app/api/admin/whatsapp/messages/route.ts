import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

function isAdmin(session: Awaited<ReturnType<typeof auth>>) {
  return session && (session.user as { type?: string })?.type === 'admin'
}

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!isAdmin(session)) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const page = Number(searchParams.get('page') ?? 1)
  const limit = 30
  const [messages, total] = await Promise.all([
    prisma.whatsAppMessage.findMany({
      include: { customer: { select: { name: true, phone: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.whatsAppMessage.count(),
  ])
  return NextResponse.json({ messages, total, pages: Math.ceil(total / limit) })
}
