export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import { TopBar } from '@/components/admin/TopBar'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import { SupportTableClient } from './SupportTableClient'

const statusConfig: Record<string, { label: string; variant: 'default' | 'warning' | 'success' | 'secondary' }> = {
  open: { label: 'Aberto', variant: 'default' },
  in_progress: { label: 'Em Análise', variant: 'warning' },
  resolved: { label: 'Respondido', variant: 'success' },
  closed: { label: 'Fechado', variant: 'secondary' },
}

export default async function SuportePage() {
  const tickets = await prisma.supportTicket.findMany({
    include: { customer: { select: { name: true, email: true } } },
    orderBy: { createdAt: 'desc' },
  })

  const total = tickets.length
  const open = tickets.filter((t) => t.status === 'open').length
  const inProgress = tickets.filter((t) => t.status === 'in_progress').length
  const resolved = tickets.filter((t) => t.status === 'resolved').length

  const serialized = tickets.map((t) => ({
    id: t.id,
    subject: t.subject,
    status: t.status,
    createdAt: t.createdAt.toISOString(),
    customer: t.customer,
    adminReply: t.adminReply,
  }))

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TopBar title="Suporte" />
      <div className="flex-1 overflow-y-auto p-6 space-y-6">

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total', value: total, color: 'text-gray-900' },
            { label: 'Abertos', value: open, color: 'text-orange-500' },
            { label: 'Em Análise', value: inProgress, color: 'text-yellow-600' },
            { label: 'Respondidos', value: resolved, color: 'text-green-600' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{label}</p>
              <p className={`text-3xl font-bold ${color}`}>{value}</p>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200">
            <h2 className="text-sm font-semibold text-gray-900">Todos os Tickets</h2>
          </div>
          <SupportTableClient tickets={serialized} statusConfig={statusConfig} />
        </div>
      </div>
    </div>
  )
}
