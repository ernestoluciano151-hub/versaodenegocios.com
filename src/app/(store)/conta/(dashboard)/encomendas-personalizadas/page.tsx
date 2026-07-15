'use client'

import { useState, useEffect, useCallback } from 'react'
import { ClipboardList, Plus, X, Send, Clock, CheckCircle, Truck, AlertCircle, Package } from 'lucide-react'
import { formatDate } from '@/lib/utils'

type OrderStatus =
  | 'pending' | 'awaiting_quote' | 'quote_sent' | 'approved'
  | 'in_progress' | 'production' | 'quality_check' | 'ready'
  | 'delivered' | 'cancelled'

interface CustomOrder {
  id: string
  reference: string
  status: OrderStatus
  description: string
  budget: number | null
  messages: { id: string; author: string; text: string; createdAt: string }[]
  createdAt: string
  updatedAt: string
}

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Pendente',
  awaiting_quote: 'Aguarda Orçamento',
  quote_sent: 'Orçamento Enviado',
  approved: 'Aprovado',
  in_progress: 'Em Processamento',
  production: 'Em Produção',
  quality_check: 'Controlo de Qualidade',
  ready: 'Pronto para Entrega',
  delivered: 'Entregue',
  cancelled: 'Cancelado',
}

const STATUS_COLOR: Record<OrderStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  awaiting_quote: 'bg-blue-100 text-blue-700',
  quote_sent: 'bg-purple-100 text-purple-700',
  approved: 'bg-green-100 text-green-700',
  in_progress: 'bg-orange-100 text-orange-700',
  production: 'bg-indigo-100 text-indigo-700',
  quality_check: 'bg-pink-100 text-pink-700',
  ready: 'bg-emerald-100 text-emerald-700',
  delivered: 'bg-gray-100 text-gray-700',
  cancelled: 'bg-red-100 text-red-700',
}

function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLOR[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  )
}

function StatusIcon({ status }: { status: OrderStatus }) {
  if (status === 'delivered') return <CheckCircle className="w-5 h-5 text-green-500" />
  if (status === 'cancelled') return <AlertCircle className="w-5 h-5 text-red-500" />
  if (status === 'ready') return <Truck className="w-5 h-5 text-emerald-500" />
  if (['in_progress', 'production', 'quality_check'].includes(status)) return <Package className="w-5 h-5 text-orange-500" />
  return <Clock className="w-5 h-5 text-blue-500" />
}

export default function EncomendasPersonalizadasPage() {
  const [orders, setOrders] = useState<CustomOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<CustomOrder | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({ description: '', budget: '' })
  const [formError, setFormError] = useState('')

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/conta/custom-orders')
      if (res.ok) {
        const data = await res.json()
        setOrders(data)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchOrders() }, [fetchOrders])

  async function submitOrder(e: React.FormEvent) {
    e.preventDefault()
    setFormError('')
    if (formData.description.trim().length < 20) {
      setFormError('Descrição deve ter pelo menos 20 caracteres.')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/conta/custom-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: formData.description,
          budget: formData.budget ? Number(formData.budget) : null,
        }),
      })
      if (res.ok) {
        const order = await res.json()
        setOrders((prev) => [order, ...prev])
        setFormData({ description: '', budget: '' })
        setShowForm(false)
      } else {
        const err = await res.json()
        setFormError(err.error || 'Erro ao enviar encomenda.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  async function sendReply(e: React.FormEvent) {
    e.preventDefault()
    if (!selected || !replyText.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/conta/custom-orders/${selected.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: replyText }),
      })
      if (res.ok) {
        const msg = await res.json()
        setSelected((prev) => prev ? { ...prev, messages: [...prev.messages, msg] } : prev)
        setReplyText('')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Encomendas Personalizadas</h1>
          <p className="text-sm text-gray-500 mt-1">Solicite produtos ou serviços à medida das suas necessidades.</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nova Encomenda
        </button>
      </div>

      {/* New order form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Nova Encomenda Personalizada</h2>
            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={submitOrder} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descrição do Pedido <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={5}
                value={formData.description}
                onChange={(e) => setFormData((f) => ({ ...f, description: e.target.value }))}
                placeholder="Descreva em detalhe o que precisa: quantidade, tamanhos, materiais, cores, prazo, etc."
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                required
              />
              <p className="text-xs text-gray-400 mt-1">{formData.description.length}/20 mínimo</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Orçamento Estimado (Kz) — opcional
              </label>
              <input
                type="number"
                min="0"
                value={formData.budget}
                onChange={(e) => setFormData((f) => ({ ...f, budget: e.target.value }))}
                placeholder="ex: 50000"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            {formError && <p className="text-sm text-red-600">{formError}</p>}
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 disabled:opacity-50 transition-colors"
              >
                {submitting ? 'A enviar…' : 'Enviar Pedido'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-5 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Orders list */}
      {loading ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Sem encomendas personalizadas</p>
          <p className="text-sm text-gray-400 mt-1">Clique em "Nova Encomenda" para começar.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <div
              key={order.id}
              onClick={() => setSelected(selected?.id === order.id ? null : order)}
              className={`bg-white rounded-xl border cursor-pointer transition-all ${
                selected?.id === order.id ? 'border-orange-400 shadow-md' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <StatusIcon status={order.status} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-semibold text-gray-500">{order.reference}</span>
                        <StatusBadge status={order.status} />
                      </div>
                      <p className="text-sm text-gray-700 mt-1 line-clamp-2">{order.description}</p>
                      <p className="text-xs text-gray-400 mt-1">Criado em {formatDate(order.createdAt)}</p>
                    </div>
                  </div>
                  {order.budget && (
                    <p className="text-sm font-semibold text-gray-900 whitespace-nowrap">
                      {Number(order.budget).toLocaleString('pt-AO')} Kz
                    </p>
                  )}
                </div>
              </div>

              {/* Message thread */}
              {selected?.id === order.id && (
                <div className="border-t border-gray-100 p-4 space-y-3" onClick={(e) => e.stopPropagation()}>
                  <h3 className="text-sm font-semibold text-gray-700">Mensagens</h3>
                  {order.messages.length === 0 ? (
                    <p className="text-sm text-gray-400">Sem mensagens ainda.</p>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {order.messages.map((m) => (
                        <div
                          key={m.id}
                          className={`flex ${m.author === 'customer' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-xs px-3 py-2 rounded-xl text-sm ${
                              m.author === 'customer'
                                ? 'bg-orange-500 text-white'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            <p>{m.text}</p>
                            <p className={`text-xs mt-1 ${m.author === 'customer' ? 'text-orange-200' : 'text-gray-400'}`}>
                              {formatDate(m.createdAt)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {order.status !== 'cancelled' && order.status !== 'delivered' && (
                    <form onSubmit={sendReply} className="flex gap-2 pt-1">
                      <input
                        type="text"
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Escreva uma mensagem…"
                        className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                      <button
                        type="submit"
                        disabled={submitting || !replyText.trim()}
                        className="p-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 transition-colors"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </form>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
