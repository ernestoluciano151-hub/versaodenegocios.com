import type { IWhatsAppProvider, WhatsAppSendOptions, WhatsAppSendResult } from '../types'

export class EvolutionProvider implements IWhatsAppProvider {
  readonly name = 'evolution' as const

  constructor(
    private apiUrl: string,
    private apiKey: string,
    private instanceId: string,
  ) {}

  async send(opts: WhatsAppSendOptions): Promise<WhatsAppSendResult> {
    try {
      const phone = opts.to.replace(/\D/g, '')
      const url = `${this.apiUrl}/message/sendText/${this.instanceId}`
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: this.apiKey,
        },
        body: JSON.stringify({
          number: phone,
          text: opts.body,
        }),
      })
      if (!res.ok) {
        const err = await res.text()
        return { success: false, error: err }
      }
      const data = await res.json()
      return { success: true, providerRef: data?.key?.id ?? undefined }
    } catch (e) {
      return { success: false, error: String(e) }
    }
  }
}
