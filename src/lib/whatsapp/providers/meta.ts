import type { IWhatsAppProvider, WhatsAppSendOptions, WhatsAppSendResult } from '../types'

export class MetaProvider implements IWhatsAppProvider {
  readonly name = 'meta' as const

  constructor(
    private phoneNumberId: string,
    private accessToken: string,
  ) {}

  async send(opts: WhatsAppSendOptions): Promise<WhatsAppSendResult> {
    try {
      const url = `https://graph.facebook.com/v19.0/${this.phoneNumberId}/messages`
      const phone = opts.to.replace(/^\+/, '')
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: phone,
          type: 'text',
          text: { body: opts.body },
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        return { success: false, error: err.error?.message }
      }
      const data = await res.json()
      return { success: true, providerRef: data.messages?.[0]?.id }
    } catch (e) {
      return { success: false, error: String(e) }
    }
  }
}
