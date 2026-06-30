export const dynamic = 'force-dynamic'
import { Suspense } from 'react'
import { TopBar } from '@/components/admin/TopBar'
import { prisma } from '@/lib/prisma'
import { formatCurrency, formatDate } from '@/lib/utils'
import { PaymentStatusBadge } from '@/components/admin/OrderStatusBadge'
import { Badge } from '@/components/ui/badge'
import { PAYMENT_METHOD_LABELS, type PaymentStatus, type PaymentMethodType } from '@/types'
import { ConfirmPaymentButton } from './ConfirmPaymentButton'

async function getPayments(status?: string) {
  return prisma.payment.findMany({
    where: status ? { paymentStatus: status as PaymentStatus } : undefined,
    include: {
      order: { select: { id: true, status: true, guestName: true } },
      customer: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })
}

const statusOptions = [
  { value: '', label: 'Todos' },
  { value: 'pending', label: 'Pendentes' },
  { value: 'awaiting_delivery', label: 'Aguardando Entrega' },
  { value: 'paid', label: 'Pagos' },
  { value: 'failed', label: 'Falhados' },
  { value: 'refunded', label: 'Reembolsados' },
]

import Link from 'next/link'

async function PaymentsTable({ status }: { status?: string }) {
  const payments = await getPayments(status)

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="border-b border-gray-200 bg-gray-50">
          <tr>
            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Ref.</th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Pedido</th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Cliente</th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Método</th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Valor</th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Estado</th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Data</th>
            <th className="py-3 px-4" />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {payments.map((payment) => (
            <tr key={payment.id} className="hover:bg-gray-50">
              <td className="py-3 px-4 font-mono text-xs text-gray-500">
                {payment.transactionReference?.slice(0, 20) ?? '—'}
              </td>
              <td className="py-3 px-4">
                <Link href={`/admin/pedidos/${payment.orderId}`} className="text-orange-500 hover:underline font-mono text-xs">
                  #{payment.orderId.slice(-8).toUpperCase()}
                </Link>
              </td>
              <td className="py-3 px-4">
                <p className="font-medium">{payment.customer?.name ?? payment.order.guestName ?? 'Convidado'}</p>
                <p className="text-xs text-gray-400">{payment.customer?.email}</p>
              </td>
              <td className="py-3 px-4">
                <Badge variant="secondary">
                  {PAYMENT_METHOD_LABELS[payment.paymentMethod as PaymentMethodType]}
                </Badge>
              </td>
              <td className="py-3 px-4 font-bold text-gray-900">
                {formatCurrency(Number(payment.amount))} {payment.currency}
              </td>
              <td className="py-3 px-4">
                <PaymentStatusBadge status={payment.paymentStatus as PaymentStatus} />
              </td>
              <td className="py-3 px-4 text-xs text-gray-400">
                {payment.paymentDate ? formatDate(payment.paymentDate) : formatDate(payment.createdAt)}
              </td>
              <td className="py-3 px-4">
                {(payment.paymentStatus === 'pending' || payment.paymentStatus === 'awaiting_delivery') && (
                  <ConfirmPaymentButton paymentId={payment.id} />
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {payments.length === 0 && (
        <div className="text-center py-12 text-gray-500">Nenhum pagamento encontrado.</div>
      )}
    </div>
  )
}

export default async function PagamentosPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TopBar title="Pagamentos" />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="flex flex-wrap gap-2 p-4 border-b border-gray-200">
            {statusOptions.map((opt) => (
              <Link
                key={opt.value}
                href={`/admin/pagamentos${opt.value ? `?status=${opt.value}` : ''}`}
                className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${status === opt.value || (!status && !opt.value) ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                {opt.label}
              </Link>
            ))}
          </div>

          <Suspense fallback={<div className="p-8 text-center text-gray-500">A carregar...</div>}>
            <PaymentsTable status={status} />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
