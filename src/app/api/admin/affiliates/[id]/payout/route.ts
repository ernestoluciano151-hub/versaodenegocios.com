import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const payouts = await prisma.affiliatePayoutRequest.findMany({
    where: { affiliateId: id },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(payouts)
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const body = await req.json()
  const { amount, method, details, notes } = body

  if (!amount || parseFloat(amount) <= 0) {
    return NextResponse.json({ error: 'O montante deve ser superior a zero.' }, { status: 400 })
  }

  if (!method) {
    return NextResponse.json({ error: 'O método de pagamento é obrigatório.' }, { status: 400 })
  }

  const affiliate = await prisma.affiliate.findUnique({
    where: { id },
    select: { id: true, totalPaid: true },
  })

  if (!affiliate) {
    return NextResponse.json({ error: 'Afiliado não encontrado.' }, { status: 404 })
  }

  const parsedAmount = parseFloat(amount)

  const [payout] = await prisma.$transaction([
    prisma.affiliatePayoutRequest.create({
      data: {
        affiliateId: id,
        amount: parsedAmount,
        method,
        details: details ?? null,
        notes: notes ?? null,
        status: 'approved',
        processedAt: new Date(),
      },
    }),
    prisma.affiliate.update({
      where: { id },
      data: {
        totalPaid: { increment: parsedAmount },
        balance: { decrement: parsedAmount },
      },
    }),
  ])

  return NextResponse.json(payout, { status: 201 })
}
