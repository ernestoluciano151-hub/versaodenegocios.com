import { PaymentGateway } from './payment-gateway.interface'
import { CashOnDeliveryProvider } from './cash-on-delivery'
import { MulticaixaExpressProvider } from './multicaixa-express'

export type PaymentMethodType =
  | 'cash_on_delivery'
  | 'multicaixa_express'
  | 'bank_transfer'
  | 'credit_card'
  | 'paypal'
  | 'stripe'

const providers: Partial<Record<PaymentMethodType, PaymentGateway>> = {
  cash_on_delivery: new CashOnDeliveryProvider(),
  multicaixa_express: new MulticaixaExpressProvider(),
}

export function getPaymentProvider(method: PaymentMethodType): PaymentGateway {
  const provider = providers[method]
  if (!provider) throw new Error(`Método de pagamento não suportado: ${method}`)
  return provider
}

export { CashOnDeliveryProvider, MulticaixaExpressProvider }
export type { PaymentGateway }
