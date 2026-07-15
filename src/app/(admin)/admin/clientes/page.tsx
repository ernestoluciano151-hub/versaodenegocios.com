export const dynamic = 'force-dynamic'
import { Suspense } from 'react'
import Link from 'next/link'
import { TopBar } from '@/components/admin/TopBar'
import { prisma } from '@/lib/prisma'
import { formatCurrency, formatDate, getInitials } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Search, Eye, Users, TrendingUp, ShoppingBag, UserCheck } from 'lucide-react'
import { CustomerStatusToggle } from './CustomerStatusToggle'

async function getCustomers(search?: string) {
  return prisma.customer.findMany({
    where: search ? {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ],
    } : undefined,
    orderBy: { totalSpent: 'desc' },
    take: 100,
  })
}

async function getStats() {
  const [total, active, topSpender] = await Promise.all([
    prisma.customer.count(),
    prisma.customer.count({ where: { active: true } }),
    prisma.customer.findFirst({ orderBy: { totalSpent: 'desc' }, select: { totalSpent: true } }),
  ])
  const totalSpent = await prisma.customer.aggregate({ _sum: { totalSpent: true } })
  return {
    total,
    active,
    inactive: total - active,
    totalRevenue: Number(totalSpent._sum.totalSpent ?? 0),
    topSpend: Number(topSpender?.totalSpent ?? 0),
  }
}

async function StatsBar() {
  const stats = await getStats()
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
          <Users className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          <p className="text-xs text-gray-500">Total de Clientes</p>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
          <UserCheck className="w-5 h-5 text-green-600" />
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
          <p className="text-xs text-gray-500">Clientes Activos</p>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
        <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
          <TrendingUp className="w-5 h-5 text-orange-600" />
        </div>
        <div>
          <p className="text-lg font-bold text-gray-900">{formatCurrency(stats.totalRevenue)}</p>
          <p className="text-xs text-gray-500">Receita Total</p>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
          <ShoppingBag className="w-5 h-5 text-purple-600" />
        </div>
        <div>
          <p className="text-lg font-bold text-gray-900">{formatCurrency(stats.topSpend)}</p>
          <p className="text-xs text-gray-500">Maior Comprador</p>
        </div>
      </div>
    </div>
  )
}

async function CustomersTable({ search }: { search?: string }) {
  const customers = await getCustomers(search)

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="border-b border-gray-200 bg-gray-50">
          <tr>
            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Cliente</th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Telefone</th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Pedidos</th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Total Gasto</th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Estado</th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Desde</th>
            <th className="py-3 px-4" />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {customers.map((c) => (
            <tr key={c.id} className="hover:bg-gray-50">
              <td className="py-3 px-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 text-xs font-bold flex-shrink-0">
                    {getInitials(c.name)}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{c.name}</p>
                    <p className="text-xs text-gray-400">{c.email}</p>
                  </div>
                </div>
              </td>
              <td className="py-3 px-4 text-gray-600">{c.phone ?? '—'}</td>
              <td className="py-3 px-4">
                <div className="flex items-center gap-1">
                  <span className="font-medium text-gray-900">{c.ordersCount}</span>
                  {c.ordersCount >= 10 && <span className="text-xs text-orange-500 font-semibold">★ VIP</span>}
                </div>
              </td>
              <td className="py-3 px-4 font-bold text-gray-900">{formatCurrency(Number(c.totalSpent))}</td>
              <td className="py-3 px-4">
                <CustomerStatusToggle customerId={c.id} initialActive={c.active} />
              </td>
              <td className="py-3 px-4 text-xs text-gray-400">{formatDate(c.createdAt)}</td>
              <td className="py-3 px-4">
                <Link href={`/admin/clientes/${c.id}`}>
                  <Button size="sm" variant="ghost"><Eye className="w-4 h-4" /></Button>
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {customers.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>Nenhum cliente encontrado.</p>
        </div>
      )}
    </div>
  )
}

export default async function ClientesPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TopBar title="CRM Clientes" />
      <div className="flex-1 overflow-y-auto p-6">
        <Suspense fallback={null}>
          <StatsBar />
        </Suspense>
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <form className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  name="q"
                  defaultValue={q}
                  placeholder="Pesquisar cliente..."
                  className="pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 w-64"
                />
              </div>
            </form>
          </div>
          <Suspense fallback={<div className="p-8 text-center text-gray-500">A carregar...</div>}>
            <CustomersTable search={q} />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
