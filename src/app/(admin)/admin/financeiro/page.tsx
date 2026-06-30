export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import { TopBar } from '@/components/admin/TopBar'
import { formatCurrency } from '@/lib/utils'
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart } from 'lucide-react'
import { ExpenseManager } from './ExpenseManager'

export default async function FinanceiroPage() {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

  const [
    revenueThisMonth,
    revenueLastMonth,
    expensesThisMonth,
    recentPayments,
    recentExpenses,
    expensesByCategory,
    suppliers,
  ] = await Promise.all([
    prisma.payment.aggregate({
      where: { paymentStatus: 'paid', createdAt: { gte: startOfMonth } },
      _sum: { amount: true },
    }),
    prisma.payment.aggregate({
      where: { paymentStatus: 'paid', createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } },
      _sum: { amount: true },
    }),
    prisma.expense.aggregate({
      where: { date: { gte: startOfMonth } },
      _sum: { amount: true },
    }),
    prisma.payment.findMany({
      where: { paymentStatus: 'paid' },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { order: { select: { guestName: true } }, customer: { select: { name: true } } },
    }),
    prisma.expense.findMany({
      orderBy: { date: 'desc' },
      take: 20,
      include: { supplier: { select: { name: true } } },
    }),
    prisma.expense.groupBy({
      by: ['category'],
      _sum: { amount: true },
      orderBy: { _sum: { amount: 'desc' } },
    }),
    prisma.supplier.findMany({ where: { active: true }, orderBy: { name: 'asc' }, select: { id: true, name: true } }),
  ])

  const revenue = Number(revenueThisMonth._sum.amount ?? 0)
  const lastRevenue = Number(revenueLastMonth._sum.amount ?? 0)
  const expenses = Number(expensesThisMonth._sum.amount ?? 0)
  const profit = revenue - expenses
  const revenueChange = lastRevenue > 0 ? ((revenue - lastRevenue) / lastRevenue) * 100 : 0

  const expensesData = recentExpenses.map(e => ({
    ...e,
    amount: Number(e.amount),
    date: e.date.toISOString(),
    createdAt: e.createdAt.toISOString(),
    updatedAt: e.updatedAt.toISOString(),
  }))

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TopBar title="Financeiro" />
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Receita (mês)', value: formatCurrency(revenue), icon: TrendingUp, change: `${revenueChange >= 0 ? '+' : ''}${revenueChange.toFixed(1)}% vs mês anterior`, positive: revenueChange >= 0 },
            { label: 'Despesas (mês)', value: formatCurrency(expenses), icon: TrendingDown, change: null, positive: false },
            { label: 'Lucro (mês)', value: formatCurrency(profit), icon: DollarSign, change: null, positive: profit >= 0 },
            { label: 'Margem', value: revenue > 0 ? `${((profit / revenue) * 100).toFixed(1)}%` : '—', icon: ShoppingCart, change: null, positive: profit >= 0 },
          ].map(({ label, value, icon: Icon, change, positive }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Icon className="w-4 h-4 text-gray-400" />
                <span className="text-xs text-gray-500">{label}</span>
              </div>
              <p className="text-xl font-bold text-gray-900">{value}</p>
              {change && <p className={`text-xs mt-1 ${positive ? 'text-green-600' : 'text-red-500'}`}>{change}</p>}
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Recent payments */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Últimos Pagamentos Recebidos</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-gray-100 bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Cliente</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Valor</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Data</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {recentPayments.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{p.customer?.name ?? p.order.guestName ?? 'Convidado'}</td>
                      <td className="py-3 px-4 font-bold text-green-600">{formatCurrency(Number(p.amount))}</td>
                      <td className="py-3 px-4 text-xs text-gray-400">{p.createdAt.toLocaleDateString('pt-AO')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {recentPayments.length === 0 && <p className="text-center py-8 text-gray-400 text-sm">Sem pagamentos</p>}
            </div>
          </div>

          {/* Expenses by category */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-900 text-sm mb-3">Despesas por Categoria</h3>
            {expensesByCategory.length === 0 ? (
              <p className="text-sm text-gray-400">Sem despesas</p>
            ) : (
              <ul className="space-y-2">
                {expensesByCategory.map((ec) => (
                  <li key={ec.category} className="flex items-center justify-between text-sm">
                    <span className="text-gray-700 capitalize">{ec.category}</span>
                    <span className="font-semibold text-gray-900">{formatCurrency(Number(ec._sum.amount ?? 0))}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Expense Manager */}
        <ExpenseManager initialExpenses={expensesData} suppliers={suppliers} />
      </div>
    </div>
  )
}
