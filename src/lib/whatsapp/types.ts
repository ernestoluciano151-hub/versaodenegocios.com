// WhatsApp abstraction layer — suporta Twilio, Meta Cloud API, UltraMsg, Evolution API

export type WhatsAppProviderName = 'twilio' | 'meta' | 'ultramsg' | 'evolution'

export interface WhatsAppSendOptions {
  to: string          // número no formato internacional: +244911234567
  body: string
  mediaUrl?: string   // URL de imagem/ficheiro (opcional)
}

export interface WhatsAppSendResult {
  success: boolean
  providerRef?: string  // ID da mensagem no provider
  error?: string
}

export interface IWhatsAppProvider {
  send(opts: WhatsAppSendOptions): Promise<WhatsAppSendResult>
  name: WhatsAppProviderName
}

// ─── Template events ─────────────────────────────────────────────────────────

export type WhatsAppEvent =
  // Customer
  | 'customer.created'
  | 'customer.password_recovery'
  | 'order.received'
  | 'order.confirmed'
  | 'order.shipped'
  | 'order.delivered'
  | 'ticket.replied'
  | 'promotion.generic'
  // Admin
  | 'admin.new_order'
  | 'admin.new_customer'
  | 'admin.new_ticket'
  | 'admin.cart_abandoned'
  | 'admin.low_stock'

export interface TemplateVariables {
  customerName?: string
  orderId?: string
  orderTotal?: string
  productName?: string
  trackingCode?: string
  resetLink?: string
  promoMessage?: string
  ticketId?: string
  stockLevel?: string
  [key: string]: string | undefined
}
