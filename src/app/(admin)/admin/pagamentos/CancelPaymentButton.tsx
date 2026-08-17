'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { XCircle } from 'lucide-react'

export function CancelPaymentButton({ paymentId }: { paymentId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function cancel() {
    if (!window.confirm('Cancelar esta solicitação de pagamento? O pedido associado será marcado como cancelado e o valor deixa de contar na receita.')) return
    setLoading(true)
    try {
      const res = await fetch(`/api/payments/${paymentId}/cancel`, { method: 'POST' })
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        alert(body?.error ?? 'Não foi possível cancelar o pagamento.')
        return
      }
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button size="sm" variant="destructive" onClick={cancel} loading={loading} className="gap-1">
      <XCircle className="w-3 h-3" />
      Cancelar
    </Button>
  )
}
