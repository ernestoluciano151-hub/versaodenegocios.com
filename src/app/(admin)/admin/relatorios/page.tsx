export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import { TopBar } from '@/components/admin/TopBar'
import { formatCurrency } from '@/lib/utils'
import { BarChart3, Users, Package, Tag } from 'lucide-react'

export default async function RelatoriosPage() {
  const now = new Date()

  // Last 6 months labels
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
    return { label: d.toLocaleString('pt-AO', { month: 'short', year: '2-digit' }), start: d, end: new Date(d.getFullYear(), d.getMonth() + 1, 0) }
  })

  const [topProducts, topCustomers, categoryRevenue, ordersByMonth] = await Promise.all([
    // Top products by quantity sold
    prisma.orderItem.groupBy({
      by: ['productId'],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 10,
    }),
    // Top customers by spend
    prisma.customer.findMany({
      orderBy: { totalSpent: 'desc' },
      take: 10,
      select: { id: true, name: true, totalSpent: true, ordersCount: true },
    }),
    // Revenue by category — fetch items with product's category, aggregate in memory
    prisma.orderItem.findMany({
      select: {
        price: true, quantity: true,
        product: { select: { category: { select: { name: true } } } },
      },
    }),
    // Orders per month
    Promise.all(months.map(m =>
      prisma.order.aggregate({
        where: { createdAt: { gte: m.start, lte: m.end } },
        _count: true,
        _sum: { total: true },
      }).then(r => ({ label: m.label, count: r._count, revenue: Number(r._sum.total ?? 0) }))
    )),
  ])

  // Get product names for top products
  const productIds = topProducts.map(p => p.productId)
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, name: true, brand: true, category: { select: { name: true } } },
  })
  const productMap = Object.fromEntries(products.map(p => [p.id, p]))

  // Aggregate category revenue in memory
  const categoryMap: Record<string, { revenue: number; units: number }> = {}
  for (const item of categoryRevenue) {
    const catName = item.product?.category?.name ?? 'Sem categoria'
    if (!categoryMap[catName]) categoryMap[catName] = { revenue: 0, units: 0 }
    categoryMap[catName].revenue += Number(item.price) * item.quantity
    categoryMap[catName].units += item.quantity
  }
  const categoryStats = Object.entries(categoryMap)
    .map(([name, s]) => ({ name, ...s }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 8)

  const maxRevenue = Math.max(...ordersByMonth.map(m => m.revenue), 1)
  const maxCatRevenue = Math.max(...categoryStats.map(c => c.revenue), 1)

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TopBar title="Relatórios" />
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Revenue chart (bar) */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="w-5 h-5 text-orange-500" />
            <h2 className="font-semibold text-gray-900">Receita Mensal (últimos 6 meses)</h2>
          </div>
          <div className="flex items-end gap-3 h-40">
            {ordersByMonth.map((m) => (
              <div key={m.label} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs font-semibold text-gray-700">{formatCurrency(m.revenue).replace('AOA', '').trim()}</span>
                <div
                  className="w-full bg-orange-500 rounded-t-md min-h-[4px] transition-all"
                  style={{ height: `${(m.revenue / maxRevenue) * 120}px` }}
                />
                <span className="text-xs text-gray-400">{m.label}</span>
                <span className="text-xs text-gray-400">{m.count} ped.</span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Top products */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
              <Package className="w-4 h-4 text-orange-500" />
              <h2 className="font-semibold text-gray-900">Top Produtos Vendidos</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-gray-100 bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">#</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Produto</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Qtd. Vendida</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {topProducts.map((tp, i) => {
                    const p = productMap[tp.productId]
                    return (
                      <tr key={tp.productId} className="hover:bg-gray-50">
                        <td className="py-3 px-4 text-gray-400 font-mono">{i + 1}</td>
                        <td className="py-3 px-4">
                          <p className="font-medium text-gray-900 truncate max-w-[180px]">{p?.name ?? 'N/A'}</p>
                          <p className="text-xs text-gray-400">{p?.brand ?? '—'} · {p?.category?.name ?? '—'}</p>
                        </td>
                        <td className="py-3 px-4 font-bold text-orange-600">{tp._sum.quantity} un.</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {topProducts.length === 0 && <p className="text-center py-8 text-gray-400 text-sm">Sem dados</p>}
            </div>
          </div>

          {/* Top customers */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
              <Users className="w-4 h-4 text-orange-500" />
              <h2 className="font-semibold text-gray-900">Top Clientes</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-gray-100 bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">#</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Cliente</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Pedidos</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {topCustomers.map((c, i) => (
                    <tr key={c.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4 text-gray-400 font-mono">{i + 1}</td>
                      <td className="py-3 px-4 font-medium text-gray-900 truncate max-w-[160px]">{c.name}</td>
                      <td className="py-3 px-4 text-gray-600">{c.ordersCount}</td>
                      <td className="py-3 px-4 font-bold text-gray-900">{formatCurrency(Number(c.totalSpent))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {topCustomers.length === 0 && <p className="text-center py-8 text-gray-400 text-sm">Sem dados</p>}
            </div>
          </div>
        </div>

        {/* Revenue by category */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-6">
            <Tag className="w-5 h-5 text-orange-500" />
            <h2 className="font-semibold text-gray-900">Receita por Categoria</h2>
          </div>
          {categoryStats.length === 0 ? (
            <p className="text-center py-8 text-gray-400 text-sm">Sem dados</p>
          ) : (
            <div className="space-y-3">
              {categoryStats.map((cat) => (
                <div key={cat.name} className="flex items-center gap-4">
                  <span className="text-sm text-gray-700 w-36 truncate flex-shrink-0">{cat.name}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-orange-500 h-full rounded-full transition-all"
                      style={{ width: `${(cat.revenue / maxCatRevenue) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-gray-900 w-28 text-right flex-shrink-0">{formatCurrency(cat.revenue)}</span>
                  <span className="text-xs text-gray-400 w-16 text-right flex-shrink-0">{cat.units} un.</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
