import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/payments/verify?orderId=...&ref=...
 * Devolve o estado actual do pagamento de um pedido.
 * Usado pelo polling da página /pagamento/emis.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const orderId = searchParams.get('orderId')
  const ref = searchParams.get('ref')

  if (!orderId && !ref) {
    return NextResponse.json({ error: 'orderId ou ref obrigatório.' }, { status: 400 })
  }

  const payment = await prisma.payment.findFirst({
    where: orderId
      ? { orderId }
      : { transactionReference: { contains: ref! } },
    orderBy: { createdAt: 'desc' },
    select: { paymentStatus: true, transactionReference: true, orderId: true },
  })

  if (!payment) {
    return NextResponse.json({ status: 'pending' })
  }

  return NextResponse.json({
    status: payment.paymentStatus,
    orderId: payment.orderId,
    transactionReference: payment.transactionReference,
  })
}
