import { PaymentGateway } from './payment-gateway.interface'
import { CashOnDeliveryProvider } from './cash-on-delivery'
import { MulticaixaExpressProvider } from './multicaixa-express'
import { EmisGpoProvider } from './emis-gpo'

export type PaymentMethodType =
  | 'cash_on_delivery'
  | 'multicaixa_express'
  | 'bank_transfer'
  | 'credit_card'
  | 'paypal'
  | 'stripe'

// Usa EMIS GPO iFrame para Multicaixa Express se EMIS_FRAME_TOKEN estiver configurado,
// caso contrário usa o stub original (compatível com futuras credenciais directas).
const multicaixaProvider: PaymentGateway = process.env.EMIS_FRAME_TOKEN
  ? new EmisGpoProvider()
  : new MulticaixaExpressProvider()

// Bank Transfer — manual, sem gateway. Cria referência local.
const bankTransferProvider: PaymentGateway = {
  name: 'Transferência Bancária',
  type: 'bank_transfer',
  async createPayment(intent) {
    return {
      success: true,
      transactionReference: `BT-${intent.orderId}-${Date.now()}`,
      gatewayResponse: { provider: 'BANK_TRANSFER', note: 'Aguardar comprovativo de transferência' },
    }
  },
  async verifyPayment(ref) { return { success: false, transactionReference: ref } },
  async cancelPayment(ref) { return { success: true, transactionReference: ref } },
}

const providers: Partial<Record<PaymentMethodType, PaymentGateway>> = {
  cash_on_delivery: new CashOnDeliveryProvider(),
  multicaixa_express: multicaixaProvider,
  bank_transfer: bankTransferProvider,
}

export function getPaymentProvider(method: PaymentMethodType): PaymentGateway {
  const provider = providers[method]
  if (!provider) throw new Error(`Método de pagamento não suportado: ${method}`)
  return provider
}

export { CashOnDeliveryProvider, MulticaixaExpressProvider, EmisGpoProvider }
export type { PaymentGateway }
