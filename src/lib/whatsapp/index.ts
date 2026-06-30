import { prisma } from '@/lib/prisma'
import type { IWhatsAppProvider, WhatsAppEvent, TemplateVariables, WhatsAppSendResult } from './types'
import { EvolutionProvider } from './providers/evolution'
import { TwilioProvider } from './providers/twilio'
import { MetaProvider } from './providers/meta'
import { UltraMsgProvider } from './providers/ultramsg'

// ─── Build provider from DB config ───────────────────────────────────────────

async function getProvider(): Promise<IWhatsAppProvider | null> {
  const config = await prisma.whatsAppConfig.findFirst({ where: { active: true } })
  if (!config) return null

  switch (config.provider) {
    case 'evolution':
      if (!config.apiUrl || !config.apiKey || !config.instanceId) return null
      return new EvolutionProvider(config.apiUrl, config.apiKey, config.instanceId)
    case 'twilio': {
      // For Twilio, apiKey = accountSid:authToken, instanceId = fromNumber
      const [sid, token] = (config.apiKey ?? '').split(':')
      if (!sid || !token || !config.instanceId) return null
      return new TwilioProvider(sid, token, config.instanceId)
    }
    case 'meta':
      // apiKey = accessToken, instanceId = phoneNumberId
      if (!config.apiKey || !config.instanceId) return null
      return new MetaProvider(config.instanceId, config.apiKey)
    case 'ultramsg':
      // instanceId = instanceId, apiKey = token
      if (!config.instanceId || !config.apiKey) return null
      return new UltraMsgProvider(config.instanceId, config.apiKey)
    default:
      return null
  }
}

// ─── Render template ─────────────────────────────────────────────────────────

function renderTemplate(body: string, vars: TemplateVariables): string {
  return body.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`)
}

// ─── Main send function ───────────────────────────────────────────────────────

export async function sendWhatsApp(
  event: WhatsAppEvent,
  phone: string,
  vars: TemplateVariables,
  customerId?: string,
): Promise<WhatsAppSendResult> {
  try {
    const [configRow, template] = await Promise.all([
      prisma.whatsAppConfig.findFirst({ where: { active: true } }),
      prisma.whatsAppTemplate.findFirst({ where: { event, active: true } }),
    ])

    if (!configRow?.active || !template) {
      return { success: false, error: 'WhatsApp not configured or template inactive' }
    }

    if (!phone) {
      return { success: false, error: 'No phone number provided' }
    }

    const provider = await getProvider()
    if (!provider) {
      return { success: false, error: 'No active WhatsApp provider configured' }
    }

    const body = renderTemplate(template.body, vars)
    const result = await provider.send({ to: phone, body })

    // Log the message
    await prisma.whatsAppMessage.create({
      data: {
        customerId: customerId ?? null,
        phone,
        templateId: template.id,
        body,
        status: result.success ? 'sent' : 'failed',
        provider: configRow.provider,
        providerRef: result.providerRef ?? null,
        error: result.error ?? null,
        sentAt: result.success ? new Date() : null,
      },
    })

    return result
  } catch (e) {
    console.error('[WhatsApp]', e)
    return { success: false, error: String(e) }
  }
}

// ─── Seed default templates ───────────────────────────────────────────────────

export const DEFAULT_TEMPLATES: Array<{ event: WhatsAppEvent; title: string; body: string; target: string }> = [
  {
    event: 'customer.created',
    title: 'Conta Criada',
    body: '👋 Olá {{customerName}}! A sua conta na VN Commerce foi criada com sucesso. Bem-vindo(a)! 🛒',
    target: 'customer',
  },
  {
    event: 'customer.password_recovery',
    title: 'Recuperação de Password',
    body: '🔐 Olá {{customerName}}! Recebemos um pedido de recuperação de password. Use este link: {{resetLink}}',
    target: 'customer',
  },
  {
    event: 'order.received',
    title: 'Pedido Recebido',
    body: '🛍️ Olá {{customerName}}! O seu pedido #{{orderId}} foi recebido e está a ser processado. Total: {{orderTotal}} AOA.',
    target: 'customer',
  },
  {
    event: 'order.confirmed',
    title: 'Pedido Confirmado',
    body: '✅ Ótimas notícias {{customerName}}! O seu pedido #{{orderId}} foi confirmado e está a ser preparado.',
    target: 'customer',
  },
  {
    event: 'order.shipped',
    title: 'Pedido Enviado',
    body: '🚚 O seu pedido #{{orderId}} foi enviado! Código de rastreio: {{trackingCode}}.',
    target: 'customer',
  },
  {
    event: 'order.delivered',
    title: 'Pedido Entregue',
    body: '🎉 O seu pedido #{{orderId}} foi entregue! Esperamos que goste. Obrigado por comprar na VN Commerce!',
    target: 'customer',
  },
  {
    event: 'ticket.replied',
    title: 'Ticket Respondido',
    body: '💬 Olá {{customerName}}! O seu ticket #{{ticketId}} recebeu uma resposta. Aceda à sua conta para ver.',
    target: 'customer',
  },
  {
    event: 'promotion.generic',
    title: 'Promoção',
    body: '🔥 {{promoMessage}}',
    target: 'customer',
  },
  {
    event: 'admin.new_order',
    title: '🛒 Novo Pedido',
    body: '🛒 NOVO PEDIDO #{{orderId}} recebido! Total: {{orderTotal}} AOA. Cliente: {{customerName}}.',
    target: 'admin',
  },
  {
    event: 'admin.new_customer',
    title: '👤 Novo Cliente',
    body: '👤 NOVO CLIENTE registado: {{customerName}}.',
    target: 'admin',
  },
  {
    event: 'admin.new_ticket',
    title: '🎫 Novo Ticket',
    body: '🎫 NOVO TICKET #{{ticketId}} aberto por {{customerName}}.',
    target: 'admin',
  },
  {
    event: 'admin.cart_abandoned',
    title: '🛒 Carrinho Abandonado',
    body: '🛒 CARRINHO ABANDONADO: {{customerName}} abandonou um carrinho com {{orderTotal}} AOA.',
    target: 'admin',
  },
  {
    event: 'admin.low_stock',
    title: '⚠️ Produto Sem Stock',
    body: '⚠️ STOCK BAIXO: {{productName}} tem apenas {{stockLevel}} unidades restantes.',
    target: 'admin',
  },
]

export { type WhatsAppEvent, type TemplateVariables }
