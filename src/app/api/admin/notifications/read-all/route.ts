import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

export async function PATCH() {
  try { await requireAdmin() } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }

  const result = await prisma.notification.updateMany({
    where: { read: false, customerId: null },
    data: { read: true },
  })

  return NextResponse.json({ ok: true, updated: result.count })
}
