import type { IWhatsAppProvider, WhatsAppSendOptions, WhatsAppSendResult } from '../types'

export class TwilioProvider implements IWhatsAppProvider {
  readonly name = 'twilio' as const

  constructor(
    private accountSid: string,
    private authToken: string,
    private from: string, // whatsapp:+14155238886
  ) {}

  async send(opts: WhatsAppSendOptions): Promise<WhatsAppSendResult> {
    try {
      const url = `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`
      const body = new URLSearchParams({
        From: `whatsapp:${this.from}`,
        To: `whatsapp:${opts.to}`,
        Body: opts.body,
        ...(opts.mediaUrl ? { MediaUrl: opts.mediaUrl } : {}),
      })
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: 'Basic ' + Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body,
      })
      if (!res.ok) {
        const err = await res.json()
        return { success: false, error: err.message }
      }
      const data = await res.json()
      return { success: true, providerRef: data.sid }
    } catch (e) {
      return { success: false, error: String(e) }
    }
  }
}
