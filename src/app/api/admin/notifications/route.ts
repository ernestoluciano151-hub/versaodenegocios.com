import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminUser } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try { await requireAdminUser() } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }

  const { searchParams } = new URL(req.url)
  const read = searchParams.get('read')
  const type = searchParams.get('type')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')

  const where: Record<string, unknown> = {}
  if (read === 'true') where.read = true
  if (read === 'false') where.read = false
  if (type) where.type = type

  const [notifications, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { read: false } }),
  ])

  return NextResponse.json({ notifications, total, unreadCount, page, limit })
}

export async function POST(req: NextRequest) {
  try { await requireAdminUser() } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }

  const body = await req.json()
  const notification = await prisma.notification.create({
    data: {
      type: body.type,
      title: body.title,
      message: body.message,
      userId: body.userId ?? null,
      data: body.data ?? null,
    },
  })
  return NextResponse.json(notification, { status: 201 })
}
