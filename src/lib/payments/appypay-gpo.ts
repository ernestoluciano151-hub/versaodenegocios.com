import { PaymentGateway, PaymentIntent, PaymentResult } from './payment-gateway.interface'

/**
 * AppyPay / EasyPay (Banco BCS) — GPO Multicaixa Express
 *
 * Fluxo real (sem iframe):
 *  1. Obter token OAuth2 (client_credentials) no Azure AD da AppyPay
 *  2. POST /v2.0/charges com paymentMethod "GPO_<apiKey>" e o nº de telemóvel
 *  3. O cliente recebe um push na app Multicaixa Express e aprova (~90s)
 *  4. A EasyPay notifica o webhook configurado no portal
 *
 * Variáveis de ambiente:
 *   APPYPAY_CLIENT_ID      — Client ID (portal EasyPay → Configurações → Credenciais)
 *   APPYPAY_CLIENT_SECRET  — Client Secret (idem, "Nova Chave API")
 *   APPYPAY_GPO_KEY        — API Key da aplicação GPO (Aplicações → Programador)
 *   APPYPAY_RESOURCE       — bee57785-7a19-4f1c-9c8d-aa03f2f0e333 (produção)
 *                            2aed7612-de64-46b5-9e59-1f48f8902d14 (teste)
 *   APPYPAY_AUTH_URL       — default https://login.microsoftonline.com/auth.appypay.co.ao/oauth2/token
 *   APPYPAY_API_BASE       — default https://gwy-api.appypay.co.ao/v2.0
 */

const AUTH_URL =
  process.env.APPYPAY_AUTH_URL ??
  'https://login.microsoftonline.com/auth.appypay.co.ao/oauth2/token'

const API_BASE = process.env.APPYPAY_API_BASE ?? 'https://gwy-api.appypay.co.ao/v2.0'

const PROD_RESOURCE = 'bee57785-7a19-4f1c-9c8d-aa03f2f0e333'

// ── Cache do token OAuth2 (module-scope; sobrevive entre invocações warm) ────
let cachedToken: { token: string; expiresAt: number } | null = null

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60_000) {
    return cachedToken.token
  }

  const clientId = process.env.APPYPAY_CLIENT_ID
  const clientSecret = process.env.APPYPAY_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    throw new Error('APPYPAY_CLIENT_ID / APPYPAY_CLIENT_SECRET não configurados.')
  }

  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: clientId,
    client_secret: clientSecret,
    resource: process.env.APPYPAY_RESOURCE ?? PROD_RESOURCE,
  })

  const res = await fetch(AUTH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`AppyPay auth falhou (${res.status}): ${text.slice(0, 300)}`)
  }

  const data = (await res.json()) as { access_token?: string; expires_in?: string | number }
  if (!data.access_token) throw new Error('AppyPay auth: access_token em falta na resposta.')

  const expiresInSec = Number(data.expires_in ?? 3600)
  cachedToken = { token: data.access_token, expiresAt: Date.now() + expiresInSec * 1000 }
  return data.access_token
}

// ── Tipos da API de charges ──────────────────────────────────────────────────
interface AppyPayChargeResponse {
  id?: string
  merchantTransactionId?: string
  status?: string
  responseStatus?: { status?: string; message?: string; successful?: boolean }
  [key: string]: unknown
}

function isPaidStatus(s: string | undefined): boolean {
  if (!s) return false
  return ['SUCCESS', 'SUCCESSFUL', 'PAID', 'ACCEPTED', 'COMPLETED', 'CONFIRMED'].includes(s.toUpperCase())
}

function isFailedStatus(s: string | undefined): boolean {
  if (!s) return false
  return ['FAILED', 'DECLINED', 'REJECTED', 'CANCELLED', 'CANCELED', 'EXPIRED', 'ERROR', 'TIMEOUT'].includes(s.toUpperCase())
}

export class AppyPayGpoProvider implements PaymentGateway {
  name = 'Multicaixa Express'
  type = 'multicaixa_express'

  private readonly gpoKey = process.env.APPYPAY_GPO_KEY ?? ''

  /**
   * Cria uma cobrança GPO. O cliente aprova o pagamento na app Multicaixa
   * Express no telemóvel indicado em intent.metadata.phoneNumber.
   */
  async createPayment(intent: PaymentIntent): Promise<PaymentResult> {
    if (!this.gpoKey) throw new Error('APPYPAY_GPO_KEY não configurado.')

    const phoneNumber = intent.metadata?.phoneNumber?.replace(/[\s+-]/g, '').replace(/^244/, '')
    if (!phoneNumber || phoneNumber.length !== 9) {
      throw new Error('Número de telemóvel Multicaixa Express inválido (9 dígitos).')
    }

    const token = await getAccessToken()

    // merchantTransactionId: usar orderId (aparece no portal EasyPay)
    const merchantTransactionId = intent.orderId

    const res = await fetch(`${API_BASE}/charges`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        amount: intent.amount, // AOA — a API usa unidades, não centavos (cf. doc: "amount": 123)
        currency: intent.currency ?? 'AOA',
        description: `VN Commerce — Pedido ${intent.orderId}`.slice(0, 100),
        merchantTransactionId,
        paymentMethod: `GPO_${this.gpoKey}`,
        paymentInfo: { phoneNumber },
      }),
    })

    const data = (await res.json().catch(() => ({}))) as AppyPayChargeResponse

    if (!res.ok) {
      const msg =
        data.responseStatus?.message ??
        (typeof data.message === 'string' ? data.message : undefined) ??
        `Erro AppyPay (${res.status})`
      throw new Error(msg)
    }

    const chargeId = data.id ?? merchantTransactionId
    const status = data.responseStatus?.status ?? data.status

    return {
      success: !isFailedStatus(status),
      transactionReference: chargeId,
      gatewayResponse: {
        provider: 'APPYPAY_GPO',
        chargeId,
        merchantTransactionId,
        status: status ?? 'PENDING',
        raw: data as Record<string, unknown>,
      },
    }
  }

  /**
   * Consulta o estado de uma cobrança.
   */
  async verifyPayment(transactionReference: string): Promise<PaymentResult> {
    try {
      const token = await getAccessToken()
      const res = await fetch(`${API_BASE}/charges/${encodeURIComponent(transactionReference)}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = (await res.json()) as AppyPayChargeResponse
        const status = data.responseStatus?.status ?? data.status
        return {
          success: isPaidStatus(status),
          transactionReference,
          gatewayResponse: data as Record<string, unknown>,
          ...(isFailedStatus(status) ? { error: `Pagamento ${status}` } : {}),
        }
      }
    } catch {
      // API indisponível — fica pendente; o webhook confirmará
    }
    return { success: false, transactionReference, error: 'Estado de pagamento não confirmado.' }
  }

  async cancelPayment(transactionReference: string): Promise<PaymentResult> {
    // A API de charges GPO não expõe cancelamento — o push expira sozinho (~90s)
    return { success: true, transactionReference }
  }

  /**
   * Valida o payload do webhook EasyPay/AppyPay.
   * A actualização do pedido é feita no route handler /api/webhooks/emis.
   */
  async handleWebhook(payload: unknown, _signature: string): Promise<void> {
    const data = payload as Record<string, unknown>
    const id =
      (data.merchantTransactionId ?? data.id ?? data.transactionId ?? data.referenceId) as
        | string
        | undefined
    if (!id) throw new Error('Webhook AppyPay: identificador da transacção em falta.')
  }
}

export { isPaidStatus, isFailedStatus }
