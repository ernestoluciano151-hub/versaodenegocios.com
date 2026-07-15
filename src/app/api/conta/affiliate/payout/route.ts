import { NextRequest, NextResponse } from 'next/server'
import { requireCustomerSession } from '@/lib/customer-auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  let customer: { id: string; name: string; email: string; image?: string | null; type: string }
  try {
    customer = await requireCustomerSession()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { amount, method, details } = body

  if (!amount || parseFloat(amount) <= 0) {
    return NextResponse.json({ error: 'O montante deve ser superior a zero.' }, { status: 400 })
  }

  if (!method) {
    return NextResponse.json({ error: 'O método de pagamento é obrigatório.' }, { status: 400 })
  }

  const affiliate = await prisma.affiliate.findUnique({
    where: { customerId: customer.id },
    select: { id: true, balance: true, status: true },
  })

  if (!affiliate) {
    return NextResponse.json({ error: 'Perfil de afiliado não encontrado.' }, { status: 404 })
  }

  if (affiliate.status !== 'active') {
    return NextResponse.json(
      { error: 'O seu perfil de afiliado não está activo.' },
      { status: 403 }
    )
  }

  const parsedAmount = parseFloat(amount)

  if (parsedAmount > (affiliate.balance ?? 0)) {
    return NextResponse.json(
      { error: 'Saldo insuficiente. O montante solicitado é superior ao saldo disponível.' },
      { status: 400 }
    )
  }

  const [payout] = await prisma.$transaction([
    prisma.affiliatePayoutRequest.create({
      data: {
        affiliateId: affiliate.id,
        amount: parsedAmount,
        method,
        details: details ?? null,
        status: 'pending',
      },
    }),
    prisma.affiliate.update({
      where: { id: affiliate.id },
      data: {
        pendingBalance: { increment: parsedAmount },
        balance: { decrement: parsedAmount },
      },
    }),
  ])

  return NextResponse.json(payout, { status: 201 })
}
