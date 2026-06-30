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
import { ArrowLeft, Mail, Phone, MapPin, ShoppingBag, TrendingUp } from 'lucide-react'

export default async function AdminCustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      addresses: true,
      orders: {
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: { items: true, payments: { select: { paymentStatus: true, paymentMethod: true } } },
      },
    },
  })

  if (!customer) notFound()

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TopBar
        title={customer.name}
        actions={
          <Link href="/admin/clientes">
            <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-1" /> Voltar</Button>
          </Link>
        }
      />
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Gasto', value: formatCurrency(Number(customer.totalSpent)), icon: TrendingUp },
            { label: 'Nº Pedidos', value: customer.ordersCount, icon: ShoppingBag },
            { label: 'Estado', value: customer.active ? 'Activo' : 'Bloqueado', icon: null },
            { label: 'Cliente desde', value: formatDate(customer.createdAt), icon: null },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-2 mb-1">
                {Icon && <Icon className="w-4 h-4 text-gray-400" />}
                <span className="text-xs text-gray-500">{label}</span>
              </div>
              <p className="text-xl font-bold text-gray-900">{value}</p>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Orders */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-900">Histórico de Pedidos</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-gray-100 bg-gray-50">
                    <tr>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Pedido</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Data</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Estado</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {customer.orders.map((o) => (
                      <tr key={o.id} className="hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <Link href={`/admin/pedidos/${o.id}`} className="text-orange-500 hover:underline font-mono text-xs">
                            #{o.id.slice(-8).toUpperCase()}
                          </Link>
                        </td>
                        <td className="py-3 px-4 text-xs text-gray-400">{formatDate(o.createdAt)}</td>
                        <td className="py-3 px-4"><OrderStatusBadge status={o.status as OrderStatus} /></td>
                        <td className="py-3 px-4 font-semibold">{formatCurrency(Number(o.total))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {customer.orders.length === 0 && (
                  <p className="text-center py-10 text-gray-400 text-sm">Sem pedidos</p>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Profile */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-bold text-lg">
                  {getInitials(customer.name)}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{customer.name}</p>
                  <Badge variant={customer.active ? 'success' : 'destructive'} className="text-xs">
                    {customer.active ? 'Activo' : 'Bloqueado'}
                  </Badge>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span>{customer.email}</span>
                </div>
                {customer.phone && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span>{customer.phone}</span>
                  </div>
                )}
                {customer.nif && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="text-gray-400 text-xs font-mono">NIF</span>
                    <span>{customer.nif}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Addresses */}
            {customer.addresses.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <MapPin className="w-4 h-4" /> Moradas
                </h3>
                <div className="space-y-2">
                  {customer.addresses.map((a) => (
                    <div key={a.id} className="text-sm text-gray-600 p-2 bg-gray-50 rounded-lg">
                      <p className="font-medium text-gray-800">{a.label} {a.isDefault && <Badge variant="secondary" className="text-xs ml-1">Principal</Badge>}</p>
                      <p>{a.street}</p>
                      <p>{a.city}, {a.province}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
