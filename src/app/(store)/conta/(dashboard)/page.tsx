export const dynamic = 'force-dynamic'
import Link from 'next/link'
import Image from 'next/image'
import { redirect } from 'next/navigation'
import { getCustomerSession } from '@/lib/customer-auth'
import { prisma } from '@/lib/prisma'
import { formatCurrency, formatDate, getInitials } from '@/lib/utils'
import { OrderStatusBadge } from '@/components/admin/OrderStatusBadge'
import { type OrderStatus } from '@/types'
import {
  ShoppingBag, Heart, MapPin, TrendingUp, Package, Bell, ChevronRight,
  Star, ArrowUpRight, Clock, CheckCircle2, Truck,
} from 'lucide-react'

export default async function ContaDashboardPage() {
  const session = await getCustomerSession()
  if (!session) redirect('/conta/login')

  const customer = await prisma.customer.findUnique({
    where: { id: session.id },
    include: {
      orders: {
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { payments: { select: { paymentMethod: true, paymentStatus: true } } },
      },
      wishlists: {
        take: 4,
        include: { product: { select: { id: true, name: true, images: true, price: true, salePrice: true, slug: true, stock: true } } },
        orderBy: { createdAt: 'desc' },
      },
      addresses: { where: { isDefault: true }, take: 1 },
      _count: { select: { orders: true, wishlists: true, notifications: true, addresses: true } },
    },
  })

  if (!customer) redirect('/conta/login')

  const [unreadCount, customOrdersCount] = await Promise.all([
    prisma.notification.count({ where: { customerId: session.id, read: false } }),
    prisma.customOrder.count({ where: { customerId: session.id, deletedAt: null, status: { notIn: ['delivered', 'cancelled', 'rejected'] } } }).catch(() => 0),
  ])

  const inProgress = customer.orders.filter(o => !['delivered', 'cancelled', 'returned'].includes(o.status))
  const totalSpent = Number(customer.totalSpent ?? 0)

  // Loyalty level
  const loyaltyLevel = totalSpent >= 500_000 ? { label: 'Gold', icon: '🥇', next: null, nextAt: null }
    : totalSpent >= 100_000 ? { label: 'Silver', icon: '🥈', next: 'Gold', nextAt: 500_000 }
    : { label: 'Bronze', icon: '🥉', next: 'Silver', nextAt: 100_000 }

  const loyaltyProgress = loyaltyLevel.nextAt
    ? Math.min(100, Math.round((totalSpent / loyaltyLevel.nextAt) * 100))
    : 100

  const loyaltyPoints = Math.floor(totalSpent / 1_000)

  function statusIcon(status: string) {
    if (status === 'delivered') return <CheckCircle2 className="w-4 h-4 text-emerald-500" />
    if (status === 'shipped') return <Truck className="w-4 h-4 text-blue-500" />
    return <Clock className="w-4 h-4 text-orange-400" />
  }

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="relative bg-gradient-to-br from-orange-500 via-orange-500 to-amber-500 rounded-2xl p-6 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 80% 50%, white 0%, transparent 60%)' }} />
        <div className="relative flex items-center justify-between gap-4">
          <div>
            <p className="text-orange-100 text-sm font-medium mb-1">Bem-vindo de volta 👋</p>
            <h1 className="text-2xl font-bold">{customer.name.split(' ')[0]}</h1>
            <p className="text-orange-200 text-sm mt-1">{customer.email}</p>
          </div>
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-2xl font-bold flex-shrink-0">
            {customer.image
              ? <img src={customer.image} alt={customer.name} className="w-14 h-14 rounded-2xl object-cover" />
              : getInitials(customer.name)
            }
          </div>
        </div>

        {/* Loyalty progress */}
        <div className="relative mt-5 pt-5 border-t border-white/20">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">{loyaltyLevel.icon}</span>
              <span className="text-sm font-semibold">{loyaltyLevel.label}</span>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold">{loyaltyPoints.toLocaleString('pt-AO')}</p>
              <p className="text-xs text-orange-200">pontos</p>
            </div>
          </div>
          {loyaltyLevel.next && (
            <>
              <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
                <div className="h-full bg-white rounded-full transition-all" style={{ width: `${loyaltyProgress}%` }} />
              </div>
              <p className="text-xs text-orange-200 mt-1.5">
                {formatCurrency(loyaltyLevel.nextAt! - totalSpent)} para {loyaltyLevel.next}
              </p>
            </>
          )}
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Gasto', value: formatCurrency(totalSpent), icon: TrendingUp, href: '/conta/pagamentos', accent: false },
          { label: 'Pedidos', value: customer._count.orders, icon: ShoppingBag, href: '/conta/pedidos', accent: false },
          { label: 'Favoritos', value: customer._count.wishlists, icon: Heart, href: '/conta/favoritos', accent: false },
          { label: 'Notificações', value: unreadCount, icon: Bell, href: '/conta/notificacoes', accent: unreadCount > 0 },
        ].map(({ label, value, icon: Icon, href, accent }) => (
          <Link
            key={label}
            href={href}
            className={`group relative bg-white rounded-xl border p-4 hover:shadow-sm transition-all ${accent ? 'border-orange-300 bg-orange-50' : 'border-gray-200 hover:border-gray-300'}`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${accent ? 'bg-orange-500' : 'bg-gray-100'}`}>
                <Icon className={`w-4 h-4 ${accent ? 'text-white' : 'text-gray-500'}`} />
              </div>
              <ArrowUpRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-400 transition-colors" />
            </div>
            <p className={`text-xl font-bold ${accent ? 'text-orange-600' : 'text-gray-900'}`}>{value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{label}</p>
          </Link>
        ))}
      </div>

      {/* Quick links */}
      {(inProgress.length > 0 || customOrdersCount > 0) && (
        <div className="flex flex-wrap gap-2">
          {inProgress.length > 0 && (
            <Link href="/conta/pedidos" className="flex items-center gap-2 px-3.5 py-2 bg-blue-50 border border-blue-200 text-blue-700 text-sm font-medium rounded-lg hover:bg-blue-100 transition-colors">
              <Package className="w-4 h-4" />
              {inProgress.length} pedido{inProgress.length !== 1 ? 's' : ''} em andamento
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          )}
          {customOrdersCount > 0 && (
            <Link href="/conta/encomendas-personalizadas" className="flex items-center gap-2 px-3.5 py-2 bg-purple-50 border border-purple-200 text-purple-700 text-sm font-medium rounded-lg hover:bg-purple-100 transition-colors">
              <Clock className="w-4 h-4" />
              {customOrdersCount} encomenda{customOrdersCount !== 1 ? 's' : ''} custom em curso
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Recent orders */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2 text-sm">
              <ShoppingBag className="w-4 h-4 text-orange-500" /> Últimos Pedidos
            </h2>
            <Link href="/conta/pedidos" className="text-xs text-orange-500 hover:underline flex items-center gap-0.5">
              Ver todos <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          {customer.orders.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <ShoppingBag className="w-10 h-10 text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400">Ainda não fez nenhuma compra</p>
              <Link href="/produtos" className="text-orange-500 text-sm hover:underline mt-1.5 inline-block">
                Explorar produtos
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-gray-50">
              {customer.orders.map((o) => (
                <li key={o.id}>
                  <Link href={`/conta/pedidos/${o.id}`} className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-2.5">
                      {statusIcon(o.status)}
                      <div>
                        <p className="text-sm font-medium text-gray-900">#{o.id.slice(-8).toUpperCase()}</p>
                        <p className="text-xs text-gray-400">{formatDate(o.createdAt)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-sm text-gray-900">{formatCurrency(Number(o.total))}</p>
                      <OrderStatusBadge status={o.status as OrderStatus} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Wishlist preview */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2 text-sm">
              <Heart className="w-4 h-4 text-orange-500" /> Favoritos
            </h2>
            <Link href="/conta/favoritos" className="text-xs text-orange-500 hover:underline flex items-center gap-0.5">
              Ver todos <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          {customer.wishlists.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <Heart className="w-10 h-10 text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400">Nenhum favorito guardado</p>
              <Link href="/produtos" className="text-orange-500 text-sm hover:underline mt-1.5 inline-block">
                Descobrir produtos
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 p-4">
              {customer.wishlists.map(({ product: p }) => (
                <Link key={p.id} href={`/produtos/${p.slug}`} className="group">
                  <div className="aspect-square bg-gray-50 rounded-xl overflow-hidden border border-gray-100 group-hover:border-orange-200 transition-colors mb-1.5">
                    {p.images[0] ? (
                      <Image src={p.images[0]} alt={p.name} width={200} height={200} className="w-full h-full object-contain p-2" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-200">
                        <Package className="w-8 h-8" />
                      </div>
                    )}
                  </div>
                  <p className="text-xs font-medium text-gray-800 truncate">{p.name}</p>
                  <p className="text-sm font-bold text-orange-500">{formatCurrency(Number(p.salePrice ?? p.price))}</p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Default address */}
      {customer.addresses[0] && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4 text-orange-500" /> Endereço Principal
            </h2>
            <Link href="/conta/enderecos" className="text-xs text-orange-500 hover:underline">
              Gerir endereços
            </Link>
          </div>
          <div className="bg-gray-50 rounded-xl p-3.5 text-sm text-gray-600 border border-gray-100">
            <p className="font-semibold text-gray-800">{customer.addresses[0].label}</p>
            <p className="mt-0.5">{customer.addresses[0].street}</p>
            <p>{customer.addresses[0].district && `${customer.addresses[0].district}, `}{customer.addresses[0].municipality ?? customer.addresses[0].city}, {customer.addresses[0].province}</p>
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { href: '/conta/encomendas-personalizadas', icon: Package, label: 'Encomenda Custom', color: 'bg-purple-50 text-purple-600 border-purple-100' },
          { href: '/conta/afiliado', icon: Star, label: 'Programa Afiliado', color: 'bg-amber-50 text-amber-600 border-amber-100' },
          { href: '/conta/suporte', icon: Bell, label: 'Suporte', color: 'bg-blue-50 text-blue-600 border-blue-100' },
          { href: '/conta/perfil', icon: TrendingUp, label: 'Editar Perfil', color: 'bg-gray-50 text-gray-600 border-gray-100' },
        ].map(({ href, icon: Icon, label, color }) => (
          <Link key={href} href={href} className={`flex flex-col items-center gap-2 p-4 rounded-xl border text-center hover:shadow-sm transition-all ${color}`}>
            <Icon className="w-5 h-5" />
            <span className="text-xs font-semibold">{label}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
