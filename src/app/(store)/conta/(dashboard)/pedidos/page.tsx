export const dynamic = 'force-dynamic'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCustomerSession } from '@/lib/customer-auth'
import { prisma } from '@/lib/prisma'
import { formatCurrency, formatDate } from '@/lib/utils'
import { OrderStatusBadge, PaymentStatusBadge } from '@/components/admin/OrderStatusBadge'
import { Badge } from '@/components/ui/badge'
import { PAYMENT_METHOD_LABELS, type OrderStatus, type PaymentStatus, type PaymentMethodType } from '@/types'
import { ShoppingBag, Eye, Search } from 'lucide-react'

const FILTER_TABS = [
  { key: '', label: 'Todos' },
  { key: 'awaiting_confirmation', label: 'Pendentes' },
  { key: 'paid', label: 'Pagos' },
  { key: 'shipped', label: 'Enviados' },
  { key: 'delivered', label: 'Entregues' },
  { key: 'cancelled', label: 'Cancelados' },
]

export default async function ContaPedidosPage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  const session = await getCustomerSession()
  if (!session) redirect('/conta/login')
  const { status, q } = await searchParams

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = { customerId: session.id }
  if (status) where.status = status
  if (q) where.OR = [
    { id: { contains: q, mode: 'insensitive' } },
    { items: { some: { product: { name: { contains: q, mode: 'insensitive' } } } } },
  ]

  const orders = await prisma.order.findMany({
    where,
    include: {
      items: { include: { product: { select: { name: true, images: true } } }, take: 1 },
      payments: { select: { paymentMethod: true, paymentStatus: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Os Meus Pedidos</h1>
        <p className="text-gray-500 text-sm mt-1">{orders.length} pedido{orders.length !== 1 ? 's' : ''} encontrado{orders.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex flex-col sm:flex-row gap-3 p-4 border-b border-gray-100">
          <form className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              name="q"
              defaultValue={q}
              placeholder="Pesquisar pedido ou produto..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </form>
          <div className="flex gap-2 flex-wrap">
            {FILTER_TABS.map(tab => (
              <Link
                key={tab.key}
                href={`/conta/pedidos${tab.key ? `?status=${tab.key}` : ''}${q ? `${tab.key ? '&' : '?'}q=${q}` : ''}`}
                className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors whitespace-nowrap ${status === tab.key || (!status && !tab.key) ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                {tab.label}
              </Link>
            ))}
          </div>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-16">
            <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">Nenhum pedido encontrado</p>
            <Link href="/produtos" className="text-orange-500 hover:underline text-sm mt-1 inline-block">Começar a comprar</Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {orders.map((order) => {
              const firstItem = order.items[0]
              const payment = order.payments[0]
              return (
                <div key={order.id} className="p-4 sm:p-5 hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {firstItem?.product.images[0] && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={firstItem.product.images[0]} alt="" className="w-14 h-14 object-contain rounded-lg border border-gray-200 bg-gray-50 p-1 flex-shrink-0" />
                      )}
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-sm font-bold text-gray-900">#{order.id.slice(-8).toUpperCase()}</span>
                          <OrderStatusBadge status={order.status as OrderStatus} />
                          {payment && <PaymentStatusBadge status={payment.paymentStatus as PaymentStatus} />}
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">{formatDate(order.createdAt)} · {order.items.length} item{order.items.length !== 1 ? 's' : ''}</p>
                        {payment && (
                          <Badge variant="secondary" className="text-xs mt-1">
                            {PAYMENT_METHOD_LABELS[payment.paymentMethod as PaymentMethodType]}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 sm:flex-col sm:items-end">
                      <span className="text-lg font-bold text-gray-900">{formatCurrency(Number(order.total))}</span>
                      <Link
                        href={`/conta/pedidos/${order.id}`}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 text-white text-xs font-medium rounded-lg hover:bg-orange-600 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" /> Ver detalhes
                      </Link>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
