import { PaymentGateway, PaymentIntent, PaymentResult } from './payment-gateway.interface'

export class CashOnDeliveryProvider implements PaymentGateway {
  name = 'Pagamento na Entrega'
  type = 'cash_on_delivery'

  async createPayment(intent: PaymentIntent): Promise<PaymentResult> {
    return {
      success: true,
      transactionReference: `COD-${intent.orderId}-${Date.now()}`,
      gatewayResponse: { method: 'cash_on_delivery', status: 'pending_delivery' },
    }
  }

  async verifyPayment(transactionReference: string): Promise<PaymentResult> {
    return { success: true, transactionReference }
  }

  async cancelPayment(transactionReference: string): Promise<PaymentResult> {
    return { success: true, transactionReference }
  }
}
