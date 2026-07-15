export const dynamic = 'force-dynamic'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { TopBar } from '@/components/admin/TopBar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDate, getInitials } from '@/lib/utils'
import { OrderStatusBadge } from '@/components/admin/OrderStatusBadge'
import { type OrderStatus } from '@/types'
import {
  ArrowLeft, Mail, Phone, MapPin, ShoppingBag, TrendingUp,
  Star, HelpCircle, Globe, Smartphone, Shield, AlertTriangle,
} from 'lucide-react'
import { AdminCustomerActions } from './AdminCustomerActions'
import { CustomerNotes } from './CustomerNotes'

function RiskBar({ score }: { score?: number | null }) {
  if (score == null) return <span className="text-sm text-gray-400">Sem dados</span>
  const color = score <= 33 ? 'bg-green-500' : score <= 66 ? 'bg-yellow-500' : 'bg-red-500'
  const label = score <= 33 ? 'Baixo' : score <= 66 ? 'Médio' : 'Alto'
  const textColor = score <= 33 ? 'text-green-700' : score <= 66 ? 'text-yellow-700' : 'text-red-700'
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className={`font-semibold ${textColor}`}>{label} ({score}/100)</span>
      </div>
      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${score}%` }} />
      </div>
    </div>
  )
}

export default async function AdminCustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      orders: {
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          items: { include: { product: { select: { name: true } } } },
        },
      },
      addresses: true,
      supportTickets: { orderBy: { createdAt: 'desc' }, take: 3 },
      loyaltyAccount: true,
      affiliateProfile: { select: { code: true, status: true, totalEarned: true } },
      _count: { select: { orders: true, wishlists: true } },
    },
  })

  if (!customer) notFound()

  const c = customer as typeof customer & {
    country?: string | null
    riskScore?: number | null
    fraudScore?: number | null
    source?: string | null
    devices?: string[] | null
    suspendedAt?: Date | null
    bannedAt?: Date | null
    loginBlockedUntil?: Date | null
    deletedAt?: Date | null
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TopBar
        title={c.name}
        actions={
          <Link href="/admin/clientes">
            <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-1" /> Voltar</Button>
          </Link>
        }
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Top stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Gasto', value: formatCurrency(Number(c.totalSpent)), icon: TrendingUp, color: 'text-green-600 bg-green-50' },
            { label: 'Nº Pedidos', value: c._count.orders, icon: ShoppingBag, color: 'text-blue-600 bg-blue-50' },
            { label: 'Wishlists', value: c._count.wishlists, icon: Star, color: 'text-yellow-600 bg-yellow-50' },
            { label: 'Tickets Suporte', value: c.supportTickets.length, icon: HelpCircle, color: 'text-purple-600 bg-purple-50' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-2 ${color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <p className="text-xl font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-500">{label}</p>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left column */}
          <div className="space-y-4">
            {/* Profile card */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-14 h-14 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-bold text-xl">
                  {getInitials(c.name)}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-lg">{c.name}</p>
                  <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                    {c.bannedAt && <Badge variant="destructive" className="text-xs">Banido</Badge>}
                    {!c.bannedAt && c.suspendedAt && <Badge className="text-xs bg-yellow-100 text-yellow-700 border-yellow-200">Suspenso</Badge>}
                    {!c.bannedAt && !c.suspendedAt && c.active && <Badge className="text-xs bg-green-100 text-green-700 border-green-200">Activo</Badge>}
                    {!c.bannedAt && !c.suspendedAt && !c.active && <Badge variant="secondary" className="text-xs">Inactivo</Badge>}
                    {c.loginBlockedUntil && <Badge className="text-xs bg-orange-100 text-orange-700 border-orange-200">Login Bloqueado</Badge>}
                    {c.deletedAt && <Badge variant="secondary" className="text-xs">Eliminado</Badge>}
                  </div>
                </div>
              </div>

              <div className="space-y-2.5">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="break-all">{c.email}</span>
                </div>
                {c.phone && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span>{c.phone}</span>
                  </div>
                )}
                {c.country && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Globe className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span>{c.country}</span>
                  </div>
                )}
                {c.nif && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="text-gray-400 text-xs font-mono w-4">NIF</span>
                    <span>{c.nif}</span>
                  </div>
                )}
                {c.source && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Smartphone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span>Origem: {c.source}</span>
                  </div>
                )}
                <div className="text-xs text-gray-400">
                  Cliente desde {formatDate(c.createdAt)}
                </div>
              </div>
            </div>

            {/* Risk scores */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <Shield className="w-4 h-4" /> Scores de Risco
              </h3>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1.5">Risco Geral</p>
                  <RiskBar score={c.riskScore} />
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1.5 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Score de Fraude
                  </p>
                  <RiskBar score={c.fraudScore} />
                </div>
              </div>
            </div>

            {/* Affiliate */}
            {c.affiliateProfile && (
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Programa Afiliado</h3>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Código</span>
                    <span className="font-mono font-semibold text-gray-900">{c.affiliateProfile.code}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Estado</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      c.affiliateProfile.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>{c.affiliateProfile.status}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Total ganho</span>
                    <span className="font-bold text-gray-900">{formatCurrency(Number(c.affiliateProfile.totalEarned))}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Admin actions */}
            <AdminCustomerActions
              customerId={c.id}
              email={c.email}
              isSuspended={!!c.suspendedAt}
              isBanned={!!c.bannedAt}
              isLoginBlocked={!!(c as { loginBlockedUntil?: Date | null }).loginBlockedUntil}
            />
          </div>

          {/* Right column — tabs */}
          <div className="lg:col-span-2 space-y-4">
            {/* Recent orders */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-gray-400" /> Últimos Pedidos
                </h2>
                <span className="text-xs text-gray-400">{c._count.orders} no total</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-gray-100 bg-gray-50">
                    <tr>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Pedido</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Produtos</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Data</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Estado</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {c.orders.map((o) => (
                      <tr key={o.id} className="hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <Link href={`/admin/pedidos/${o.id}`} className="text-orange-500 hover:underline font-mono text-xs">
                            #{o.id.slice(-8).toUpperCase()}
                          </Link>
                        </td>
                        <td className="py-3 px-4 text-xs text-gray-500">
                          {o.items.slice(0, 2).map(i => i.product?.name ?? '—').join(', ')}
                          {o.items.length > 2 && ` +${o.items.length - 2}`}
                        </td>
                        <td className="py-3 px-4 text-xs text-gray-400">{formatDate(o.createdAt)}</td>
                        <td className="py-3 px-4"><OrderStatusBadge status={o.status as OrderStatus} /></td>
                        <td className="py-3 px-4 font-semibold">{formatCurrency(Number(o.total))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {c.orders.length === 0 && (
                  <p className="text-center py-10 text-gray-400 text-sm">Sem pedidos</p>
                )}
              </div>
            </div>

            {/* Addresses */}
            {c.addresses.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-400" /> Moradas
                </h2>
                <div className="grid sm:grid-cols-2 gap-3">
                  {c.addresses.map((a) => (
                    <div key={a.id} className="text-sm text-gray-600 p-3 bg-gray-50 rounded-lg border border-gray-100">
                      <p className="font-medium text-gray-800 mb-1">
                        {a.label}
                        {a.isDefault && <Badge variant="secondary" className="text-xs ml-2">Principal</Badge>}
                      </p>
                      <p>{a.street}</p>
                      <p>{a.city}, {a.province}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Support tickets */}
            {c.supportTickets.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100">
                  <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-gray-400" /> Tickets de Suporte
                  </h2>
                </div>
                <div className="divide-y divide-gray-100">
                  {c.supportTickets.map((t) => (
                    <div key={t.id} className="px-5 py-3 flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{(t as { subject?: string }).subject ?? `Ticket #${t.id.slice(-6)}`}</p>
                        <p className="text-xs text-gray-400">{formatDate(t.createdAt)}</p>
                      </div>
                      <Badge variant="secondary" className="text-xs flex-shrink-0">{(t as { status?: string }).status ?? 'open'}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Loyalty */}
            {c.loyaltyAccount && (
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-400" /> Fidelização
                </h2>
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div className="bg-yellow-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-500">Pontos</p>
                    <p className="text-xl font-bold text-yellow-700">
                      {(c.loyaltyAccount as { points?: number }).points ?? 0}
                    </p>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-500">Nível</p>
                    <p className="text-sm font-bold text-orange-700">
                      {(c.loyaltyAccount as { tier?: string }).tier ?? '—'}
                    </p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-500">Total Ganho</p>
                    <p className="text-sm font-bold text-green-700">
                      {(c.loyaltyAccount as { totalPointsEarned?: number }).totalPointsEarned ?? 0}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Internal notes */}
            <CustomerNotes customerId={c.id} />
          </div>
        </div>
      </div>
    </div>
  )
}
