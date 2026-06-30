export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'SUPPORT'

export type OrderStatus =
  | 'awaiting_confirmation'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'returned'

export type PaymentStatus =
  | 'pending'
  | 'awaiting_delivery'
  | 'paid'
  | 'failed'
  | 'refunded'
  | 'cancelled'

export type PaymentMethodType =
  | 'cash_on_delivery'
  | 'multicaixa_express'
  | 'bank_transfer'
  | 'credit_card'
  | 'paypal'
  | 'stripe'

export interface ProductImage {
  url: string
  alt?: string
}

export interface TechnicalSpec {
  label: string
  value: string
}

export interface ProductDimensions {
  length?: number
  width?: number
  height?: number
  unit?: string
}

export interface CartItem {
  id: string
  productId: string
  name: string
  brand: string
  slug: string
  image: string
  price: number
  salePrice?: number
  quantity: number
  stock: number
  savedForLater?: boolean
}

export interface CartState {
  items: CartItem[]
  couponCode?: string
  couponDiscount: number
  shipping: number
}

export interface CartTotals {
  subtotal: number
  discount: number
  shipping: number
  total: number
  itemCount: number
}

export interface CheckoutAddress {
  name: string
  email: string
  phone: string
  street: string
  city: string
  province: string
  country: string
  notes?: string
}

export type CheckoutStep = 'dados' | 'morada' | 'pagamento' | 'confirmacao'

export interface DashboardStats {
  totalRevenue: number
  monthRevenue: number
  totalOrders: number
  monthOrders: number
  totalCustomers: number
  conversionRate: number
  abandonedCarts: number
  lowStockCount: number
}

export interface SalesDataPoint {
  date: string
  revenue: number
  orders: number
}

export interface TopProduct {
  id: string
  name: string
  image: string
  sold: number
  revenue: number
}

export interface AdminProduct {
  id: string
  name: string
  slug: string
  brand: string
  category: { name: string }
  price: number
  salePrice?: number
  stock: number
  active: boolean
  featured: boolean
  images: string[]
  createdAt: Date
}

export interface AdminOrder {
  id: string
  customer?: { name: string; email: string } | null
  guestName?: string | null
  guestEmail?: string | null
  status: OrderStatus
  total: number
  items: Array<{ quantity: number; product: { name: string } }>
  payments: Array<{ paymentMethod: PaymentMethodType; paymentStatus: PaymentStatus }>
  createdAt: Date
}

export interface AdminCustomer {
  id: string
  name: string
  email: string
  phone?: string | null
  totalSpent: number
  ordersCount: number
  active: boolean
  createdAt: Date
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  awaiting_confirmation: 'Aguardando Confirmação',
  confirmed: 'Confirmado',
  processing: 'Em Processamento',
  shipped: 'Enviado',
  delivered: 'Entregue',
  cancelled: 'Cancelado',
  returned: 'Devolvido',
}

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: 'Pendente',
  awaiting_delivery: 'Aguardando Entrega',
  paid: 'Pago',
  failed: 'Falhado',
  refunded: 'Reembolsado',
  cancelled: 'Cancelado',
}

export const PAYMENT_METHOD_LABELS: Record<PaymentMethodType, string> = {
  cash_on_delivery: 'Pagamento na Entrega',
  multicaixa_express: 'Multicaixa Express',
  bank_transfer: 'Transferência Bancária',
  credit_card: 'Cartão de Crédito',
  paypal: 'PayPal',
  stripe: 'Stripe',
}
