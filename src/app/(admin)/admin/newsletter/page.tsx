export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import { TopBar } from '@/components/admin/TopBar'
import { Badge } from '@/components/ui/badge'
import { Search } from 'lucide-react'
import { ExportCSVButton, RemoveButton } from './NewsletterActions'

export default async function NewsletterPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams

  const all = await prisma.newsletter.findMany({ orderBy: { createdAt: 'desc' } })

  const filtered = q
    ? all.filter(
        (s) =>
          s.email.toLowerCase().includes(q.toLowerCase()) ||
          (s.name ?? '').toLowerCase().includes(q.toLowerCase())
      )
    : all

  const total = all.length
  const active = all.filter((s) => s.active).length
  const inactive = total - active

  const serialized = filtered.map((s) => ({
    id: s.id,
    email: s.email,
    name: s.name,
    active: s.active,
    createdAt: s.createdAt.toISOString(),
  }))

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TopBar title="Newsletter" />
      <div className="flex-1 overflow-y-auto p-6 space-y-6">

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total Subscritores', value: total, color: 'text-gray-900' },
            { label: 'Activos', value: active, color: 'text-green-600' },
            { label: 'Inactivos', value: inactive, color: 'text-gray-400' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{label}</p>
              <p className={`text-3xl font-bold ${color}`}>{value}</p>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between gap-3 p-4 border-b border-gray-200">
            <form className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  name="q"
                  defaultValue={q}
                  placeholder="Pesquisar por email ou nome..."
                  className="pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 w-64"
                />
              </div>
            </form>
            <ExportCSVButton subscribers={serialized} />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Email</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Nome</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Estado</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Data</th>
                  <th className="py-3 px-4" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {serialized.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium text-gray-900">{s.email}</td>
                    <td className="py-3 px-4 text-gray-600">{s.name ?? '—'}</td>
                    <td className="py-3 px-4">
                      <Badge variant={s.active ? 'success' : 'secondary'}>
                        {s.active ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-xs text-gray-400">
                      {new Date(s.createdAt).toLocaleDateString('pt-AO', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </td>
                    <td className="py-3 px-4">
                      <RemoveButton id={s.id} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {serialized.length === 0 && (
              <div className="text-center py-10 text-gray-400 text-sm">Nenhum subscritor encontrado.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
