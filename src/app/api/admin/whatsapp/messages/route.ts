import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {

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
