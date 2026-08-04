import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error: authError } = await requireAdmin(req)
  if (authError) return authError

  const { id } = await params
  const body = await req.json()

  const notification = await prisma.notification.update({
    where: { id },
    data: { read: body.read },
  })

  return NextResponse.json(notification)
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error: authError } = await requireAdmin(req)
  if (authError) return authError

  const { id } = await params
  await prisma.notification.delete({ where: { id } })

  return NextResponse.json({ ok: true })
}
