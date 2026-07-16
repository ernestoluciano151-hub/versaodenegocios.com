import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCustomerSession } from '@/lib/customer-auth'

export const dynamic = 'force-dynamic'

/** GET — list approved reviews for a product */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const product = await prisma.product.findUnique({ where: { slug }, select: { id: true } })
  if (!product) return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 })

  const reviews = await prisma.productReview.findMany({
    where: { productId: product.id, approved: true },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, rating: true, title: true, body: true, createdAt: true, guestName: true,
      customer: { select: { name: true } },
    },
  })

  const avg = reviews.length
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : 0

  return NextResponse.json({ reviews, average: avg, total: reviews.length })
}

/** POST — submit a review */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const product = await prisma.product.findUnique({ where: { slug }, select: { id: true } })
  if (!product) return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 })

  const body = await req.json()
  const { rating, title, body: reviewBody, guestName } = body

  if (!rating || rating < 1 || rating > 5) return NextResponse.json({ error: 'Classificação inválida (1–5)' }, { status: 400 })
  if (!reviewBody || reviewBody.trim().length < 10) return NextResponse.json({ error: 'Comentário muito curto (mínimo 10 caracteres)' }, { status: 400 })

  const session = await getCustomerSession().catch(() => null)

  const review = await prisma.productReview.create({
    data: {
      productId: product.id,
      customerId: session?.id ?? null,
      guestName: session ? null : (guestName?.trim() || 'Anónimo'),
      rating: Number(rating),
      title: title?.trim() || null,
      body: reviewBody.trim(),
      approved: false, // requires admin moderation
    },
  })

  return NextResponse.json({ ok: true, id: review.id, message: 'Avaliação enviada. Será publicada após moderação.' }, { status: 201 })
}
