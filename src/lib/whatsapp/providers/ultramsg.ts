import type { IWhatsAppProvider, WhatsAppSendOptions, WhatsAppSendResult } from '../types'

export class UltraMsgProvider implements IWhatsAppProvider {
  readonly name = 'ultramsg' as const

  constructor(
    private instanceId: string,
    private token: string,
  ) {}

  async send(opts: WhatsAppSendOptions): Promise<WhatsAppSendResult> {
    try {
      const url = `https://api.ultramsg.com/${this.instanceId}/messages/chat`
      const body = new URLSearchParams({
        token: this.token,
        to: opts.to,
        body: opts.body,
      })
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      })
      if (!res.ok) {
        return { success: false, error: `HTTP ${res.status}` }
      }
      const data = await res.json()
      return { success: !!data.sent, providerRef: data.id?.toString() }
    } catch (e) {
      return { success: false, error: String(e) }
    }
  }
}
