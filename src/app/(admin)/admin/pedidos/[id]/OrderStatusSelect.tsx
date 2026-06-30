'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ORDER_STATUS_LABELS, type OrderStatus } from '@/types'
import { Loader2 } from 'lucide-react'

const statuses: OrderStatus[] = [
  'awaiting_confirmation', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned',
]

export function OrderStatusSelect({ orderId, currentStatus }: { orderId: string; currentStatus: OrderStatus }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const status = e.target.value as OrderStatus
    setLoading(true)
    await fetch(`/api/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    setLoading(false)
    router.refresh()
  }

  return (
    <div className="flex items-center gap-2">
      {loading && <Loader2 className="w-3 h-3 animate-spin text-orange-500" />}
      <select
        defaultValue={currentStatus}
        onChange={handleChange}
        disabled={loading}
        className="text-sm border border-gray-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-orange-500"
      >
        {statuses.map(s => (
          <option key={s} value={s}>{ORDER_STATUS_LABELS[s]}</option>
        ))}
      </select>
    </div>
  )
}
