import { PaymentGateway } from './payment-gateway.interface'
import { CashOnDeliveryProvider } from './cash-on-delivery'
import { MulticaixaExpressProvider } from './multicaixa-express'
import { EmisGpoProvider } from './emis-gpo'
import { AppyPayGpoProvider } from './appypay-gpo'
import { AppyPayRefProvider } from './appypay-ref'

export type PaymentMethodType =
  | 'cash_on_delivery'
  | 'multicaixa_express'
  | 'reference'
  | 'bank_transfer'
  | 'credit_card'
  | 'paypal'
  | 'stripe'

// Prioridade: AppyPay/EasyPay GPO (API real) → EMIS iFrame (legado) → stub
const multicaixaProvider: PaymentGateway =
  process.env.APPYPAY_CLIENT_ID && process.env.APPYPAY_GPO_KEY
    ? new AppyPayGpoProvider()
    : process.env.EMIS_FRAME_TOKEN
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
  // Pagamento por Referência Multicaixa (AppyPay/EasyPay)
  ...(process.env.APPYPAY_CLIENT_ID && process.env.APPYPAY_REF_KEY
    ? { reference: new AppyPayRefProvider() }
    : {}),
}

export function getPaymentProvider(method: PaymentMethodType): PaymentGateway {
  const provider = providers[method]
  if (!provider) throw new Error(`Método de pagamento não suportado: ${method}`)
  return provider
}

export { CashOnDeliveryProvider, MulticaixaExpressProvider, EmisGpoProvider, AppyPayGpoProvider, AppyPayRefProvider }
export type { PaymentGateway }
