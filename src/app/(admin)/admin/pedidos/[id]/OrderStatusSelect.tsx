'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ORDER_STATUS_LABELS, type OrderStatus } from '@/types'
import { Loader2, AlertTriangle } from 'lucide-react'

const statuses: OrderStatus[] = [
  'awaiting_confirmation', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned',
]

export function OrderStatusSelect({
  orderId,
  currentStatus,
  currentTrackingNumber,
}: {
  orderId: string
  currentStatus: OrderStatus
  currentTrackingNumber?: string | null
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<OrderStatus>(currentStatus)
  const [tracking, setTracking] = useState(currentTrackingNumber ?? '')
  const [showTracking, setShowTracking] = useState(currentStatus === 'shipped')
  const [error, setError] = useState<string | null>(null)

  // Ressincronizar com o estado real vindo do servidor sempre que a prop
  // muda (ex.: depois de um router.refresh() bem sucedido, ou se outra
  // pessoa/aba alterou o pedido entretanto). Ajuste feito durante o render
  // — não num efeito — seguindo o padrão recomendado pelo React para
  // "resetar estado quando uma prop muda", sem risco de cascata de renders.
  const [prevStatus, setPrevStatus] = useState(currentStatus)
  const [prevTracking, setPrevTracking] = useState(currentTrackingNumber ?? '')
  if (currentStatus !== prevStatus || (currentTrackingNumber ?? '') !== prevTracking) {
    setPrevStatus(currentStatus)
    setPrevTracking(currentTrackingNumber ?? '')
    setStatus(currentStatus)
    setTracking(currentTrackingNumber ?? '')
    setShowTracking(currentStatus === 'shipped')
  }

  function handleStatusChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const s = e.target.value as OrderStatus
    setStatus(s)
    setShowTracking(s === 'shipped')
    setError(null)
  }

  async function handleSave() {
    setLoading(true)
    setError(null)
    const body: Record<string, unknown> = { status }
    if (status === 'shipped') body.trackingNumber = tracking
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        setError(data?.error || 'Não foi possível guardar o estado. Tente novamente.')
        setStatus(currentStatus) // reverter para o estado real — não deixar o UI mentir
        return
      }
      router.refresh()
    } catch {
      setError('Falha de rede ao guardar o estado. Verifique a ligação e tente novamente.')
      setStatus(currentStatus)
    } finally {
      setLoading(false)
    }
  }

  const changed = status !== currentStatus || (status === 'shipped' && tracking !== (currentTrackingNumber ?? ''))

  return (
    <div className="flex flex-col gap-2 w-full sm:w-auto">
      <div className="flex flex-wrap items-center gap-2">
        {loading && <Loader2 className="w-3 h-3 animate-spin text-orange-500 flex-shrink-0" />}
        <select
          value={status}
          onChange={handleStatusChange}
          disabled={loading}
          className="text-sm border border-gray-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-orange-500 w-full sm:w-auto min-w-0"
        >
          {statuses.map(s => (
            <option key={s} value={s}>{ORDER_STATUS_LABELS[s]}</option>
          ))}
        </select>
        {changed && (
          <button
            onClick={handleSave}
            disabled={loading}
            className="text-xs bg-orange-500 text-white px-3 py-1.5 rounded-lg hover:bg-orange-600 disabled:opacity-50 transition-colors flex-shrink-0"
          >
            Guardar
          </button>
        )}
      </div>
      {showTracking && (
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={tracking}
            onChange={e => setTracking(e.target.value)}
            placeholder="Número de rastreio (opcional)"
            className="text-sm border border-gray-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-orange-500 w-full sm:w-56"
          />
        </div>
      )}
      {error && (
        <p className="flex items-center gap-1.5 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-2 py-1.5">
          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
          {error}
        </p>
      )}
    </div>
  )
}
