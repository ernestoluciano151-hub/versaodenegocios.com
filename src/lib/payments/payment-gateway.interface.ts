export interface PaymentIntent {
  orderId: string
  amount: number
  currency: string
  customerName?: string
  customerEmail?: string
  metadata?: Record<string, string>
}

export interface PaymentResult {
  success: boolean
  transactionReference?: string
  gatewayResponse?: Record<string, unknown>
  redirectUrl?: string
  iframeUrl?: string
  error?: string
}

export interface PaymentGateway {
  name: string
  type: string
  createPayment(intent: PaymentIntent): Promise<PaymentResult>
  verifyPayment(transactionReference: string): Promise<PaymentResult>
  cancelPayment(transactionReference: string): Promise<PaymentResult>
  handleWebhook?(payload: unknown, signature: string): Promise<void>
}
