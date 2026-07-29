'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import { CheckCircle, XCircle, Loader2, Smartphone, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'

/**
 * Página de espera do pagamento Multicaixa Express (AppyPay/EasyPay GPO).
 *
 * O cliente recebeu um push na app Multicaixa Express e tem ~90 segundos
 * para aprovar. Esta página faz polling ao estado do pagamento e reage
 * assim que o webhook da EasyPay confirmar.
 */

const APPROVAL_WINDOW_S = 90
const POLL_INTERVAL_MS = 4_000
const MAX_POLLS = 45 // ~3 minutos de margem total

function McxPaymentContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const orderId = searchParams.get('orderId') ?? ''
  const transactionRef = searchParams.get('ref') ?? ''

  const [status, setStatus] = useState<'pending' | 'paid' | 'failed' | 'timeout'>('pending')
  const [pollCount, setPollCount] = useState(0)
  const [secondsLeft, setSecondsLeft] = useState(APPROVAL_WINDOW_S)

  // Countdown visual dos 90 segundos
  useEffect(() => {
    if (status !== 'pending' || secondsLeft <= 0) return
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1_000)
    return () => clearTimeout(t)
  }, [status, secondsLeft])

  // Polling do estado do pagamento
  useEffect(() => {
    if (status !== 'pending' || !orderId) return
    if (pollCount >= MAX_POLLS) {
      setStatus('timeout')
      return
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/payments/verify?orderId=${orderId}&ref=${transactionRef}`)
        if (res.ok) {
          const data = (await res.json()) as { status?: string }
          const s = (data.status ?? '').toLowerCase()
          if (['paid', 'confirmed', 'success', 'completed'].includes(s)) {
            setStatus('paid')
            return
          }
          if (['failed', 'cancelled', 'expired'].includes(s)) {
            setStatus('failed')
            return
          }
        }
      } catch { /* continua a tentar */ }
      setPollCount((c) => c + 1)
    }, POLL_INTERVAL_MS)

    return () => clearTimeout(timer)
  }, [status, pollCount, orderId, transactionRef])

  if (!orderId) {
    return (
      <div className="max-w-lg mx-auto px-4 py-24 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <XCircle className="w-8 h-8 text-red-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Pedido não encontrado</h1>
        <Button onClick={() => router.push('/produtos')} className="mt-4">Voltar à loja</Button>
      </div>
    )
  }

  if (status === 'paid') {
    return (
      <div className="max-w-lg mx-auto px-4 py-24 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Pagamento Confirmado!</h1>
        <p className="text-gray-600 mb-6">
          O seu pedido <span className="font-medium text-gray-900">#{orderId.slice(-8).toUpperCase()}</span> foi pago com sucesso via Multicaixa Express.
        </p>
        <Button onClick={() => router.push(`/conta/pedidos/${orderId}?novo=1`)} size="lg">
          Ver Pedido
        </Button>
      </div>
    )
  }

  if (status === 'failed' || status === 'timeout') {
    return (
      <div className="max-w-lg mx-auto px-4 py-24 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <XCircle className="w-8 h-8 text-red-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {status === 'timeout' ? 'Tempo Esgotado' : 'Pagamento Não Concluído'}
        </h1>
        <p className="text-gray-600 mb-6">
          {status === 'timeout'
            ? 'Não recebemos a confirmação do pagamento. Se já aprovou na app, o estado do pedido será actualizado automaticamente em breve.'
            : 'O pagamento foi recusado, cancelado ou expirou. Pode tentar novamente.'}
        </p>
        <div className="flex gap-3 justify-center">
          <Button variant="outline" onClick={() => router.push('/checkout')}>
            Voltar ao Checkout
          </Button>
          <Button onClick={() => router.push(`/conta/pedidos/${orderId}`)}>
            Ver Pedido
          </Button>
        </div>
      </div>
    )
  }

  // pending — aguardar aprovação do push MCX Express
  const pct = Math.max(0, Math.round((secondsLeft / APPROVAL_WINDOW_S) * 100))
  return (
    <div className="max-w-lg mx-auto px-4 py-24 text-center">
      <div className="relative w-20 h-20 mx-auto mb-6">
        <div className="absolute inset-0 rounded-full bg-orange-100 animate-ping opacity-40" />
        <div className="relative w-20 h-20 rounded-full bg-orange-50 border-2 border-orange-200 flex items-center justify-center">
          <Smartphone className="w-9 h-9 text-orange-600" />
        </div>
      </div>

      <h1 className="text-2xl font-bold text-gray-900">Confirme na app Multicaixa Express</h1>
      <p className="text-gray-600 mt-2">
        Enviámos um pedido de pagamento para o seu telemóvel. Abra a app{' '}
        <strong>Multicaixa Express</strong> e aprove a transacção.
      </p>

      {secondsLeft > 0 ? (
        <div className="mt-8 max-w-xs mx-auto">
          <div className="flex items-center justify-center gap-2 text-orange-700 font-semibold">
            <Clock className="w-4 h-4" />
            <span>{secondsLeft}s para aprovar</span>
          </div>
          <div className="mt-3 h-2 rounded-full bg-gray-100 overflow-hidden">
            <div
              className="h-full bg-orange-500 rounded-full transition-all duration-1000"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      ) : (
        <div className="mt-8 flex items-center justify-center gap-2 text-gray-500">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>A verificar o estado do pagamento…</span>
        </div>
      )}

      <p className="text-xs text-gray-400 mt-10">
        Não feche esta página. Ela actualiza automaticamente assim que o pagamento for confirmado.
      </p>
    </div>
  )
}

export default function McxPaymentPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
        </div>
      }
    >
      <McxPaymentContent />
    </Suspense>
  )
}
