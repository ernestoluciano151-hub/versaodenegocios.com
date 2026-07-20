'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import { CheckCircle, XCircle, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

function EmisPaymentContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const orderId = searchParams.get('orderId') ?? ''
  const transactionRef = searchParams.get('ref') ?? ''
  const iframeUrl = searchParams.get('url') ?? ''

  const [status, setStatus] = useState<'loading' | 'pending' | 'paid' | 'failed'>('loading')
  const [pollCount, setPollCount] = useState(0)

  // Validar parâmetros
  useEffect(() => {
    if (!orderId || !iframeUrl) {
      setStatus('failed')
      return
    }
    setStatus('pending')
  }, [orderId, iframeUrl])

  // Polling — verificar estado do pagamento a cada 5 segundos (máx. 24 tentativas = 2 min)
  useEffect(() => {
    if (status !== 'pending' || !orderId) return
    if (pollCount >= 24) return // timeout

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/payments/verify?orderId=${orderId}&ref=${transactionRef}`)
        if (res.ok) {
          const data = (await res.json()) as { status?: string; paymentStatus?: string }
          const payStatus = (data.status ?? data.paymentStatus ?? '').toLowerCase()
          if (['paid', 'confirmed', 'success', 'completed'].includes(payStatus)) {
            setStatus('paid')
            return
          }
          if (['failed', 'cancelled', 'expired'].includes(payStatus)) {
            setStatus('failed')
            return
          }
        }
      } catch { /* continua a tentar */ }
      setPollCount((c) => c + 1)
    }, 5_000)

    return () => clearTimeout(timer)
  }, [status, pollCount, orderId, transactionRef])

  // Listener para mensagens do iFrame da EMIS
  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      // Aceitar mensagens do domínio EMIS
      if (!event.origin.includes('emis.co.ao') && !event.origin.includes('pagamentonline')) return
      const data = event.data as Record<string, unknown>
      const msgStatus = (data.status ?? data.paymentStatus ?? data.type ?? '') as string
      if (['PAID', 'SUCCESS', 'CONFIRMED', 'COMPLETED'].includes(msgStatus.toUpperCase())) {
        setStatus('paid')
      } else if (['FAILED', 'CANCELLED', 'EXPIRED', 'ERROR'].includes(msgStatus.toUpperCase())) {
        setStatus('failed')
      }
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
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
          O seu pedido <span className="font-medium text-gray-900">#{orderId.slice(-8).toUpperCase()}</span> foi pago com sucesso.
        </p>
        <Button onClick={() => router.push(`/conta/pedidos/${orderId}?novo=1`)} size="lg">
          Ver Pedido
        </Button>
      </div>
    )
  }

  if (status === 'failed') {
    return (
      <div className="max-w-lg mx-auto px-4 py-24 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <XCircle className="w-8 h-8 text-red-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Pagamento Não Concluído</h1>
        <p className="text-gray-600 mb-6">
          {!iframeUrl
            ? 'Link de pagamento inválido. Por favor volte ao checkout.'
            : 'O pagamento foi cancelado ou expirou. Pode tentar novamente.'}
        </p>
        <div className="flex gap-3 justify-center">
          <Button variant="outline" onClick={() => router.push('/checkout')}>
            Voltar ao Checkout
          </Button>
          {orderId && (
            <Button onClick={() => router.push(`/conta/pedidos/${orderId}`)}>
              Ver Pedido
            </Button>
          )}
        </div>
      </div>
    )
  }

  // Status: pending — mostrar iFrame
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6 text-center">
        <h1 className="text-xl font-bold text-gray-900">Pagamento via Multicaixa Express</h1>
        <p className="text-sm text-gray-500 mt-1">
          Complete o pagamento na janela abaixo. A página actualizará automaticamente.
        </p>
      </div>

      {/* Aviso de timeout */}
      {pollCount >= 20 && (
        <div className="mb-4 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-800">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>A aguardar confirmação do pagamento. Se já pagou, aguarde mais alguns momentos.</span>
        </div>
      )}

      {/* iFrame EMIS */}
      <div className="rounded-xl border border-gray-200 overflow-hidden shadow-sm bg-white">
        <iframe
          src={iframeUrl}
          width="100%"
          height="700"
          frameBorder="0"
          title="Pagamento Multicaixa Express"
          className="block"
          allow="payment"
        />
      </div>

      <div className="mt-4 flex items-center justify-between">
        <p className="text-xs text-gray-400">
          Pedido #{orderId.slice(-8).toUpperCase()} · Referência: {transactionRef.slice(0, 20)}
        </p>
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <Loader2 className="w-3 h-3 animate-spin" />
          A verificar pagamento...
        </div>
      </div>
    </div>
  )
}

export default function EmisPaymentPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    }>
      <EmisPaymentContent />
    </Suspense>
  )
}
