export const dynamic = 'force-dynamic'
import { Suspense } from 'react'
import Link from 'next/link'
import { TopBar } from '@/components/admin/TopBar'
import { prisma } from '@/lib/prisma'
import { formatCurrency, formatDate } from '@/lib/utils'
import { OrderStatusBadge, PaymentStatusBadge } from '@/components/admin/OrderStatusBadge'
import { Button } from '@/components/ui/button'
import { Eye, Search } from 'lucide-react'
import type { OrderStatus, PaymentStatus } from '@/types'

async function getOrders(status?: string, search?: string) {
  return prisma.order.findMany({
    where: {
      ...(status ? { status: status as OrderStatus } : {}),
      ...(search ? {
        OR: [
          { customer: { name: { contains: search, mode: 'insensitive' } } },
          { guestName: { contains: search, mode: 'insensitive' } },
          { guestEmail: { contains: search, mode: 'insensitive' } },
        ],
      } : {}),
    },
    include: {
      customer: { select: { name: true, email: true } },
      payments: { select: { paymentMethod: true, paymentStatus: true } },
      _count: { select: { items: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })
}

const statusOptions = [
  { value: '', label: 'Todos' },
  { value: 'awaiting_confirmation', label: 'Aguardando' },
  { value: 'confirmed', label: 'Confirmados' },
  { value: 'processing', label: 'Em Processamento' },
  { value: 'shipped', label: 'Enviados' },
  { value: 'delivered', label: 'Entregues' },
  { value: 'cancelled', label: 'Cancelados' },
]

async function OrdersTable({ status, search }: { status?: string; search?: string }) {
  const orders = await getOrders(status, search)

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="border-b border-gray-200 bg-gray-50">
          <tr>
            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Pedido</th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Cliente</th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Estado</th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Pagamento</th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Total</th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Data</th>
            <th className="py-3 px-4" />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {orders.map((order) => (
            <tr key={order.id} className="hover:bg-gray-50">
              <td className="py-3 px-4 font-mono text-xs font-semibold text-gray-700">
                #{order.id.slice(-8).toUpperCase()}
              </td>
              <td className="py-3 px-4">
                <p className="font-medium text-gray-900">{order.customer?.name ?? order.guestName ?? 'Convidado'}</p>
                <p className="text-xs text-gray-400">{order.customer?.email ?? order.guestEmail}</p>
              </td>
              <td className="py-3 px-4">
                <OrderStatusBadge status={order.status as OrderStatus} />
              </td>
              <td className="py-3 px-4">
                {order.payments[0] && (
                  <PaymentStatusBadge status={order.payments[0].paymentStatus as PaymentStatus} />
                )}
              </td>
              <td className="py-3 px-4 font-medium text-gray-900">{formatCurrency(Number(order.total))}</td>
              <td className="py-3 px-4 text-xs text-gray-400">{formatDate(order.createdAt)}</td>
              <td className="py-3 px-4">
                <Link href={`/admin/pedidos/${order.id}`}>
                  <Button size="sm" variant="ghost"><Eye className="w-4 h-4" /></Button>
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {orders.length === 0 && (
        <div className="text-center py-12 text-gray-500">Nenhum pedido encontrado.</div>
      )}
    </div>
  )
}

export default async function PedidosAdminPage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  const { status, q } = await searchParams

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TopBar title="Pedidos" />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-3 p-4 border-b border-gray-200">
            <form className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  name="q"
                  defaultValue={q}
                  placeholder="Pesquisar cliente..."
                  className="pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 w-56"
                />
              </div>
              <div className="flex gap-1 flex-wrap">
                {statusOptions.map((opt) => (
                  <Link
                    key={opt.value}
                    href={`/admin/pedidos${opt.value ? `?status=${opt.value}` : ''}`}
                    className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${status === opt.value || (!status && !opt.value) ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                  >
                    {opt.label}
                  </Link>
                ))}
              </div>
            </form>
          </div>

          <Suspense fallback={<div className="p-8 text-center text-gray-500">A carregar...</div>}>
            <OrdersTable status={status} search={q} />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
