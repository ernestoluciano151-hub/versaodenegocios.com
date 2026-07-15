export const dynamic = 'force-dynamic'
import { Suspense } from 'react'
import { TopBar } from '@/components/admin/TopBar'
import { StatsCard } from '@/components/admin/StatsCard'
import { prisma } from '@/lib/prisma'
import { formatCurrency, formatDate } from '@/lib/utils'
import { OrderStatusBadge, PaymentStatusBadge } from '@/components/admin/OrderStatusBadge'
import {
  ShoppingBag, Users, TrendingUp, AlertTriangle, DollarSign, Package,
  ClipboardList, UserX, UserCheck, Share2, Wallet, Bell,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { OrderStatus, PaymentStatus } from '@/types'

async function getDashboardData() {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)

  // Core queries — always available
  const [
    totalOrders, monthOrders, lastMonthOrders,
    totalRevenue, monthRevenue, lastMonthRevenue,
    totalCustomers, recentOrders,
  ] = await Promise.all([
    prisma.order.count({ where: { status: { not: 'cancelled' } } }),
    prisma.order.count({ where: { createdAt: { gte: startOfMonth }, status: { not: 'cancelled' } } }),
    prisma.order.count({ where: { createdAt: { gte: startOfLastMonth, lt: startOfMonth }, status: { not: 'cancelled' } } }),
    prisma.order.aggregate({ _sum: { total: true }, where: { status: { not: 'cancelled' } } }),
    prisma.order.aggregate({ _sum: { total: true }, where: { createdAt: { gte: startOfMonth }, status: { not: 'cancelled' } } }),
    prisma.order.aggregate({ _sum: { total: true }, where: { createdAt: { gte: startOfLastMonth, lt: startOfMonth }, status: { not: 'cancelled' } } }),
    prisma.customer.count({ where: { active: true } }),
    prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { customer: { select: { name: true } }, payments: { select: { paymentMethod: true, paymentStatus: true } } },
    }),
  ])

  // Low stock (may fail if minStock field missing)
  const lowStockProducts = await prisma.product.findMany({
    where: { active: true, stock: { lte: 5 } },
    select: { id: true, name: true, stock: true, minStock: true },
    take: 5,
  }).catch(() => [] as { id: string; name: string; stock: number; minStock: number }[])

  // Sprint 6 KPIs — wrapped individually so a missing model doesn't crash the page
  const [
    suspendedCustomers, bannedCustomers,
    customOrdersTotal, customOrdersPending, customOrdersInProgress,
    affiliatesTotal, affiliatesPendingPayout,
    unreadNotifications,
  ] = await Promise.all([
    prisma.customer.count({ where: { suspendedAt: { not: null }, deletedAt: null } }).catch(() => 0),
    prisma.customer.count({ where: { bannedAt: { not: null }, deletedAt: null } }).catch(() => 0),
    prisma.customOrder.count({ where: { deletedAt: null } }).catch(() => 0),
    prisma.customOrder.count({ where: { status: 'pending' as const, deletedAt: null } }).catch(() => 0),
    prisma.customOrder.count({ where: { status: { in: ['quoted', 'accepted', 'in_production'] as const }, deletedAt: null } }).catch(() => 0),
    prisma.affiliate.count({ where: { status: 'active' as const } }).catch(() => 0),
    prisma.affiliatePayoutRequest.count({ where: { status: 'pending' as const } }).catch(() => 0),
    prisma.notification.count({ where: { read: false, customerId: null } }).catch(() => 0),
  ])

  const monthOrdersChange = lastMonthOrders > 0
    ? Math.round(((monthOrders - lastMonthOrders) / lastMonthOrders) * 100)
    : 0

  const prevRev = Number(lastMonthRevenue._sum.total ?? 0)
  const currRev = Number(monthRevenue._sum.total ?? 0)
  const monthRevenueChange = prevRev > 0 ? Math.round(((currRev - prevRev) / prevRev) * 100) : 0

  return {
    totalOrders,
    monthOrders,
    monthOrdersChange,
    totalRevenue: Number(totalRevenue._sum.total ?? 0),
    monthRevenue: currRev,
    monthRevenueChange,
    totalCustomers,
    suspendedCustomers,
    bannedCustomers,
    recentOrders,
    lowStockProducts,
    customOrdersTotal,
    customOrdersPending,
    customOrdersInProgress,
    affiliatesTotal,
    affiliatesPendingPayout,
    unreadNotifications,
  }
}

async function DashboardContent() {
  const data = await getDashboardData()

  return (
    <div className="p-6 space-y-6">
      {/* Row 1 — Core KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatsCard title="Receita Total" value={data.totalRevenue} currency icon={DollarSign} />
        <StatsCard title="Receita do Mês" value={data.monthRevenue} currency icon={TrendingUp} change={data.monthRevenueChange} />
        <StatsCard title="Pedidos do Mês" value={data.monthOrders} icon={ShoppingBag} change={data.monthOrdersChange} />
        <StatsCard title="Clientes Ativos" value={data.totalCustomers} icon={Users} />
      </div>

      {/* Row 2 — Sprint 6 KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-5 flex items-start gap-4">
          <div className="p-2.5 rounded-lg bg-purple-50">
            <ClipboardList className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Encomendas Custom</p>
            <p className="text-2xl font-bold text-gray-900 mt-0.5">{data.customOrdersTotal}</p>
            <div className="flex gap-3 mt-1.5 text-xs">
              <span className="text-amber-600 font-medium">{data.customOrdersPending} pendentes</span>
              <span className="text-blue-600 font-medium">{data.customOrdersInProgress} em curso</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5 flex items-start gap-4">
          <div className="p-2.5 rounded-lg bg-red-50">
            <UserX className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">CRM — Clientes</p>
            <p className="text-2xl font-bold text-gray-900 mt-0.5">{data.suspendedCustomers + data.bannedCustomers}</p>
            <div className="flex gap-3 mt-1.5 text-xs">
              <span className="text-orange-600 font-medium">{data.suspendedCustomers} suspensos</span>
              <span className="text-red-600 font-medium">{data.bannedCustomers} banidos</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5 flex items-start gap-4">
          <div className="p-2.5 rounded-lg bg-green-50">
            <Share2 className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Afiliados Ativos</p>
            <p className="text-2xl font-bold text-gray-900 mt-0.5">{data.affiliatesTotal}</p>
            {data.affiliatesPendingPayout > 0 && (
              <p className="mt-1.5 text-xs text-amber-600 font-medium">
                {data.affiliatesPendingPayout} pagamento{data.affiliatesPendingPayout !== 1 ? 's' : ''} pendente{data.affiliatesPendingPayout !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5 flex items-start gap-4">
          <div className="p-2.5 rounded-lg bg-blue-50">
            <Bell className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Notificações</p>
            <p className="text-2xl font-bold text-gray-900 mt-0.5">{data.unreadNotifications}</p>
            <p className="mt-1.5 text-xs text-gray-500">não lidas</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Recent orders */}
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Pedidos Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500">Pedido</th>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500">Cliente</th>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500">Estado</th>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500">Total</th>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500">Data</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {data.recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="py-2.5 px-3 font-mono text-xs text-gray-500">#{order.id.slice(-8).toUpperCase()}</td>
                      <td className="py-2.5 px-3">{order.customer?.name ?? order.guestName ?? 'Convidado'}</td>
                      <td className="py-2.5 px-3">
                        <OrderStatusBadge status={order.status as OrderStatus} />
                      </td>
                      <td className="py-2.5 px-3 font-medium">{formatCurrency(Number(order.total))}</td>
                      <td className="py-2.5 px-3 text-gray-500 text-xs">{formatDate(order.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Low stock */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-500" />
              Stock Baixo
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.lowStockProducts.length === 0 ? (
              <p className="text-sm text-gray-500">Nenhum produto com stock baixo.</p>
            ) : (
              <ul className="space-y-3">
                {data.lowStockProducts.map((p) => (
                  <li key={p.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <Package className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="text-sm text-gray-700 truncate">{p.name}</span>
                    </div>
                    <span className={`text-xs font-bold ml-2 flex-shrink-0 ${p.stock === 0 ? 'text-red-600' : 'text-orange-500'}`}>
                      {p.stock === 0 ? 'Esgotado' : `${p.stock} un`}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TopBar title="Dashboard" />
      <div className="flex-1 overflow-y-auto">
        <Suspense fallback={<div className="p-6 text-gray-500">A carregar...</div>}>
          <DashboardContent />
        </Suspense>
      </div>
    </div>
  )
}
