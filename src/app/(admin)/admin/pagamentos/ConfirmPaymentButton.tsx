'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { CheckCircle } from 'lucide-react'

export function ConfirmPaymentButton({ paymentId }: { paymentId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function confirm() {
    if (!window.confirm('Confirmar recebimento do pagamento?')) return
    setLoading(true)
    try {
      await fetch(`/api/payments/${paymentId}/confirm`, { method: 'POST' })
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button size="sm" onClick={confirm} loading={loading} className="gap-1">
      <CheckCircle className="w-3 h-3" />
      Confirmar
    </Button>
  )
}
