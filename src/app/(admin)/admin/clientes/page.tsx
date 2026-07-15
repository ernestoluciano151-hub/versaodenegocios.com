export const dynamic = 'force-dynamic'
import { Suspense } from 'react'
import Link from 'next/link'
import { TopBar } from '@/components/admin/TopBar'
import { prisma } from '@/lib/prisma'
import { formatCurrency, formatDate, getInitials } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Search, Eye, Users, UserCheck, ShieldBan, UserX } from 'lucide-react'
import { CustomerStatusToggle } from './CustomerStatusToggle'

type StatusFilter = 'all' | 'active' | 'suspended' | 'banned'

function statusWhere(status: StatusFilter) {
  if (status === 'active')    return { active: true, suspendedAt: null as null, bannedAt: null as null, deletedAt: null as null }
  if (status === 'suspended') return { suspendedAt: { not: null as null } }
  if (status === 'banned')    return { bannedAt: { not: null as null } }
  return { deletedAt: null as null }
}

async function getCustomers(search?: string, status: StatusFilter = 'all') {
  return prisma.customer.findMany({
    where: {
      ...statusWhere(status),
      ...(search ? {
        OR: [
          { name:  { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } },
        ],
      } : {}),
    },
    orderBy: { totalSpent: 'desc' },
    take: 100,
  })
}

async function StatsBar() {
  const [total, active, suspended, banned] = await Promise.all([
    prisma.customer.count(),
    prisma.customer.count({ where: { active: true } }),
    prisma.customer.count({ where: { suspendedAt: { not: null } } }),
    prisma.customer.count({ where: { bannedAt: { not: null } } }),
  ])

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
          <Users className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900">{total}</p>
          <p className="text-xs text-gray-500">Total de Clientes</p>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
          <UserCheck className="w-5 h-5 text-green-600" />
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900">{active}</p>
          <p className="text-xs text-gray-500">Activos</p>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
        <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
          <UserX className="w-5 h-5 text-yellow-600" />
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900">{suspended}</p>
          <p className="text-xs text-gray-500">Suspensos</p>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
        <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
          <ShieldBan className="w-5 h-5 text-red-600" />
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900">{banned}</p>
          <p className="text-xs text-gray-500">Banidos</p>
        </div>
      </div>
    </div>
  )
}

function RiskScore({ score }: { score?: number | null }) {
  if (score == null) return <span className="text-xs text-gray-400">—</span>
  const color = score <= 33 ? 'bg-green-500' : score <= 66 ? 'bg-yellow-500' : 'bg-red-500'
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-xs text-gray-500">{score}</span>
    </div>
  )
}

function StatusBadge({ active, suspendedAt, bannedAt, deletedAt }: {
  active: boolean
  suspendedAt?: Date | null
  bannedAt?: Date | null
  deletedAt?: Date | null
}) {
  if (deletedAt)  return <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium">Eliminado</span>
  if (bannedAt)   return <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">Banido</span>
  if (suspendedAt) return <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 font-medium">Suspenso</span>
  if (active)     return <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">Activo</span>
  return <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">Inactivo</span>
}

async function CustomersTable({ search, status }: { search?: string; status: StatusFilter }) {
  const customers = await getCustomers(search, status)

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="border-b border-gray-200 bg-gray-50">
          <tr>
            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Cliente</th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Email</th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Pedidos</th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Gasto</th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Risco</th>
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
                    {c.ordersCount >= 10 && <span className="text-xs text-orange-500 font-semibold">★ VIP</span>}
                  </div>
                </div>
              </td>
              <td className="py-3 px-4 text-gray-600 text-xs">{c.email}</td>
              <td className="py-3 px-4 font-medium text-gray-900">{c.ordersCount}</td>
              <td className="py-3 px-4 font-bold text-gray-900">{formatCurrency(Number(c.totalSpent))}</td>
              <td className="py-3 px-4">
                <RiskScore score={(c as { riskScore?: number | null }).riskScore} />
              </td>
              <td className="py-3 px-4">
                <div className="flex items-center gap-2">
                  <StatusBadge
                    active={c.active}
                    suspendedAt={(c as { suspendedAt?: Date | null }).suspendedAt}
                    bannedAt={(c as { bannedAt?: Date | null }).bannedAt}
                    deletedAt={(c as { deletedAt?: Date | null }).deletedAt}
                  />
                  <CustomerStatusToggle
                    customerId={c.id}
                    initialActive={c.active}
                    initialSuspended={!!(c as { suspendedAt?: Date | null }).suspendedAt}
                    initialBanned={!!(c as { bannedAt?: Date | null }).bannedAt}
                  />
                </div>
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

const STATUS_TABS: { value: StatusFilter; label: string }[] = [
  { value: 'all',       label: 'Todos' },
  { value: 'active',    label: 'Activos' },
  { value: 'suspended', label: 'Suspensos' },
  { value: 'banned',    label: 'Banidos' },
]

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>
}) {
  const { q, status: statusParam } = await searchParams
  const status = (STATUS_TABS.map(t => t.value).includes(statusParam as StatusFilter)
    ? statusParam
    : 'all') as StatusFilter

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TopBar title="CRM Clientes" />
      <div className="flex-1 overflow-y-auto p-6">
        <Suspense fallback={null}>
          <StatsBar />
        </Suspense>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              {STATUS_TABS.map(tab => (
                <Link
                  key={tab.value}
                  href={`/admin/clientes?status=${tab.value}${q ? `&q=${encodeURIComponent(q)}` : ''}`}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    status === tab.value
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.label}
                </Link>
              ))}
            </div>
            <form className="flex items-center gap-2">
              <input type="hidden" name="status" value={status} />
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
            <CustomersTable search={q} status={status} />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
