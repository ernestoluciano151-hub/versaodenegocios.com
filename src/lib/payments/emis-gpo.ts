import { PaymentGateway, PaymentIntent, PaymentResult } from './payment-gateway.interface'

/**
 * EMIS GPO — Integração directa via webframe (oficial)
 *
 * Reescrito a partir do "Manual de Integração – GPO API" (v02.80, EMIS, 2023-07-07)
 * e do ficheiro "GPO_EndPoints Exemplos v2.01" fornecidos pela EMIS após a
 * adesão oficial da VN Commerce ao GPO (Comerciante nº 340472, POS nº 548377).
 *
 * A versão anterior deste ficheiro chamava endpoints inventados
 * (/v2/merchants/{id}/references) que nunca existiram na API real — foi
 * escrita antes de termos acesso à documentação oficial. Esta versão segue
 * exactamente o fluxo "Integração via webframe" (secção 2.1 do manual):
 *
 *   1. POST .../frameToken com a Frame Token do comerciante → devolve um
 *      "token de compra" (id) de utilização única, válido por alguns minutos.
 *   2. O cliente é redireccionado/embutido numa iframe em .../frame?token={id},
 *      onde introduz o número de telemóvel MULTICAIXA Express e aprova a
 *      transacção na app do telemóvel.
 *   3. A EMIS notifica o resultado por duas vias em simultâneo: mensagem
 *      postMessage à iframe, e um POST server-to-server para o callbackUrl
 *      indicado no passo 1 (tratado em /api/webhooks/emis).
 *
 * Este fluxo não precisa de OAuth — só da Frame Token do comerciante, que
 * SÓ pode ser obtida por quem tiver acesso à conta:
 *
 *   Portal GPO → https://pagamentonline.emis.co.ao/online-payment-gateway/portal/
 *   → ícone de utilizador (canto superior direito) → Perfil do Utilizador → "Frame token"
 *
 * Variáveis de ambiente:
 *   EMIS_FRAME_TOKEN     — Frame Token do comerciante (obrigatório, ver acima)
 *   EMIS_MERCHANT_ID     — Código do comerciante EMIS (default: 340472)
 *   EMIS_GPO_PORTAL_URL  — Base do portal GPO (default: https://pagamentonline.emis.co.ao/online-payment-gateway/portal)
 *   EMIS_CALLBACK_URL    — URL server-to-server notificado pela EMIS após o pagamento
 *   EMIS_CSS_URL         — URL do CSS customizado aplicado DENTRO da iframe da EMIS
 *                          (parâmetro oficial "cssUrl", Tabela 1, secção 2.1.2.2 do
 *                          manual). Default: ${SITE_URL}/emis-checkout.css. A EMIS
 *                          carrega este ficheiro no documento da iframe (que corre no
 *                          domínio deles), por isso é a ÚNICA forma de estilizar o
 *                          conteúdo da iframe — CSS do nosso site não consegue
 *                          atravessar o isolamento de origem cruzada do iframe.
 */

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://versaodenegocios.com'

const EMIS_GPO_PORTAL_URL =
  process.env.EMIS_GPO_PORTAL_URL ??
  'https://pagamentonline.emis.co.ao/online-payment-gateway/portal'

export class EmisGpoProvider implements PaymentGateway {
  name = 'Multicaixa Express (EMIS GPO)'
  type = 'multicaixa_express'

  private readonly merchantId = process.env.EMIS_MERCHANT_ID ?? '340472'
  private readonly frameToken = process.env.EMIS_FRAME_TOKEN ?? ''
  private readonly callbackUrl =
    process.env.EMIS_CALLBACK_URL ?? `${SITE_URL}/api/webhooks/emis`
  private readonly cssUrl =
    process.env.EMIS_CSS_URL ?? `${SITE_URL}/emis-checkout.css`

  /**
   * A referência do comerciante só aceita letras/números, até 15 caracteres
   * (Tabela 1 do manual). O id do pedido (cuid) é mais comprido, por isso
   * usamos os últimos 15 caracteres alfanuméricos, que já é o suficiente
   * para sermos capazes de encontrar o Payment correspondente no webhook.
   */
  private buildReference(orderId: string): string {
    return orderId.replace(/[^a-zA-Z0-9]/g, '').slice(-15)
  }

  /**
   * Solicita um token de compra (frameToken) à EMIS e devolve o URL da
   * iframe onde o cliente vai concluir o pagamento.
   */
  async createPayment(intent: PaymentIntent): Promise<PaymentResult> {
    if (!this.frameToken) {
      return {
        success: false,
        transactionReference: intent.orderId,
        error: 'EMIS_FRAME_TOKEN não configurado — obtenha-o no Portal GPO (Perfil do Utilizador → Frame token) e configure a variável de ambiente.',
      }
    }

    const reference = this.buildReference(intent.orderId)

    let res: Response
    try {
      res = await fetch(`${EMIS_GPO_PORTAL_URL}/frameToken`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reference,
          amount: Number(intent.amount.toFixed(2)),
          token: this.frameToken,
          // Este provider serve apenas o método Multicaixa Express — o
          // pagamento por cartão fica desactivado na iframe.
          mobile: 'PAYMENT',
          card: 'DISABLED',
          qrCode: 'DISABLED',
          callbackUrl: this.callbackUrl,
          cssUrl: this.cssUrl,
        }),
      })
    } catch {
      return {
        success: false,
        transactionReference: intent.orderId,
        error: 'Não foi possível contactar a EMIS GPO. Tente novamente.',
      }
    }

    if (!res.ok) {
      let message = `Falha ao criar token de compra na EMIS GPO (HTTP ${res.status}).`
      try {
        const body = (await res.json()) as { message?: string; code?: number }
        if (body?.message) message = body.message
      } catch { /* corpo sem JSON — mantém mensagem genérica */ }
      return { success: false, transactionReference: intent.orderId, error: message }
    }

    const data = (await res.json()) as { id?: string; timeToLive?: number }
    if (!data.id) {
      return { success: false, transactionReference: intent.orderId, error: 'Resposta inesperada da EMIS GPO (sem id de token de compra).' }
    }

    return {
      success: true,
      transactionReference: data.id,
      iframeUrl: `${EMIS_GPO_PORTAL_URL}/frame?token=${data.id}`,
      gatewayResponse: {
        provider: 'EMIS_GPO_DIRECT',
        merchantId: this.merchantId,
        purchaseTokenId: data.id,
        merchantReference: reference,
        timeToLive: data.timeToLive,
      },
    }
  }

  /**
   * O fluxo webframe não expõe um endpoint de consulta de estado sem OAuth
   * (esse só existe nos webservices REST, que exigem client_id/client_secret
   * próprios — não incluídos no acesso webframe). A confirmação chega
   * sempre pelo callbackUrl (ver /api/webhooks/emis), por isso aqui apenas
   * devolvemos "pendente" sem tentar activamente consultar a EMIS.
   */
  async verifyPayment(transactionReference: string): Promise<PaymentResult> {
    return {
      success: false,
      transactionReference,
      error: 'A aguardar confirmação via callback da EMIS GPO.',
    }
  }

  /**
   * Sem OAuth/webservices REST configurados não há um endpoint de
   * cancelamento disponível para o token de compra (que expira sozinho ao
   * fim do timeToLive). O cancelamento do pedido em si continua a ser
   * tratado localmente pelo checkout/admin.
   */
  async cancelPayment(transactionReference: string): Promise<PaymentResult> {
    return { success: false, transactionReference, error: 'Cancelamento automático não disponível — o token de compra expira sozinho.' }
  }

  /**
   * Validação do payload recebido em /api/webhooks/emis. A EMIS envia o
   * objecto "Transaction" descrito no serviço "Consulta de uma Transação"
   * (secção 4.1.8): { id, status, transactionType, amount, reference: { id },
   * merchantReferenceNumber, ... }. Em caso de erro de processamento pode
   * ainda vir acompanhado de errorType/errorCode/errorMessage.
   */
  async handleWebhook(payload: unknown): Promise<void> {
    const data = payload as Record<string, unknown>
    const id = data.id as string | undefined
    if (!id) throw new Error('Webhook EMIS GPO: id da transacção em falta.')
  }
}
