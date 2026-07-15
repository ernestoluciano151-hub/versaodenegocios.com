import { NextRequest, NextResponse } from 'next/server'
import { requireAdminUser } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminUser()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const body = await req.json()

  const validStatuses = [
    'pending', 'awaiting_quote', 'quote_sent', 'approved', 'in_progress',
    'production', 'quality_check', 'ready', 'delivered', 'cancelled',
  ]

  if (!validStatuses.includes(body.status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  return NextResponse.json({ id, status: body.status, updatedAt: new Date().toISOString() })
}
