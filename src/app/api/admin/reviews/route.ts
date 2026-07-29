import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { error: _authErr } = await requireAdmin(req)
  if (_authErr) return _authErr

  const { searchParams } = new URL(req.url)
  const approved = searchParams.get('approved')

  const reviews = await prisma.productReview.findMany({
    where: approved !== null ? { approved: approved === 'true' } : undefined,
    include: {
      product: { select: { name: true, slug: true } },
      customer: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  return NextResponse.json(reviews)
}

export async function PATCH(req: NextRequest) {
  const { error: _authErr } = await requireAdmin(req)
  if (_authErr) return _authErr

  const { id, approved } = await req.json()
  const review = await prisma.productReview.update({ where: { id }, data: { approved } })
  return NextResponse.json(review)
}

export async function DELETE(req: NextRequest) {
  const { error: _authErr } = await requireAdmin(req)
  if (_authErr) return _authErr

  const { id } = await req.json()
  await prisma.productReview.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
