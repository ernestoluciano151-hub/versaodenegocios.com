import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  try { await requireAdmin() } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }

  const stats = await prisma.notification.groupBy({
    by: ['type'],
    where: { read: false, customerId: null },
    _count: { id: true },
  })

  const total = stats.reduce((sum, s) => sum + s._count.id, 0)

  return NextResponse.json({ total, byType: stats })
}
