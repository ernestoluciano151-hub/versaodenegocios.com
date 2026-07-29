import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getPaymentProvider, type PaymentMethodType } from '@/lib/payments'

export const dynamic = 'force-dynamic'

/**
 * GET /api/payments/verify?orderId=...&ref=...
 * Devolve o estado actual do pagamento de um pedido.
 * Usado pelo polling da página /pagamento/emis.
 *
 * Para Multicaixa Express (AppyPay), se o pagamento ainda estiver pendente,
 * consulta activamente a API de charges — assim a confirmação funciona
 * mesmo que o webhook falhe ou chegue atrasado.
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
    select: {
      id: true,
      paymentStatus: true,
      paymentMethod: true,
      transactionReference: true,
      orderId: true,
    },
  })

  if (!payment) {
    return NextResponse.json({ status: 'pending' })
  }

  // Verificação activa na AppyPay enquanto pendente
  if (
    payment.paymentStatus === 'pending' &&
    payment.paymentMethod === 'multicaixa_express' &&
    payment.transactionReference
  ) {
    try {
      const provider = getPaymentProvider(payment.paymentMethod as PaymentMethodType)
      const result = await provider.verifyPayment(payment.transactionReference)
      if (result.success) {
        await prisma.$transaction([
          prisma.payment.update({
            where: { id: payment.id },
            data: {
              paymentStatus: 'paid',
              paymentDate: new Date(),
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              gatewayResponse: (result.gatewayResponse ?? {}) as any,
            },
          }),
          prisma.order.update({
            where: { id: payment.orderId },
            data: { status: 'processing' },
          }),
        ])
        return NextResponse.json({
          status: 'paid',
          orderId: payment.orderId,
          transactionReference: payment.transactionReference,
        })
      }
    } catch { /* fica pendente — o webhook confirmará */ }
  }

  return NextResponse.json({
    status: payment.paymentStatus,
    orderId: payment.orderId,
    transactionReference: payment.transactionReference,
  })
}
