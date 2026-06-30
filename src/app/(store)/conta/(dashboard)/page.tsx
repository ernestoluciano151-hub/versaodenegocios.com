export const dynamic = 'force-dynamic'
import Link from 'next/link'
import Image from 'next/image'
import { redirect } from 'next/navigation'
import { getCustomerSession } from '@/lib/customer-auth'
import { prisma } from '@/lib/prisma'
import { formatCurrency, formatDate, getInitials } from '@/lib/utils'
import { OrderStatusBadge } from '@/components/admin/OrderStatusBadge'
import { Badge } from '@/components/ui/badge'
import { type OrderStatus } from '@/types'
import { ShoppingBag, Heart, MapPin, TrendingUp, Package, Bell, ChevronRight, Star } from 'lucide-react'

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
      notifications: { where: { read: false }, take: 1 },
      _count: { select: { orders: true, wishlists: true, notifications: true, addresses: true } },
    },
  })

  if (!customer) redirect('/conta/login')

  const inProgress = customer.orders.filter(o => !['delivered', 'cancelled', 'returned'].includes(o.status))
  const unreadCount = await prisma.notification.count({ where: { customerId: session.id, read: false } })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Olá, {customer.name.split(' ')[0]} 👋</h1>
        <p className="text-gray-500 text-sm mt-1">Bem-vindo à sua área pessoal</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total de Pedidos', value: customer._count.orders, icon: ShoppingBag, href: '/conta/pedidos' },
          { label: 'Total Gasto', value: formatCurrency(Number(customer.totalSpent)), icon: TrendingUp, href: '/conta/pagamentos' },
          { label: 'Favoritos', value: customer._count.wishlists, icon: Heart, href: '/conta/favoritos' },
          { label: 'Notificações', value: unreadCount, icon: Bell, href: '/conta/notificacoes', alert: unreadCount > 0 },
        ].map(({ label, value, icon: Icon, href, alert }) => (
          <Link key={label} href={href} className="bg-white rounded-xl border border-gray-200 p-4 hover:border-orange-300 transition-colors group">
            <div className="flex items-center gap-2 mb-2">
              <Icon className={`w-4 h-4 ${alert ? 'text-orange-500' : 'text-gray-400'}`} />
              <span className="text-xs text-gray-500">{label}</span>
            </div>
            <p className={`text-xl font-bold ${alert ? 'text-orange-600' : 'text-gray-900'}`}>{value}</p>
          </Link>
        ))}
      </div>

      {/* Loyalty points placeholder */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-5 text-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Star className="w-4 h-4" />
              <span className="text-sm font-medium opacity-90">Pontos de Fidelização</span>
            </div>
            <p className="text-3xl font-bold">{Math.floor(Number(customer.totalSpent) / 1000)}</p>
            <p className="text-xs opacity-75 mt-1">1 ponto por cada 1.000 AOA gastos</p>
          </div>
          <div className="text-right">
            <p className="text-xs opacity-75">Nível</p>
            <p className="text-lg font-bold">
              {Number(customer.totalSpent) >= 500000 ? '🥇 Gold' : Number(customer.totalSpent) >= 100000 ? '🥈 Silver' : '🥉 Bronze'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* In progress orders */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2"><Package className="w-4 h-4 text-orange-500" /> Em Andamento</h2>
            <Link href="/conta/pedidos" className="text-xs text-orange-500 hover:underline flex items-center gap-1">Ver todos <ChevronRight className="w-3 h-3" /></Link>
          </div>
          {inProgress.length === 0 ? (
            <p className="px-5 py-8 text-sm text-gray-400 text-center">Nenhum pedido em andamento</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {inProgress.map((o) => (
                <li key={o.id}>
                  <Link href={`/conta/pedidos/${o.id}`} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50">
                    <div>
                      <p className="text-sm font-medium text-gray-900">#{o.id.slice(-8).toUpperCase()}</p>
                      <p className="text-xs text-gray-400">{formatDate(o.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <OrderStatusBadge status={o.status as OrderStatus} />
                      <span className="font-semibold text-sm">{formatCurrency(Number(o.total))}</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Recent orders */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2"><ShoppingBag className="w-4 h-4 text-orange-500" /> Últimos Pedidos</h2>
            <Link href="/conta/pedidos" className="text-xs text-orange-500 hover:underline flex items-center gap-1">Ver todos <ChevronRight className="w-3 h-3" /></Link>
          </div>
          {customer.orders.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <ShoppingBag className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400">Ainda não fez nenhuma compra</p>
              <Link href="/produtos" className="text-orange-500 text-sm hover:underline mt-1 inline-block">Explorar produtos</Link>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {customer.orders.map((o) => (
                <li key={o.id}>
                  <Link href={`/conta/pedidos/${o.id}`} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50">
                    <div>
                      <p className="text-sm font-medium text-gray-900">#{o.id.slice(-8).toUpperCase()}</p>
                      <p className="text-xs text-gray-400">{formatDate(o.createdAt)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-sm">{formatCurrency(Number(o.total))}</p>
                      <OrderStatusBadge status={o.status as OrderStatus} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Wishlist preview */}
      {customer.wishlists.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2"><Heart className="w-4 h-4 text-orange-500" /> Favoritos</h2>
            <Link href="/conta/favoritos" className="text-xs text-orange-500 hover:underline flex items-center gap-1">Ver todos <ChevronRight className="w-3 h-3" /></Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4">
            {customer.wishlists.map(({ product: p }) => (
              <Link key={p.id} href={`/produtos/${p.slug}`} className="group">
                <div className="aspect-square bg-gray-50 rounded-xl overflow-hidden border border-gray-200 group-hover:border-orange-300 transition-colors mb-2">
                  {p.images[0] ? (
                    <Image src={p.images[0]} alt={p.name} width={200} height={200} className="w-full h-full object-contain p-2" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">Sem imagem</div>
                  )}
                </div>
                <p className="text-xs font-medium text-gray-800 truncate">{p.name}</p>
                <p className="text-sm font-bold text-orange-500">{formatCurrency(Number(p.salePrice ?? p.price))}</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Default address */}
      {customer.addresses[0] && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2"><MapPin className="w-4 h-4 text-orange-500" /> Endereço Principal</h2>
            <Link href="/conta/enderecos" className="text-xs text-orange-500 hover:underline">Gerir endereços</Link>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600">
            <p className="font-medium">{customer.addresses[0].label}</p>
            <p>{customer.addresses[0].street}</p>
            <p>{customer.addresses[0].district && `${customer.addresses[0].district}, `}{customer.addresses[0].municipality ?? customer.addresses[0].city}, {customer.addresses[0].province}</p>
          </div>
        </div>
      )}
    </div>
  )
}
