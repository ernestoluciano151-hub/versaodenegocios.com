export const dynamic = 'force-dynamic'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCustomerSession } from '@/lib/customer-auth'
import { prisma } from '@/lib/prisma'
import { formatCurrency, formatDate } from '@/lib/utils'
import { PaymentStatusBadge } from '@/components/admin/OrderStatusBadge'
import { Badge } from '@/components/ui/badge'
import { PAYMENT_METHOD_LABELS, type PaymentStatus, type PaymentMethodType } from '@/types'
import { CreditCard, CheckCircle2, Clock } from 'lucide-react'

export default async function ContaPagamentosPage() {
  const session = await getCustomerSession()
  if (!session) redirect('/conta/login')

  const payments = await prisma.payment.findMany({
    where: { customerId: session.id },
    include: { order: { select: { id: true, status: true, items: { take: 1, select: { product: { select: { name: true } } } } } } },
    orderBy: { createdAt: 'desc' },
  })

  const totalPaid = payments.filter(p => p.paymentStatus === 'paid').reduce((s, p) => s + Number(p.amount), 0)
  const pending = payments.filter(p => ['pending', 'awaiting_delivery'].includes(p.paymentStatus))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Pagamentos</h1>
        <p className="text-gray-500 text-sm mt-1">Histórico completo dos seus pagamentos</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <CheckCircle2 className="w-5 h-5 text-green-500 mb-1" />
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalPaid)}</p>
          <p className="text-xs text-gray-500">Total Pago</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <Clock className="w-5 h-5 text-orange-500 mb-1" />
          <p className="text-2xl font-bold text-orange-600">{pending.length}</p>
          <p className="text-xs text-gray-500">Pendentes</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <CreditCard className="w-5 h-5 text-gray-400 mb-1" />
          <p className="text-2xl font-bold text-gray-900">{payments.length}</p>
          <p className="text-xs text-gray-500">Total Transacções</p>
        </div>
      </div>

      {/* Methods info */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-900 mb-3">Métodos Disponíveis</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center text-green-600 font-bold text-xs">COD</div>
            <div>
              <p className="text-sm font-medium text-gray-900">Pagamento na Entrega</p>
              <p className="text-xs text-green-600">✓ Disponível</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 opacity-60">
            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 font-bold text-xs">MX</div>
            <div>
              <p className="text-sm font-medium text-gray-900">Multicaixa Express</p>
              <p className="text-xs text-gray-400">Em breve</p>
            </div>
          </div>
        </div>
      </div>

      {/* History */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Histórico</h2>
        </div>
        {payments.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">Nenhum pagamento registado</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {payments.map((p) => (
              <div key={p.id} className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Link href={`/conta/pedidos/${p.orderId}`} className="font-mono text-xs text-orange-500 hover:underline">
                      #{p.orderId.slice(-8).toUpperCase()}
                    </Link>
                    <Badge variant="secondary" className="text-xs">
                      {PAYMENT_METHOD_LABELS[p.paymentMethod as PaymentMethodType]}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-400">{p.paymentDate ? formatDate(p.paymentDate) : formatDate(p.createdAt)}</p>
                  {p.transactionReference && <p className="text-xs text-gray-400 font-mono">Ref: {p.transactionReference}</p>}
                </div>
                <div className="flex items-center gap-3">
                  <PaymentStatusBadge status={p.paymentStatus as PaymentStatus} />
                  <span className="font-bold text-gray-900">{formatCurrency(Number(p.amount))}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
