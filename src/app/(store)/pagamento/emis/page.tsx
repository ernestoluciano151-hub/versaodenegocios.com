'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState, useCallback, Suspense } from 'react'
import { CheckCircle, XCircle, Loader2, Smartphone, Clock, ShieldCheck, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

/**
 * Página de espera/conclusão do pagamento Multicaixa Express.
 *
 * Suporta dois fluxos, conforme os parâmetros recebidos do checkout:
 *
 * 1. iframeUrl presente (EMIS GPO directo) — o cliente conclui o
 *    pagamento dentro da iframe da EMIS (introduz o número MULTICAIXA
 *    Express e aprova na app). Esta página escuta a mensagem postMessage
 *    enviada pela iframe (secção 2.1.3.2.1 do manual GPO) só para acelerar
 *    a próxima verificação — a confirmação real vem sempre do callback
 *    server-to-server da EMIS (webhook /api/webhooks/emis), por isso o
 *    polling ao nosso próprio backend continua a ser a fonte de verdade.
 *
 * 2. Sem iframeUrl, apenas awaitApproval (AppyPay/EasyPay) — o push já foi
 *    enviado pelo servidor para a app do cliente; esta página só mostra a
 *    contagem decrescente e faz polling.
 */

// Origens válidas para a mensagem postMessage da iframe EMIS GPO
const EMIS_ORIGINS = ['https://pagamentonline.emis.co.ao', 'https://gpo.emis.co.ao']

const APPROVAL_WINDOW_S = 90
const POLL_INTERVAL_MS = 4_000
const MAX_POLLS = 45 // ~3 minutos de margem total

function McxPaymentContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const orderId = searchParams.get('orderId') ?? ''
  const transactionRef = searchParams.get('ref') ?? ''
  const iframeUrl = searchParams.get('iframeUrl') ?? ''

  const [status, setStatus] = useState<'pending' | 'paid' | 'failed' | 'timeout'>('pending')
  const [pollCount, setPollCount] = useState(0)
  const [secondsLeft, setSecondsLeft] = useState(APPROVAL_WINDOW_S)
  const [checkingNow, setCheckingNow] = useState(false)

  // Verificação imediata (fora do ciclo normal de polling) — usada quando
  // a iframe EMIS notifica a conclusão da operação via postMessage.
  const checkNow = useCallback(async () => {
    if (!orderId || checkingNow) return
    setCheckingNow(true)
    try {
      const res = await fetch(`/api/payments/verify?orderId=${orderId}&ref=${transactionRef}`)
      if (res.ok) {
        const data = (await res.json()) as { status?: string }
        const s = (data.status ?? '').toLowerCase()
        if (['paid', 'confirmed', 'success', 'completed'].includes(s)) setStatus('paid')
        else if (['failed', 'cancelled', 'expired'].includes(s)) setStatus('failed')
      }
    } catch { /* mantém-se pendente — o ciclo normal de polling continua */ }
    finally { setCheckingNow(false) }
  }, [orderId, transactionRef, checkingNow])

  // Escuta a notificação da iframe EMIS GPO (postMessage)
  useEffect(() => {
    if (!iframeUrl) return
    function receiveMessage(event: MessageEvent) {
      if (!EMIS_ORIGINS.includes(event.origin)) return
      // event.data é o id da transacção (aceite ou rejeitada) ou vazio —
      // em qualquer dos casos vale a pena confirmar já junto do backend.
      checkNow()
    }
    window.addEventListener('message', receiveMessage)
    return () => window.removeEventListener('message', receiveMessage)
  }, [iframeUrl, checkNow])

  // Countdown visual dos 90 segundos
  useEffect(() => {
    if (status !== 'pending' || secondsLeft <= 0) return
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1_000)
    return () => clearTimeout(t)
  }, [status, secondsLeft])

  // Polling do estado do pagamento. Com iframe (EMIS GPO directa) o cliente
  // ainda tem de preencher o número e aprovar na app, por isso damos-lhe
  // uma janela maior antes de mostrar "tempo esgotado" (10 min vs 3 min).
  const maxPolls = iframeUrl ? 150 : MAX_POLLS
  useEffect(() => {
    if (status !== 'pending' || !orderId) return

    const timer = setTimeout(async () => {
      if (pollCount >= maxPolls) {
        setStatus('timeout')
        return
      }
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
  }, [status, pollCount, orderId, transactionRef, maxPolls])

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

  // pending + iframe EMIS GPO directa — o cliente conclui o pagamento
  // dentro da iframe (introduz o número MULTICAIXA Express e aprova).
  //
  // A EMIS bloqueia CSS externo dentro da própria iframe (confirmado via
  // DevTools — a CSP deles rejeita o parâmetro "cssUrl"), por isso não há
  // forma de estilizar o conteúdo interno. Para o cliente sentir uma
  // experiência única e não duas páginas coladas, tratamos a nossa moldura
  // à volta da iframe como uma continuação visual dela: mesmo fundo branco,
  // sem contorno a separar as duas, e a marca fica só no cabeçalho e no
  // rodapé — que são inteiramente nossos e sempre 100% estilizáveis.
  if (iframeUrl) {
    return (
      <div className="max-w-xl mx-auto px-4 py-8 sm:py-10">
        {/* Indicador de progresso — dá continuidade ao checkout que o
            cliente acabou de preencher, antes de "saltar" para a EMIS. */}
        <div className="flex items-center justify-center gap-2 mb-6 text-xs font-medium">
          <span className="flex items-center gap-1.5 text-green-600">
            <CheckCircle className="w-4 h-4" /> Carrinho
          </span>
          <span className="w-6 h-px bg-gray-300" />
          <span className="flex items-center gap-1.5 text-green-600">
            <CheckCircle className="w-4 h-4" /> Dados
          </span>
          <span className="w-6 h-px bg-gray-300" />
          <span className="flex items-center gap-1.5 text-orange-600">
            <span className="w-4 h-4 rounded-full bg-orange-600 text-white flex items-center justify-center text-[10px]">3</span> Pagamento
          </span>
        </div>

        <div className="rounded-2xl shadow-sm overflow-hidden bg-white mx-auto border border-gray-200" style={{ maxWidth: 562 }}>
          {/* Cabeçalho — inteiramente nosso, sem seam visível para a iframe */}
          <div className="bg-gradient-to-r from-orange-600 to-orange-500 px-5 py-4 text-white">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 flex-shrink-0" />
              <h1 className="text-base font-bold">Pagamento seguro — MULTICAIXA Express</h1>
            </div>
            <p className="text-orange-50 text-xs mt-1">
              Introduza o seu número Express abaixo e aprove na app quando receber a notificação.
            </p>
          </div>

          <iframe
            src={iframeUrl}
            title="Pagamento MULTICAIXA Express"
            className="w-full block"
            style={{ minHeight: 816, border: 'none' }}
          />
        </div>

        <div className="max-w-[562px] mx-auto mt-4 flex items-center justify-center gap-2 text-gray-500 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>{checkingNow ? 'A verificar o estado do pagamento…' : 'A aguardar confirmação…'}</span>
        </div>

        {/* Rodapé de confiança — reforça que os dados vão directo para a
            EMIS, nunca passam pelos nossos servidores. */}
        <div className="max-w-[562px] mx-auto mt-3 text-center">
          <p className="text-xs text-gray-400 flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            Processado directamente pela EMIS — não guardamos os seus dados de pagamento.
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Não feche esta página. Ela actualiza automaticamente assim que o pagamento for confirmado.
          </p>
        </div>

        <div className="max-w-[562px] mx-auto mt-5 flex items-center justify-center gap-4 text-xs">
          <Link href="/checkout" className="flex items-center gap-1 text-gray-500 hover:text-gray-700">
            <ArrowLeft className="w-3.5 h-3.5" /> Voltar ao checkout
          </Link>
          <span className="text-gray-300">·</span>
          <Link href="/contacto" className="text-gray-500 hover:text-gray-700">
            Precisa de ajuda?
          </Link>
        </div>
      </div>
    )
  }

  // pending — aguardar aprovação do push MCX Express (AppyPay)
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
