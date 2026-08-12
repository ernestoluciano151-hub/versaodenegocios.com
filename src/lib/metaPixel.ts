declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void
  }
}

export const PIXEL_ID = '1306279669228308'
export const CURRENCY = 'AOA'

/** Gera um ID único por evento — necessário para deduplicação com a Conversions API mais tarde. */
export function newEventId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
}

type StandardEvent =
  | 'PageView'
  | 'ViewContent'
  | 'AddToCart'
  | 'InitiateCheckout'
  | 'AddPaymentInfo'
  | 'Purchase'
  | 'Contact'
  | 'Lead'
  | 'Search'
  | 'AddToWishlist'

/**
 * Dispara um evento do Meta Pixel. Nunca lança erro — se `window.fbq` não
 * existir (SSR, adblock, pixel desactivado nas Configurações), fica em
 * silêncio.
 */
export function track(
  event: StandardEvent,
  params: Record<string, unknown> = {},
  eventId?: string
): void {
  if (typeof window === 'undefined' || !window.fbq) return
  window.fbq('track', event, params, { eventID: eventId ?? newEventId() })
}

/** Converte "1 850 000,00 Kz" ou "1850000" num número limpo. Aceita number directamente. */
export function toNumber(price: string | number | null | undefined): number {
  if (typeof price === 'number') return price
  if (!price) return 0
  return Number(
    String(price)
      .replace(/[^\d,.-]/g, '')
      .replace(/\./g, '')
      .replace(',', '.')
  )
}

export interface PixelContent {
  id: string
  quantity?: number
  item_price?: number
}
