import { PaymentGateway, PaymentIntent, PaymentResult } from './payment-gateway.interface'
import { getAccessToken, API_BASE, isPaidStatus, isFailedStatus } from './appypay-gpo'

/**
 * AppyPay / EasyPay (Banco BCS) — Pagamentos por Referência
 *
 * Cria uma referência de pagamento Multicaixa: o cliente paga no ATM,
 * Internet Banking ou Multicaixa Express usando Entidade + Referência.
 * A confirmação chega pelo webhook (ou pela verificação activa de charges).
 *
 * Variáveis de ambiente:
 *   APPYPAY_REF_KEY    — API Key da aplicação "Referência" (Aplicações → Programador)
 *   APPYPAY_REF_ENTITY — (opcional) nº de Entidade Multicaixa do comerciante,
 *                        usado como fallback de exibição se a API não o devolver
 *   (+ APPYPAY_CLIENT_ID / APPYPAY_CLIENT_SECRET / APPYPAY_RESOURCE partilhados)
 */

interface AppyPayRefResponse {
  id?: string
  merchantTransactionId?: string
  status?: string
  responseStatus?: { status?: string; message?: string; successful?: boolean }
  [key: string]: unknown
}

/** Procura entidade/referência em várias formas possíveis do payload */
export function extractReferenceInfo(data: Record<string, unknown> | undefined | null): {
  entity: string | null
  reference: string | null
  expiresAt: string | null
} {
  if (!data) return { entity: null, reference: null, expiresAt: null }

  const pools: Record<string, unknown>[] = [data]
  for (const key of ['paymentInfo', 'reference', 'references', 'payment', 'data', 'raw']) {
    const v = data[key]
    if (v && typeof v === 'object' && !Array.isArray(v)) pools.push(v as Record<string, unknown>)
    if (Array.isArray(v) && v[0] && typeof v[0] === 'object') pools.push(v[0] as Record<string, unknown>)
  }

  const pick = (keys: string[]): string | null => {
    for (const pool of pools) {
      for (const k of keys) {
        const v = pool[k]
        if (typeof v === 'string' && v.trim()) return v.trim()
        if (typeof v === 'number') return String(v)
      }
    }
    return null
  }

  return {
    entity: pick(['entity', 'entityId', 'entidade', 'entityNumber']) ?? process.env.APPYPAY_REF_ENTITY ?? null,
    reference: pick(['referenceNumber', 'reference', 'referencia', 'refNumber', 'paymentReference']),
    expiresAt: pick(['expirationDate', 'expiresAt', 'dueDate', 'validUntil']),
  }
}

export class AppyPayRefProvider implements PaymentGateway {
  name = 'Pagamento por Referência'
  type = 'reference'

  private readonly refKey = process.env.APPYPAY_REF_KEY ?? ''

  async createPayment(intent: PaymentIntent): Promise<PaymentResult> {
    if (!this.refKey) throw new Error('APPYPAY_REF_KEY não configurado.')

    const token = await getAccessToken()
    const merchantTransactionId = intent.orderId

    const res = await fetch(`${API_BASE}/charges`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        amount: intent.amount,
        currency: intent.currency ?? 'AOA',
        description: `VN Commerce — Pedido ${intent.orderId}`.slice(0, 100),
        merchantTransactionId,
        paymentMethod: `REF_${this.refKey}`,
      }),
    })

    const data = (await res.json().catch(() => ({}))) as AppyPayRefResponse

    if (!res.ok) {
      const msg =
        data.responseStatus?.message ??
        (typeof data.message === 'string' ? data.message : undefined) ??
        `Erro AppyPay REF (${res.status})`
      throw new Error(msg)
    }

    const chargeId = data.id ?? merchantTransactionId
    const refInfo = extractReferenceInfo(data as Record<string, unknown>)

    return {
      success: true,
      transactionReference: chargeId,
      gatewayResponse: {
        provider: 'APPYPAY_REF',
        chargeId,
        merchantTransactionId,
        entity: refInfo.entity,
        reference: refInfo.reference,
        expiresAt: refInfo.expiresAt,
        raw: data as Record<string, unknown>,
      },
    }
  }

  async verifyPayment(transactionReference: string): Promise<PaymentResult> {
    try {
      const token = await getAccessToken()
      const res = await fetch(`${API_BASE}/charges/${encodeURIComponent(transactionReference)}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = (await res.json()) as AppyPayRefResponse
        const status = data.responseStatus?.status ?? data.status
        return {
          success: isPaidStatus(status),
          transactionReference,
          gatewayResponse: data as Record<string, unknown>,
          ...(isFailedStatus(status) ? { error: `Pagamento ${status}` } : {}),
        }
      }
    } catch { /* pendente — o webhook confirmará */ }
    return { success: false, transactionReference, error: 'Estado de pagamento não confirmado.' }
  }

  async cancelPayment(transactionReference: string): Promise<PaymentResult> {
    return { success: true, transactionReference }
  }
}
