import { NextRequest, NextResponse } from 'next/server'
import { requireAdminUser } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

// Shared in-memory store (same module scope as parent route in production replace with DB)
// For now returns success stub
export async function POST(
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

  const message = {
    id: `msg_${Date.now()}`,
    orderId: id,
    author: 'admin',
    text: body.text,
    createdAt: new Date().toISOString(),
  }

  return NextResponse.json(message, { status: 201 })
}
