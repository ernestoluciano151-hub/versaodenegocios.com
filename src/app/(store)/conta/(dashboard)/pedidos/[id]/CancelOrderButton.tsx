'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { XCircle, Loader2 } from 'lucide-react'

const CANCEL_WINDOW_MS = 60 * 60 * 1000 // 1 hour

export function CancelOrderButton({ orderId, createdAt }: { orderId: string; createdAt: string }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const elapsed = Date.now() - new Date(createdAt).getTime()
  const minutesLeft = Math.max(0, Math.floor((CANCEL_WINDOW_MS - elapsed) / 60_000))

  async function handleCancel() {
    if (!confirm('Tem a certeza que quer cancelar este pedido?')) return
    setLoading(true)
    setError('')
    const res = await fetch(`/api/conta/pedidos/${orderId}/cancelar`, { method: 'POST' })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? 'Erro ao cancelar pedido.')
      setLoading(false)
      return
    }
    router.refresh()
  }

  if (elapsed > CANCEL_WINDOW_MS) return null

  return (
    <div>
      <button
        onClick={handleCancel}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2.5 border border-red-200 text-red-600 text-sm font-medium rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
        Cancelar Pedido
      </button>
      {minutesLeft > 0 && (
        <p className="text-xs text-gray-400 mt-1">Disponível por mais {minutesLeft} min</p>
      )}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}
