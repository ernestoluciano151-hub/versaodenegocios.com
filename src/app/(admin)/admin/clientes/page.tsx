export const dynamic = 'force-dynamic'
import { Suspense } from 'react'
import Link from 'next/link'
import { TopBar } from '@/components/admin/TopBar'
import { prisma } from '@/lib/prisma'
import { formatCurrency, formatDate, getInitials } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Search, Eye } from 'lucide-react'

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
              <td className="py-3 px-4 font-medium text-gray-900">{c.ordersCount}</td>
              <td className="py-3 px-4 font-bold text-gray-900">{formatCurrency(Number(c.totalSpent))}</td>
              <td className="py-3 px-4">
                <Badge variant={c.active ? 'success' : 'destructive'}>
                  {c.active ? 'Activo' : 'Bloqueado'}
                </Badge>
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
        <div className="text-center py-12 text-gray-500">Nenhum cliente encontrado.</div>
      )}
    </div>
  )
}

export default async function ClientesPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TopBar title="Clientes" />
      <div className="flex-1 overflow-y-auto p-6">
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
