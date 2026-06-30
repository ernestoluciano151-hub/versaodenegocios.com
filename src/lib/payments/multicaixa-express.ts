import { PaymentGateway, PaymentIntent, PaymentResult } from './payment-gateway.interface'

// STUB — Awaiting official Multicaixa Express API credentials and documentation.
// Integration steps when ready:
// 1. Set MULTICAIXA_API_KEY, MULTICAIXA_API_SECRET, MULTICAIXA_ENDPOINT in .env
// 2. Implement createPayment to call the Multicaixa iFrame/API endpoint
// 3. Implement verifyPayment to confirm transaction status
// 4. Implement handleWebhook to receive payment callbacks
export class MulticaixaExpressProvider implements PaymentGateway {
  name = 'Multicaixa Express'
  type = 'multicaixa_express'

  private readonly apiKey = process.env.MULTICAIXA_API_KEY
  private readonly apiSecret = process.env.MULTICAIXA_API_SECRET
  private readonly endpoint = process.env.MULTICAIXA_ENDPOINT ?? 'https://api.multicaixa.ao'

  async createPayment(_intent: PaymentIntent): Promise<PaymentResult> {
    throw new Error('Multicaixa Express ainda não está disponível. Integração pendente de credenciais oficiais.')
  }

  async verifyPayment(_ref: string): Promise<PaymentResult> {
    throw new Error('Multicaixa Express ainda não está disponível.')
  }

  async cancelPayment(_ref: string): Promise<PaymentResult> {
    throw new Error('Multicaixa Express ainda não está disponível.')
  }

  async handleWebhook(_payload: unknown, _signature: string): Promise<void> {
    throw new Error('Webhook Multicaixa Express não implementado ainda.')
  }
}
