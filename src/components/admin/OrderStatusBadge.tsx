import { Badge } from '@/components/ui/badge'
import { ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS, type OrderStatus, type PaymentStatus } from '@/types'

const orderVariants: Record<OrderStatus, 'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'outline'> = {
  awaiting_confirmation: 'warning',
  confirmed: 'default',
  processing: 'default',
  shipped: 'outline',
  delivered: 'success',
  cancelled: 'destructive',
  returned: 'secondary',
}

const paymentVariants: Record<PaymentStatus, 'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'outline'> = {
  pending: 'warning',
  awaiting_delivery: 'outline',
  paid: 'success',
  failed: 'destructive',
  refunded: 'secondary',
  cancelled: 'destructive',
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <Badge variant={orderVariants[status]}>
      {ORDER_STATUS_LABELS[status]}
    </Badge>
  )
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  return (
    <Badge variant={paymentVariants[status]}>
      {PAYMENT_STATUS_LABELS[status]}
    </Badge>
  )
}
