export const dynamic = 'force-dynamic'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { TopBar } from '@/components/admin/TopBar'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import { OrderStatusBadge } from '@/components/admin/OrderStatusBadge'
import { type OrderStatus } from '@/types'
import { Truck, Package, CheckCircle2, Clock } from 'lucide-react'

async function getLogisticsData() {
  const [toShip, inTransit, deliveredToday] = await Promise.all([
    // Confirmed/processing orders — ready to ship
    prisma.order.findMany({
      where: { status: { in: ['confirmed', 'processing'] } },
      include: {
        customer: { select: { name: true, email: true, phone: true } },
        items: { select: { quantity: true, product: { select: { name: true } } } },
      },
      orderBy: { createdAt: 'asc' },
    }),
    // Shipped but not yet delivered
    prisma.order.findMany({
      where: { status: 'shipped' },
      include: {
        customer: { select: { name: true, email: true, phone: true } },
        items: { select: { quantity: true, product: { select: { name: true } } } },
      },
      orderBy: { updatedAt: 'desc' },
    }),
    // Delivered today
    prisma.order.count({
      where: {
        status: 'delivered',
        updatedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      },
    }),
  ])
  return { toShip, inTransit, deliveredToday }
}

export default async function LogisticaPage() {
  const { toShip, inTransit, deliveredToday } = await getLogisticsData()

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TopBar title="Logística & Envios" />
      <div className="flex-1 overflow-y-auto p-6 space-y-6">

        {/* Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-orange-50 rounded-xl border border-orange-200 p-4">
            <Package className="w-5 h-5 text-orange-500 mb-1" />
            <p className="text-2xl font-bold text-orange-600">{toShip.length}</p>
            <p className="text-xs text-orange-600">Para Despachar</p>
          </div>
          <div className="bg-blue-50 rounded-xl border border-blue-200 p-4">
            <Truck className="w-5 h-5 text-blue-500 mb-1" />
            <p className="text-2xl font-bold text-blue-600">{inTransit.length}</p>
            <p className="text-xs text-blue-600">Em Trânsito</p>
          </div>
          <div className="bg-green-50 rounded-xl border border-green-200 p-4">
            <CheckCircle2 className="w-5 h-5 text-green-500 mb-1" />
            <p className="text-2xl font-bold text-green-600">{deliveredToday}</p>
            <p className="text-xs text-green-600">Entregues Hoje</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <Clock className="w-5 h-5 text-gray-400 mb-1" />
            <p className="text-2xl font-bold text-gray-900">{toShip.length + inTransit.length}</p>
            <p className="text-xs text-gray-500">Pedidos Activos</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* To ship */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
              <Package className="w-4 h-4 text-orange-500" />
              <h3 className="font-semibold text-gray-900 text-sm">Para Despachar</h3>
              <Badge variant="warning" className="ml-auto">{toShip.length}</Badge>
            </div>
            <ul className="divide-y divide-gray-100">
              {toShip.map((order) => {
                const addr = order.shippingAddress as { name?: string; city?: string; street?: string } | null
                const clientName = order.customer?.name ?? addr?.name ?? order.guestName ?? '—'
                const city = addr?.city ?? '—'
                return (
                  <li key={order.id} className="px-4 py-3 hover:bg-gray-50">
                    <div className="flex items-center justify-between mb-0.5">
                      <Link href={`/admin/pedidos/${order.id}`} className="font-medium text-gray-900 hover:text-orange-500 text-sm">
                        #{order.id.slice(-8).toUpperCase()}
                      </Link>
                      <OrderStatusBadge status={order.status as OrderStatus} />
                    </div>
                    <p className="text-xs text-gray-500">{clientName} · {city}</p>
                    <p className="text-xs text-gray-400">{order.items.map(i => `${i.product.name} ×${i.quantity}`).join(', ')}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-gray-400">{formatDate(order.createdAt)}</span>
                      <span className="text-xs font-semibold text-gray-900">{formatCurrency(Number(order.total))}</span>
                    </div>
                  </li>
                )
              })}
              {toShip.length === 0 && (
                <li className="px-4 py-8 text-center text-sm text-gray-400">Nenhum pedido para despachar</li>
              )}
            </ul>
          </div>

          {/* In transit */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
              <Truck className="w-4 h-4 text-blue-500" />
              <h3 className="font-semibold text-gray-900 text-sm">Em Trânsito</h3>
              <Badge variant="secondary" className="ml-auto">{inTransit.length}</Badge>
            </div>
            <ul className="divide-y divide-gray-100">
              {inTransit.map((order) => {
                const addr = order.shippingAddress as { name?: string; city?: string } | null
                const clientName = order.customer?.name ?? addr?.name ?? order.guestName ?? '—'
                const city = addr?.city ?? '—'
                const tracking = (order as { trackingNumber?: string | null }).trackingNumber
                return (
                  <li key={order.id} className="px-4 py-3 hover:bg-gray-50">
                    <div className="flex items-center justify-between mb-0.5">
                      <Link href={`/admin/pedidos/${order.id}`} className="font-medium text-gray-900 hover:text-orange-500 text-sm">
                        #{order.id.slice(-8).toUpperCase()}
                      </Link>
                      <OrderStatusBadge status={order.status as OrderStatus} />
                    </div>
                    <p className="text-xs text-gray-500">{clientName} · {city}</p>
                    {tracking && (
                      <p className="text-xs font-mono text-orange-600 mt-0.5">📦 {tracking}</p>
                    )}
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-gray-400">Enviado {formatDate(order.updatedAt)}</span>
                      <span className="text-xs font-semibold text-gray-900">{formatCurrency(Number(order.total))}</span>
                    </div>
                  </li>
                )
              })}
              {inTransit.length === 0 && (
                <li className="px-4 py-8 text-center text-sm text-gray-400">Nenhum pedido em trânsito</li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
