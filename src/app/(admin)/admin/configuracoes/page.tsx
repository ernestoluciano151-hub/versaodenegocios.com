export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import { TopBar } from '@/components/admin/TopBar'
import { Badge } from '@/components/ui/badge'
import { PAYMENT_METHOD_LABELS, type PaymentMethodType } from '@/types'
import { CreditCard, Settings } from 'lucide-react'

export default async function ConfiguracoesPage() {
  const [paymentMethods, users] = await Promise.all([
    prisma.paymentMethod.findMany({ orderBy: { createdAt: 'asc' } }),
    prisma.user.findMany({ orderBy: { createdAt: 'asc' }, select: { id: true, name: true, email: true, role: true, active: true, createdAt: true } }),
  ])

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TopBar title="Configurações" />
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Payment methods */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-orange-500" />
            <h2 className="font-semibold text-gray-900">Métodos de Pagamento</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {paymentMethods.map((pm) => (
              <div key={pm.id} className="px-5 py-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{pm.name}</p>
                  <p className="text-xs text-gray-400 font-mono">{pm.type}</p>
                </div>
                <Badge
                  variant={pm.status === 'active' ? 'success' : pm.status === 'coming_soon' ? 'warning' : 'secondary'}
                >
                  {pm.status === 'active' ? 'Activo' : pm.status === 'coming_soon' ? 'Em Breve' : 'Inactivo'}
                </Badge>
              </div>
            ))}
            {paymentMethods.length === 0 && (
              <p className="px-5 py-6 text-sm text-gray-400">Nenhum método configurado.</p>
            )}
          </div>
        </div>

        {/* Admin users */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <Settings className="w-4 h-4 text-orange-500" />
            <h2 className="font-semibold text-gray-900">Utilizadores Admin</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-100 bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Nome</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Email</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Papel</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium text-gray-900">{u.name}</td>
                    <td className="py-3 px-4 text-gray-600">{u.email}</td>
                    <td className="py-3 px-4">
                      <Badge variant="secondary" className="text-xs">{u.role}</Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={u.active ? 'success' : 'destructive'}>{u.active ? 'Activo' : 'Bloqueado'}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* System info */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Informação do Sistema</h2>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            {[
              ['Plataforma', 'VN Tech Shop'],
              ['Versão', '1.0.0'],
              ['Framework', 'Next.js 14 (App Router)'],
              ['Base de Dados', 'PostgreSQL (Prisma ORM)'],
              ['Moeda', 'Kwanza Angolano (AOA)'],
              ['Idioma', 'Português (Angola)'],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="text-xs text-gray-400">{k}</dt>
                <dd className="font-medium text-gray-800">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  )
}
