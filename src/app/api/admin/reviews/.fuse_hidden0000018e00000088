import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

function requireAdmin(session: Awaited<ReturnType<typeof auth>>) {
  return (session?.user as { type?: string })?.type === 'admin'
}

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!requireAdmin(session)) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

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
  const session = await auth()
  if (!requireAdmin(session)) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id, approved } = await req.json()
  const review = await prisma.productReview.update({ where: { id }, data: { approved } })
  return NextResponse.json(review)
}

export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!requireAdmin(session)) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await req.json()
  await prisma.productReview.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
