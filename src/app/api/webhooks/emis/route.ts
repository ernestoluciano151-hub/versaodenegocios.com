import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'
import { logError } from '@/lib/logger'
import { deductStockOnGpoPayment } from '@/lib/orders/stock'

export const dynamic = 'force-dynamic'

/**
 * Webhook / Callback da EMIS GPO
 *
 * A EMIS envia uma notificação POST quando o estado de um pagamento muda.
 * O endpoint actualiza o Payment e o Order correspondente.
 *
 * URL a configurar no portal EMIS:
 *   https://versaodenegocios.com/api/webhooks/emis
 *
 * SEGURANÇA — o manual oficial da EMIS ("Manual de Integração – GPO API",
 * secção 2.1.3.2.2) não define nenhum mecanismo de assinatura (HMAC/JWT)
 * para o callback server-to-server do fluxo webframe — ao contrário do
 * fluxo REST/OAuth, aqui não há nada no payload que prove que o pedido veio
 * mesmo da EMIS. Sem protecção, qualquer pessoa que soubesse (ou visse na
 * própria URL do checkout) o orderId de UM pedido seu poderia fazer um
 * POST directo para este endpoint a fingir "pago" e levar o produto sem
 * pagar. Mitigação implementada (dentro do que o fluxo webframe permite):
 *
 *   1. Segredo partilhado na própria callbackUrl — vamos anexar
 *      "?key=EMIS_WEBHOOK_SECRET" ao callbackUrl que enviamos no pedido de
 *      token de compra (ver src/lib/payments/emis-gpo.ts). A EMIS devolve
 *      sempre esse URL exacto, por isso só um POST que conheça o segredo é
 *      aceite. Comparação em tempo constante para evitar timing attacks.
 *   2. Confirmação cruzada do montante — o valor reportado no callback tem
 *      de bater certo com o valor do Payment já criado (com uma margem de
 *      1 cêntimo para arredondamentos), caso contrário é rejeitado.
 *
 * Enquanto EMIS_WEBHOOK_SECRET não estiver configurado em produção, o
 * pedido é aceite na mesma (para não partir pagamentos a meio de uma
 * migração) mas fica registado um aviso — configurar o segredo é
 * obrigatório antes de considerar esta integração pronta para produção.
 */

function timingSafeEqualStr(a: string, b: string): boolean {
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  if (bufA.length !== bufB.length) return false
  try {
    return crypto.timingSafeEqual(bufA, bufB)
  } catch {
    return false
  }
}

/** Verifica o segredo partilhado enviado como ?key= na própria callbackUrl. */
function verifyWebhookKey(req: NextRequest): { ok: boolean; configured: boolean } {
  const secret = process.env.EMIS_WEBHOOK_SECRET
  if (!secret) return { ok: true, configured: false }
  const provided = req.nextUrl.searchParams.get('key') ?? ''
  return { ok: timingSafeEqualStr(provided, secret), configured: true }
}

interface EmisWebhookPayload {
  // AppyPay / EasyPay
  id?: string
  merchantTransactionId?: string
  responseStatus?: { status?: string; message?: string; successful?: boolean }
  // EMIS legado / genérico
  transactionId?: string
  referenceId?: string
  orderId?: string
  status?: string
  paymentStatus?: string
  amount?: number
  currency?: string
  paidAt?: string
  // EMIS GPO directo — objecto "Transaction" (secção 4.1.8 do manual oficial),
  // enviado server-to-server para o callbackUrl indicado no pedido de token
  // de compra (ver src/lib/payments/emis-gpo.ts)
  transactionType?: string
  merchantReferenceNumber?: string
  reference?: { id?: string }
  errorType?: string
  errorCode?: string
  errorMessage?: string
  [key: string]: unknown
}

// Mapa de status AppyPay/EMIS → status interno
function mapStatus(rawStatus: string): 'pending' | 'paid' | 'failed' | 'cancelled' {
  const s = rawStatus.toUpperCase()
  if (['PAID', 'SUCCESS', 'SUCCESSFUL', 'ACCEPTED', 'CONFIRMED', 'COMPLETED'].includes(s)) return 'paid'
  if (['FAILED', 'DECLINED', 'REJECTED', 'ERROR', 'TIMEOUT'].includes(s)) return 'failed'
  if (['CANCELLED', 'CANCELED', 'EXPIRED'].includes(s)) return 'cancelled'
  return 'pending'
}

export async function POST(req: NextRequest) {
  // Segredo partilhado — ver nota de segurança no topo do ficheiro.
  const keyCheck = verifyWebhookKey(req)
  if (!keyCheck.configured) {
    logError(new Error('EMIS_WEBHOOK_SECRET não configurado — webhook aceite sem verificação.'), 'webhook:emis:unprotected')
  } else if (!keyCheck.ok) {
    logError(new Error('Assinatura/segredo inválido no webhook EMIS.'), 'webhook:emis:invalid-key')
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }

  let payload: EmisWebhookPayload
  try {
    payload = (await req.json()) as EmisWebhookPayload
  } catch {
    return NextResponse.json({ error: 'Payload inválido.' }, { status: 400 })
  }

  // AppyPay: merchantTransactionId = orderId nosso; id = chargeId (transactionReference)
  // EMIS GPO directo: id = id da transacção; reference.id = referência EMIS;
  // merchantReferenceNumber = a nossa própria referência (ver buildReference em emis-gpo.ts)
  const transactionRef =
    payload.merchantTransactionId ??
    payload.id ??
    payload.transactionId ??
    payload.referenceId ??
    payload.reference?.id ??
    payload.orderId
  const merchantRef = payload.merchantReferenceNumber
  // Se a EMIS devolveu erro explícito (errorType/errorCode), a transacção
  // falhou mesmo que o campo "status" não venha preenchido nesse cenário.
  const rawStatus = (payload.errorType || payload.errorCode)
    ? 'FAILED'
    : payload.responseStatus?.status ?? payload.status ?? payload.paymentStatus ??
      (payload.responseStatus?.successful === true ? 'SUCCESS' : 'UNKNOWN')

  if (!transactionRef && !merchantRef) {
    return NextResponse.json({ error: 'transactionId em falta.' }, { status: 400 })
  }

  const internalStatus = mapStatus(rawStatus)

  try {
    // Encontrar o registo de pagamento pela referência (chargeId), pelo
    // orderId, ou — no caso da EMIS GPO directa — pela nossa própria
    // referência (merchantReferenceNumber), que corresponde sempre aos
    // últimos 15 caracteres do id do pedido (ver buildReference em emis-gpo.ts).
    const payment = await prisma.payment.findFirst({
      where: {
        OR: [
          ...(transactionRef ? [{ transactionReference: { contains: transactionRef } }, { orderId: transactionRef }] : []),
          ...(merchantRef && merchantRef.length >= 6 ? [{ orderId: { endsWith: merchantRef } }] : []),
        ],
      },
      orderBy: { createdAt: 'desc' },
      select: { id: true, orderId: true, paymentStatus: true, paymentMethod: true, amount: true },
    })

    if (!payment) {
      // Pode ser callback de teste — aceitar silenciosamente
      return NextResponse.json({ received: true, note: 'Payment not found' })
    }

    // Confirmação cruzada do montante — segunda camada de defesa mesmo com
    // o segredo correcto (protege contra fuga do segredo ou payload
    // adulterado). Só compara quando a EMIS envia mesmo um "amount".
    if (internalStatus === 'paid' && typeof payload.amount === 'number') {
      const expected = Number(payment.amount)
      if (Math.abs(payload.amount - expected) > 0.01) {
        logError(
          new Error(`Montante do webhook (${payload.amount}) não coincide com o Payment (${expected}) — orderId ${payment.orderId}`),
          'webhook:emis:amount-mismatch'
        )
        return NextResponse.json({ error: 'Montante não coincide.' }, { status: 400 })
      }
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
      // Multicaixa Express (GPO): o pagamento é confirmado instantaneamente
      // pelo push — deduz o stock já aqui (não espera pela entrega, ao
      // contrário de cash on delivery, referência e transferência bancária).
      if (payment.paymentMethod === 'multicaixa_express') {
        await deductStockOnGpoPayment(payment.orderId)
      } else {
        await prisma.order.update({
          where: { id: payment.orderId },
          data: { status: 'processing' },
        })
      }
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

// Suporte a GET para callback redirect do iFrame (não usado pelo fluxo
// webframe actual — a EMIS confirma sempre via POST server-to-server + o
// cliente fica na nossa página /pagamento/emis. Mantido por
// retrocompatibilidade, mas protegido pelo mesmo segredo do POST, já que
// também está autorizado a alterar o estado de um pagamento.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const orderId = searchParams.get('orderId') ?? ''
  const status = searchParams.get('status') ?? searchParams.get('paymentStatus') ?? 'unknown'
  const ref = searchParams.get('ref') ?? searchParams.get('transactionId') ?? ''

  const internalStatus = mapStatus(status)
  const keyCheck = verifyWebhookKey(req)
  if (!keyCheck.configured) {
    logError(new Error('EMIS_WEBHOOK_SECRET não configurado — callback GET aceite sem verificação.'), 'webhook:emis:unprotected')
  }

  if (orderId && ref && keyCheck.ok) {
    try {
      const payment = await prisma.payment.findFirst({
        where: { orderId },
        select: { id: true, paymentMethod: true },
      })
      if (payment) {
        await prisma.payment.update({
          where: { id: payment.id },
          data: { paymentStatus: internalStatus },
        })
        if (internalStatus === 'paid') {
          if (payment.paymentMethod === 'multicaixa_express') {
            await deductStockOnGpoPayment(orderId)
          } else {
            await prisma.order.update({
              where: { id: orderId },
              data: { status: 'processing' },
            })
          }
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
