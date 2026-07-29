'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import { CheckCircle, Loader2, Copy, Check, Landmark, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'

/**
 * Página de Pagamento por Referência Multicaixa (AppyPay/EasyPay REF).
 *
 * Mostra Entidade + Referência + Montante. O cliente paga no ATM,
 * Internet Banking ou Multicaixa Express. A página faz polling e
 * confirma automaticamente quando o pagamento entra.
 */

const POLL_INTERVAL_MS = 8_000

function formatAOA(v: string | number): string {
  const n = typeof v === 'string' ? parseFloat(v) : v
  if (!Number.isFinite(n)) return String(v)
  return new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA', maximumFractionDigits: 2 }).format(n)
}

function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <div className="flex items-center justify-between gap-3 p-4 rounded-xl bg-gray-50 border border-gray-200">
      <div className="text-left">
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-lg font-bold text-gray-900 tracking-wider">{value}</p>
      </div>
      <button
        type="button"
        onClick={() => {
          navigator.clipboard.writeText(value).catch(() => {})
          setCopied(true)
          setTimeout(() => setCopied(false), 2_000)
        }}
        className="p-2 rounded-lg hover:bg-gray-200 text-gray-500 transition-colors"
        aria-label={`Copiar ${label}`}
      >
        {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
      </button>
    </div>
  )
}

function ReferencePaymentContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const orderId = searchParams.get('orderId') ?? ''
  const transactionRef = searchParams.get('ref') ?? ''
  const entity = searchParams.get('entity') ?? ''
  const reference = searchParams.get('reference') ?? ''
  const amount = searchParams.get('amount') ?? ''
  const expiresAt = searchParams.get('expiresAt') ?? ''

  const [status, setStatus] = useState<'pending' | 'paid'>('pending')

  // Polling — confirma automaticamente quando o pagamento entrar
  useEffect(() => {
    if (status !== 'pending' || !orderId) return
    const timer = setInterval(async () => {
      try {
        const res = await fetch(`/api/payments/verify?orderId=${orderId}&ref=${transactionRef}`)
        if (res.ok) {
          const data = (await res.json()) as { status?: string }
          if (['paid', 'confirmed', 'success', 'completed'].includes((data.status ?? '').toLowerCase())) {
            setStatus('paid')
          }
        }
      } catch { /* continua */ }
    }, POLL_INTERVAL_MS)
    return () => clearInterval(timer)
  }, [status, orderId, transactionRef])

  if (!orderId) {
    return (
      <div className="max-w-lg mx-auto px-4 py-24 text-center">
        <p className="text-gray-500">Pedido não encontrado.</p>
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
          O seu pedido <span className="font-medium text-gray-900">#{orderId.slice(-8).toUpperCase()}</span> foi pago com sucesso.
        </p>
        <Button onClick={() => router.push(`/conta/pedidos/${orderId}?novo=1`)} size="lg">
          Ver Pedido
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-16 text-center">
      <div className="w-16 h-16 bg-red-50 border-2 border-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Landmark className="w-8 h-8 text-red-700" />
      </div>
      <h1 className="text-2xl font-bold text-gray-900">Pague por Referência Multicaixa</h1>
      <p className="text-gray-600 mt-2 mb-8">
        Use os dados abaixo no <strong>ATM</strong>, <strong>Internet Banking</strong> ou na app{' '}
        <strong>Multicaixa Express</strong> (menu Pagamentos → Por Referência).
      </p>

      <div className="space-y-3 text-left">
        {entity && <CopyField label="Entidade" value={entity} />}
        {reference && <CopyField label="Referência" value={reference} />}
        {amount && <CopyField label="Montante exacto" value={formatAOA(amount)} />}
      </div>

      {!reference && (
        <p className="mt-4 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
          A referência está a ser gerada. Consulte os detalhes do pedido dentro de momentos ou verifique o seu email.
        </p>
      )}

      {expiresAt && (
        <p className="mt-4 flex items-center justify-center gap-1.5 text-sm text-gray-500">
          <Clock className="w-4 h-4" />
          Válida até {new Date(expiresAt).toLocaleString('pt-PT')}
        </p>
      )}

      <div className="mt-8 flex items-center justify-center gap-2 text-gray-400 text-sm">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>A aguardar confirmação do pagamento…</span>
      </div>

      <div className="mt-8 flex gap-3 justify-center">
        <Button variant="outline" onClick={() => router.push(`/conta/pedidos/${orderId}`)}>
          Ver Pedido
        </Button>
        <Button onClick={() => router.push('/produtos')}>Continuar a Comprar</Button>
      </div>

      <p className="text-xs text-gray-400 mt-8">
        Pode fechar esta página — o pedido será confirmado automaticamente assim que o pagamento entrar.
      </p>
    </div>
  )
}

export default function ReferencePaymentPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
        </div>
      }
    >
      <ReferencePaymentContent />
    </Suspense>
  )
}
