import { PaymentGateway, PaymentIntent, PaymentResult } from './payment-gateway.interface'

/**
 * EMIS GPO — Multicaixa Express iFrame Adapter
 *
 * Integração via iFrame conforme documentação EMIS.
 * O cliente efectua o pagamento dentro do iFrame embebido na página /pagamento/emis.
 * Quando a EMIS disponibilizar a API completa, basta substituir este adapter
 * sem alterar o restante sistema.
 *
 * Variáveis de ambiente necessárias:
 *   EMIS_MERCHANT_ID   — ID do comerciante (ex: 340472)
 *   EMIS_FRAME_TOKEN   — Token do iFrame obtido no portal EMIS
 *   EMIS_IFRAME_URL    — URL base do iFrame (ex: https://pagamentonline.emis.co.ao/online-payment-gateway/portal)
 *   EMIS_API_BASE      — URL base da API EMIS (ex: https://pagamentonline.emis.co.ao/online-payment-gateway/api)
 *   EMIS_CALLBACK_URL  — URL de callback após pagamento (ex: https://versaodenegocios.com/pagamento/emis/callback)
 *   EMIS_WEBHOOK_SECRET — Secret para verificar webhooks da EMIS
 */

const EMIS_API_BASE =
  process.env.EMIS_API_BASE ??
  'https://pagamentonline.emis.co.ao/online-payment-gateway/api'

const EMIS_IFRAME_URL =
  process.env.EMIS_IFRAME_URL ??
  'https://pagamentonline.emis.co.ao/online-payment-gateway/portal'

export class EmisGpoProvider implements PaymentGateway {
  name = 'Multicaixa Express'
  type = 'multicaixa_express'

  private readonly merchantId = process.env.EMIS_MERCHANT_ID ?? '340472'
  private readonly frameToken = process.env.EMIS_FRAME_TOKEN ?? ''
  private readonly callbackUrl =
    process.env.EMIS_CALLBACK_URL ??
    `${process.env.NEXT_PUBLIC_BASE_URL ?? 'https://versaodenegocios.com'}/pagamento/emis/callback`

  /**
   * Cria uma referência de pagamento na EMIS e devolve a URL do iFrame.
   *
   * A EMIS não expõe ainda autenticação pública — o iFrame é configurado
   * directamente com o frameToken. Quando a EMIS disponibilizar credenciais
   * de API, adicionar aqui a chamada POST /v2/merchants/{id}/references para
   * obter uma referência gerada pela EMIS e passar o seu ID para o iFrame.
   */
  async createPayment(intent: PaymentIntent): Promise<PaymentResult> {
    if (!this.frameToken) {
      throw new Error('EMIS_FRAME_TOKEN não configurado.')
    }

    // Tentativa de criar referência via API EMIS (quando disponível)
    let emisReference: string | null = null
    try {
      const res = await fetch(
        `${EMIS_API_BASE}/v2/merchants/${this.merchantId}/references`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: Math.round(intent.amount * 100), // centavos
            currency: intent.currency ?? 'AOA',
            reference: intent.orderId,
            description: `VN Commerce — Pedido ${intent.orderId}`,
            callbackUrl: this.callbackUrl,
          }),
        },
      )
      if (res.ok) {
        const data = (await res.json()) as { referenceId?: string; id?: string }
        emisReference = data.referenceId ?? data.id ?? null
      }
    } catch {
      // API ainda não disponível — continua com iFrame por frameToken
    }

    // Constrói URL do iFrame
    const params = new URLSearchParams({
      frameToken: this.frameToken,
      amount: String(Math.round(intent.amount * 100)),
      currency: intent.currency ?? 'AOA',
      orderId: intent.orderId,
      callbackUrl: this.callbackUrl,
    })
    if (emisReference) params.set('referenceId', emisReference)
    if (intent.customerName) params.set('customerName', intent.customerName)
    if (intent.customerEmail) params.set('customerEmail', intent.customerEmail)

    const iframeUrl = `${EMIS_IFRAME_URL}?${params.toString()}`

    return {
      success: true,
      transactionReference: emisReference ?? `EMIS-${intent.orderId}-${Date.now()}`,
      iframeUrl,
      gatewayResponse: { provider: 'EMIS_GPO', merchantId: this.merchantId, emisReference },
    }
  }

  /**
   * Verifica o estado de um pagamento consultando a EMIS.
   */
  async verifyPayment(transactionReference: string): Promise<PaymentResult> {
    if (!transactionReference.startsWith('EMIS-')) {
      // Referência real da EMIS — consultar API
      try {
        const res = await fetch(
          `${EMIS_API_BASE}/v2/merchants/${this.merchantId}/references/${transactionReference}`,
          { headers: { 'Content-Type': 'application/json' } },
        )
        if (res.ok) {
          const data = (await res.json()) as { status?: string; paid?: boolean }
          const paid = data.paid === true || data.status === 'PAID' || data.status === 'SUCCESS'
          return {
            success: paid,
            transactionReference,
            gatewayResponse: data as Record<string, unknown>,
          }
        }
      } catch {
        // API indisponível — devolver pending
      }
    }

    // Fallback: verificação pendente
    return { success: false, transactionReference, error: 'Estado de pagamento não confirmado.' }
  }

  /**
   * Cancelamento de referência EMIS.
   */
  async cancelPayment(transactionReference: string): Promise<PaymentResult> {
    try {
      const res = await fetch(
        `${EMIS_API_BASE}/v2/merchants/${this.merchantId}/references/${transactionReference}/cancel`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' } },
      )
      return { success: res.ok, transactionReference }
    } catch {
      return { success: false, transactionReference, error: 'Não foi possível cancelar o pagamento.' }
    }
  }

  /**
   * Processa o webhook/callback da EMIS.
   * Verificar a assinatura com EMIS_WEBHOOK_SECRET quando a EMIS disponibilizar.
   */
  async handleWebhook(payload: unknown, _signature: string): Promise<void> {
    // Validação de assinatura (activar quando a EMIS disponibilizar o mecanismo)
    // const webhookSecret = process.env.EMIS_WEBHOOK_SECRET
    // if (webhookSecret && signature) { ... verify ... }

    const data = payload as Record<string, unknown>
    const status = (data.status ?? data.paymentStatus) as string | undefined
    const transactionId = (data.transactionId ?? data.referenceId ?? data.orderId) as string | undefined

    if (!transactionId) throw new Error('Webhook EMIS: transactionId em falta.')

    // O handler de rota /api/webhooks/emis faz a actualização do pedido —
    // este método apenas valida o payload.
    const validStatuses = ['PAID', 'SUCCESS', 'CONFIRMED', 'FAILED', 'CANCELLED', 'EXPIRED']
    if (status && !validStatuses.includes(status.toUpperCase())) {
      throw new Error(`Webhook EMIS: status desconhecido "${status}".`)
    }
  }
}
