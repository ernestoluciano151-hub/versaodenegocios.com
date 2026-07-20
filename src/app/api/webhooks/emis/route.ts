import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logError } from '@/lib/logger'

/**
 * Webhook / Callback da EMIS GPO
 *
 * A EMIS envia uma notificação POST quando o estado de um pagamento muda.
 * O endpoint actualiza o Payment e o Order correspondente.
 *
 * URL a configurar no portal EMIS:
 *   https://versaodenegocios.com/api/webhooks/emis
 */

interface EmisWebhookPayload {
  transactionId?: string
  referenceId?: string
  orderId?: string
  status?: string
  paymentStatus?: string
  amount?: number
  currency?: string
  paidAt?: string
  [key: string]: unknown
}

// Mapa de status EMIS → status interno
function mapStatus(emisStatus: string): 'pending' | 'paid' | 'failed' | 'cancelled' {
  const s = emisStatus.toUpperCase()
  if (['PAID', 'SUCCESS', 'CONFIRMED', 'COMPLETED'].includes(s)) return 'paid'
  if (['FAILED', 'ERROR'].includes(s)) return 'failed'
  if (['CANCELLED', 'CANCELED', 'EXPIRED'].includes(s)) return 'cancelled'
  return 'pending'
}

export async function POST(req: NextRequest) {
  let payload: EmisWebhookPayload
  try {
    payload = (await req.json()) as EmisWebhookPayload
  } catch {
    return NextResponse.json({ error: 'Payload inválido.' }, { status: 400 })
  }

  // Verificação de assinatura (activar quando a EMIS disponibilizar)
  // const signature = req.headers.get('x-emis-signature') ?? ''
  // const webhookSecret = process.env.EMIS_WEBHOOK_SECRET
  // if (webhookSecret) { ... verify HMAC ... }

  const transactionRef =
    payload.transactionId ?? payload.referenceId ?? payload.orderId
  const emisStatus = payload.status ?? payload.paymentStatus ?? 'UNKNOWN'

  if (!transactionRef) {
    return NextResponse.json({ error: 'transactionId em falta.' }, { status: 400 })
  }

  const internalStatus = mapStatus(emisStatus)

  try {
    // Encontrar o registo de pagamento pela referência
    const payment = await prisma.payment.findFirst({
      where: { transactionReference: { contains: transactionRef } },
      select: { id: true, orderId: true, paymentStatus: true },
    })

    if (!payment) {
      // Pode ser callback de teste — aceitar silenciosamente
      return NextResponse.json({ received: true, note: 'Payment not found' })
    }

    // Evitar reprocessar um pagamento já confirmado
    if (payment.paymentStatus === 'paid' && internalStatus !== 'paid') {
      return NextResponse.json({ received: true, note: 'Already paid' })
    }

    // Actualizar Payment
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        paymentStatus: internalStatus,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        gatewayResponse: payload as any,
        ...(internalStatus === 'paid' ? { paymentDate: payload.paidAt ? new Date(payload.paidAt as string) : new Date() } : {}),
      },
    })

    // Actualizar status do pedido
    if (internalStatus === 'paid') {
      await prisma.order.update({
        where: { id: payment.orderId },
        data: { status: 'processing' },
      })
    } else if (['failed', 'cancelled'].includes(internalStatus)) {
      await prisma.order.update({
        where: { id: payment.orderId },
        data: { status: 'cancelled' },
      })
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    logError(err, 'webhook:emis')
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}

// Suporte a GET para callback redirect do iFrame
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const orderId = searchParams.get('orderId') ?? ''
  const status = searchParams.get('status') ?? searchParams.get('paymentStatus') ?? 'unknown'
  const ref = searchParams.get('ref') ?? searchParams.get('transactionId') ?? ''

  const internalStatus = mapStatus(status)

  if (orderId && ref) {
    try {
      const payment = await prisma.payment.findFirst({
        where: { orderId },
        select: { id: true },
      })
      if (payment) {
        await prisma.payment.update({
          where: { id: payment.id },
          data: { paymentStatus: internalStatus },
        })
        if (internalStatus === 'paid') {
          await prisma.order.update({
            where: { id: orderId },
            data: { status: 'processing' },
          })
        }
      }
    } catch (err) {
      logError(err, 'webhook:emis:callback')
    }
  }

  // Redirecionar para a página de pagamento EMIS com status actualizado
  const redirectUrl = orderId
    ? `/pagamento/emis?orderId=${orderId}&ref=${ref}&status=${internalStatus}`
    : '/'
  return NextResponse.redirect(new URL(redirectUrl, req.url))
}
