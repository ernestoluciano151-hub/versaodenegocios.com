export const dynamic = 'force-dynamic'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { TopBar } from '@/components/admin/TopBar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDate } from '@/lib/utils'
import { OrderStatusBadge, PaymentStatusBadge } from '@/components/admin/OrderStatusBadge'
import { ORDER_STATUS_LABELS, PAYMENT_METHOD_LABELS, type OrderStatus, type PaymentStatus, type PaymentMethodType } from '@/types'
import { ArrowLeft } from 'lucide-react'
import { OrderStatusSelect } from './OrderStatusSelect'

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      customer: true,
      items: { include: { product: { select: { name: true, slug: true, images: true } } } },
      payments: true,
    },
  })

  if (!order) notFound()

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TopBar
        title={`Pedido #${order.id.slice(-8).toUpperCase()}`}
        actions={
          <Link href="/admin/pedidos">
            <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-1" /> Voltar</Button>
          </Link>
        }
      />
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Order items */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="font-semibold text-gray-900">Itens do Pedido</h2>
                <OrderStatusSelect orderId={order.id} currentStatus={order.status as OrderStatus} />
              </div>
              <div className="divide-y divide-gray-100">
                {order.items.map((item) => (
                  <div key={item.id} className="px-5 py-4 flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-50 rounded-lg overflow-hidden flex-shrink-0 border border-gray-200">
                      {item.product.images[0] && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.product.images[0]} alt={item.product.name} className="w-full h-full object-contain p-1" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link href={`/admin/produtos`} className="font-medium text-gray-900 hover:text-orange-500 text-sm truncate block">
                        {item.product.name}
                      </Link>
                      <p className="text-xs text-gray-400">Qtd: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900 text-sm">
                        {formatCurrency(Number(item.salePrice ?? item.price) * item.quantity)}
                      </p>
                      <p className="text-xs text-gray-400">{formatCurrency(Number(item.salePrice ?? item.price))} × {item.quantity}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-5 py-4 bg-gray-50 border-t border-gray-100 space-y-1">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal</span>
                  <span>{formatCurrency(Number(order.subtotal))}</span>
                </div>
                {Number(order.discount) > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Desconto {order.couponCode && `(${order.couponCode})`}</span>
                    <span>-{formatCurrency(Number(order.discount))}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-semibold text-gray-900 pt-1 border-t border-gray-200">
                  <span>Total</span>
                  <span>{formatCurrency(Number(order.total))}</span>
                </div>
              </div>
            </div>

            {/* Payments */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-900">Pagamentos</h2>
              </div>
              <div className="divide-y divide-gray-100">
                {order.payments.map((p) => (
                  <div key={p.id} className="px-5 py-4 flex items-center justify-between">
                    <div>
                      <Badge variant="secondary" className="text-xs mb-1">
                        {PAYMENT_METHOD_LABELS[p.paymentMethod as PaymentMethodType]}
                      </Badge>
                      <p className="text-xs text-gray-400">{p.transactionReference ?? '—'}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(Number(p.amount))}</p>
                      <PaymentStatusBadge status={p.paymentStatus as PaymentStatus} />
                    </div>
                  </div>
                ))}
                {order.payments.length === 0 && (
                  <p className="px-5 py-4 text-sm text-gray-400">Sem pagamentos</p>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Status */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Estado do Pedido</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Estado</span>
                  <OrderStatusBadge status={order.status as OrderStatus} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Criado</span>
                  <span className="text-sm text-gray-700">{formatDate(order.createdAt)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Actualizado</span>
                  <span className="text-sm text-gray-700">{formatDate(order.updatedAt)}</span>
                </div>
              </div>
            </div>

            {/* Customer */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Cliente</h3>
              {order.customer ? (
                <div className="space-y-1">
                  <p className="font-medium text-gray-900">{order.customer.name}</p>
                  <p className="text-sm text-gray-500">{order.customer.email}</p>
                  <p className="text-sm text-gray-500">{order.customer.phone}</p>
                  <Link href={`/admin/clientes/${order.customer.id}`} className="text-xs text-orange-500 hover:underline">Ver perfil →</Link>
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="font-medium text-gray-900">{order.guestName ?? 'Convidado'}</p>
                  <p className="text-sm text-gray-500">{order.guestEmail}</p>
                  <p className="text-sm text-gray-500">{order.guestPhone}</p>
                </div>
              )}
            </div>

            {/* Delivery */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Entrega</h3>
              <pre className="text-sm text-gray-600 whitespace-pre-wrap">{JSON.stringify(order.shippingAddress, null, 2)}</pre>
              {order.notes && (
                <div className="mt-2 pt-2 border-t border-gray-100">
                  <p className="text-xs text-gray-400 mb-1">Notas</p>
                  <p className="text-sm text-gray-600">{order.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
