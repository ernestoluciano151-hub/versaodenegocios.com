export const dynamic = 'force-dynamic'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { getCustomerSession } from '@/lib/customer-auth'
import { prisma } from '@/lib/prisma'
import { formatCurrency, formatDate } from '@/lib/utils'
import { OrderStatusBadge, PaymentStatusBadge } from '@/components/admin/OrderStatusBadge'
import { Badge } from '@/components/ui/badge'
import { PAYMENT_METHOD_LABELS, ORDER_STATUS_LABELS, type OrderStatus, type PaymentStatus, type PaymentMethodType } from '@/types'
import { ArrowLeft, RotateCcw, FileText, MessageCircle, MapPin, Truck } from 'lucide-react'
import { CancelOrderButton } from './CancelOrderButton'

export default async function ContaPedidoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getCustomerSession()
  if (!session) redirect('/conta/login')
  const { id } = await params

  const order = await prisma.order.findUnique({
    where: { id, customerId: session.id }, // Security: only own orders
    include: {
      items: { include: { product: { select: { name: true, slug: true, images: true, brand: true } } } },
      payments: { orderBy: { createdAt: 'desc' } },
    },
  })

  if (!order) notFound()

  const shipping = order.shippingAddress as Record<string, string>
  const estimatedDays = order.status === 'delivered' ? null : order.status === 'shipped' ? 2 : 5

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/conta/pedidos" className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pedido #{order.id.slice(-8).toUpperCase()}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{formatDate(order.createdAt)}</p>
        </div>
      </div>

      {/* Status timeline */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-900 mb-4">Estado do Pedido</h2>
        <div className="flex items-center gap-2 flex-wrap">
          {(['awaiting_confirmation', 'confirmed', 'processing', 'shipped', 'delivered'] as OrderStatus[]).map((s, i, arr) => {
            const statuses: OrderStatus[] = ['awaiting_confirmation', 'confirmed', 'processing', 'shipped', 'delivered']
            const currentIdx = statuses.indexOf(order.status as OrderStatus)
            const stepIdx = statuses.indexOf(s)
            const isDone = stepIdx <= currentIdx && order.status !== 'cancelled'
            return (
              <div key={s} className="flex items-center gap-2">
                <div className={`flex flex-col items-center`}>
                  <div className={`w-3 h-3 rounded-full ${isDone ? 'bg-orange-500' : 'bg-gray-200'}`} />
                  <span className={`text-xs mt-1 ${isDone ? 'text-orange-600 font-medium' : 'text-gray-400'}`}>{ORDER_STATUS_LABELS[s]}</span>
                </div>
                {i < arr.length - 1 && <div className={`w-8 h-0.5 mb-4 ${isDone && stepIdx < currentIdx ? 'bg-orange-500' : 'bg-gray-200'}`} />}
              </div>
            )
          })}
          {order.status === 'cancelled' && <Badge variant="destructive">Cancelado</Badge>}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Products */}
        <div className="md:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Produtos</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {order.items.map((item) => (
                <div key={item.id} className="px-5 py-4 flex items-center gap-4">
                  <div className="w-14 h-14 bg-gray-50 rounded-lg border border-gray-200 flex-shrink-0 overflow-hidden">
                    {item.product.images[0] && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.product.images[0]} alt={item.product.name} className="w-full h-full object-contain p-1" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link href={`/produtos/${item.product.slug}`} className="text-sm font-medium text-gray-900 hover:text-orange-500 line-clamp-2">
                      {item.product.name}
                    </Link>
                    <p className="text-xs text-gray-400">{item.product.brand} · Qtd: {item.quantity}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-semibold">{formatCurrency(Number(item.salePrice ?? item.price) * item.quantity)}</p>
                    <p className="text-xs text-gray-400">{formatCurrency(Number(item.salePrice ?? item.price))} × {item.quantity}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-5 py-4 bg-gray-50 space-y-1.5 text-sm border-t border-gray-100">
              <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>{formatCurrency(Number(order.subtotal))}</span></div>
              {Number(order.discount) > 0 && <div className="flex justify-between text-green-600"><span>Desconto {order.couponCode && `(${order.couponCode})`}</span><span>-{formatCurrency(Number(order.discount))}</span></div>}
              <div className="flex justify-between font-bold text-gray-900 pt-1 border-t border-gray-200 text-base"><span>Total</span><span>{formatCurrency(Number(order.total))}</span></div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-3">
            <Link href="/produtos" className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 transition-colors">
              <RotateCcw className="w-4 h-4" /> Voltar a comprar
            </Link>
            <Link href="/conta/suporte" className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">
              <MessageCircle className="w-4 h-4" /> Contactar Suporte
            </Link>
            {['awaiting_confirmation', 'confirmed'].includes(order.status) && (
              <CancelOrderButton orderId={order.id} createdAt={order.createdAt.toISOString()} />
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Delivery */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-900 text-sm mb-3 flex items-center gap-2"><Truck className="w-4 h-4 text-orange-500" /> Entrega</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p><span className="text-gray-400">Endereço:</span></p>
              <p className="font-medium">{shipping.street}</p>
              <p>{shipping.district && `${shipping.district}, `}{shipping.municipality ?? shipping.city}</p>
              <p>{shipping.province}, Angola</p>
              {shipping.reference && <p className="text-xs text-gray-400">Ref: {shipping.reference}</p>}
            </div>
            {estimatedDays && order.status !== 'cancelled' && (
              <div className="mt-3 p-2 bg-orange-50 rounded-lg text-xs text-orange-700">
                <OrderStatusBadge status={order.status as OrderStatus} />
                <p className="mt-1">Prazo estimado: {estimatedDays} dias úteis</p>
              </div>
            )}
          </div>

          {/* Payments */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-900 text-sm mb-3 flex items-center gap-2"><FileText className="w-4 h-4 text-orange-500" /> Pagamento</h3>
            {order.payments.map((p) => (
              <div key={p.id} className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Método</span>
                  <Badge variant="secondary" className="text-xs">{PAYMENT_METHOD_LABELS[p.paymentMethod as PaymentMethodType]}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Estado</span>
                  <PaymentStatusBadge status={p.paymentStatus as PaymentStatus} />
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Valor</span>
                  <span className="font-bold">{formatCurrency(Number(p.amount))}</span>
                </div>
                {p.paymentDate && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Data</span>
                    <span className="text-xs">{formatDate(p.paymentDate)}</span>
                  </div>
                )}
                {p.transactionReference && (
                  <div className="pt-2 border-t border-gray-100">
                    <p className="text-xs text-gray-400">Ref: {p.transactionReference}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {order.notes && (
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-900 text-sm mb-2">Notas</h3>
              <p className="text-sm text-gray-600">{order.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
