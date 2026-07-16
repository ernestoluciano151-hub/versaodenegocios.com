'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ORDER_STATUS_LABELS, type OrderStatus } from '@/types'
import { Loader2 } from 'lucide-react'

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

  function handleStatusChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const s = e.target.value as OrderStatus
    setStatus(s)
    setShowTracking(s === 'shipped')
  }

  async function handleSave() {
    setLoading(true)
    const body: Record<string, unknown> = { status }
    if (status === 'shipped') body.trackingNumber = tracking
    await fetch(`/api/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    setLoading(false)
    router.refresh()
  }

  const changed = status !== currentStatus || (status === 'shipped' && tracking !== (currentTrackingNumber ?? ''))

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        {loading && <Loader2 className="w-3 h-3 animate-spin text-orange-500" />}
        <select
          value={status}
          onChange={handleStatusChange}
          disabled={loading}
          className="text-sm border border-gray-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-orange-500"
        >
          {statuses.map(s => (
            <option key={s} value={s}>{ORDER_STATUS_LABELS[s]}</option>
          ))}
        </select>
        {changed && (
          <button
            onClick={handleSave}
            disabled={loading}
            className="text-xs bg-orange-500 text-white px-3 py-1 rounded-lg hover:bg-orange-600 disabled:opacity-50 transition-colors"
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
            className="text-sm border border-gray-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-orange-500 w-56"
          />
        </div>
      )}
    </div>
  )
}
