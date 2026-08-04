import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

export async function PATCH(req: NextRequest) {
  const { error: authError } = await requireAdmin(req)
  if (authError) return authError

  const result = await prisma.notification.updateMany({
    where: { read: false, customerId: null },
    data: { read: true },
  })

  return NextResponse.json({ ok: true, updated: result.count })
}
