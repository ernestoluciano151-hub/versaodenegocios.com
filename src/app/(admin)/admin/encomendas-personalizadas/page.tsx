'use client'

import { useState, useEffect, useRef } from 'react'
import { TopBar } from '@/components/admin/TopBar'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  ClipboardList, Clock, MessageSquare, CheckCircle, Send,
  Search, ChevronRight, Package, DollarSign, Truck, FileText,
  RefreshCw, X,
} from 'lucide-react'

type CustomOrderStatus =
  | 'received' | 'analyzing' | 'negotiating' | 'approved'
  | 'rejected' | 'purchasing' | 'in_transit' | 'delivered' | 'cancelled'

const STATUS_LABELS: Record<CustomOrderStatus, string> = {
  received:    'Recebido',
  analyzing:   'Em Análise',
  negotiating: 'A Negociar',
  approved:    'Aprovado',
  rejected:    'Rejeitado',
  purchasing:  'Em Compra',
  in_transit:  'Em Transporte',
  delivered:   'Entregue',
  cancelled:   'Cancelado',
}

const STATUS_COLORS: Record<CustomOrderStatus, string> = {
  received:    'bg-gray-100 text-gray-700',
  analyzing:   'bg-blue-100 text-blue-700',
  negotiating: 'bg-purple-100 text-purple-700',
  approved:    'bg-emerald-100 text-emerald-700',
  rejected:    'bg-rose-100 text-rose-700',
  purchasing:  'bg-orange-100 text-orange-700',
  in_transit:  'bg-cyan-100 text-cyan-700',
  delivered:   'bg-green-100 text-green-700',
  cancelled:   'bg-red-100 text-red-700',
}

const ALL_STATUSES = Object.keys(STATUS_LABELS) as CustomOrderStatus[]

interface Message {
  id: string
  sender: 'customer' | 'admin'
  text: string
  createdAt: string
}

interface CustomOrder {
  id: string
  customerName: string
  customerEmail: string
  customerPhone?: string
  title: string
  description: string
  originCountry?: string
  quantity?: number
  budget?: number
  currency?: string
  status: CustomOrderStatus
  quotedPrice?: number
  quotedShipping?: number
  quotedConditions?: string
  createdAt: string
  messages: Message[]
}

export default function EncomendasPersonalizadasPage() {
  const [orders, setOrders] = useState<CustomOrder[]>([])
  const [selected, setSelected] = useState<CustomOrder | null>(null)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [converting, setConverting] = useState(false)
  const [quotedPrice, setQuotedPrice] = useState('')
  const [quotedShipping, setQuotedShipping] = useState('')
  const [quotedConditions, setQuotedConditions] = useState('')
  const [savingQuote, setSavingQuote] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  async function loadOrders() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/custom-orders')
      const data = await res.json()
      setOrders(Array.isArray(data) ? data : [])
    } catch {
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadOrders() }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [selected?.messages])

  function selectOrder(o: CustomOrder) {
    setSelected(o)
    setQuotedPrice(o.quotedPrice != null ? String(o.quotedPrice) : '')
    setQuotedShipping(o.quotedShipping != null ? String(o.quotedShipping) : '')
    setQuotedConditions(o.quotedConditions ?? '')
  }

  async function sendReply() {
    if (!reply.trim() || !selected) return
    setSending(true)
    try {
      const res = await fetch(`/api/admin/custom-orders/${selected.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: reply }),
      })
      if (res.ok) {
        const msg = await res.json()
        const updated = { ...selected, messages: [...selected.messages, msg] }
        setSelected(updated)
        setOrders(prev => prev.map(o => o.id === selected.id ? updated : o))
        setReply('')
      }
    } finally {
      setSending(false)
    }
  }

  async function changeStatus(status: CustomOrderStatus) {
    if (!selected) return
    setUpdatingStatus(true)
    try {
      const res = await fetch(`/api/admin/custom-orders/${selected.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (res.ok) {
        const updated = { ...selected, status }
        setSelected(updated)
        setOrders(prev => prev.map(o => o.id === selected.id ? updated : o))
      }
    } finally {
      setUpdatingStatus(false)
    }
  }

  async function saveQuote() {
    if (!selected) return
    setSavingQuote(true)
    try {
      const res = await fetch(`/api/admin/custom-orders/${selected.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quotedPrice: quotedPrice ? Number(quotedPrice) : undefined,
          quotedShipping: quotedShipping ? Number(quotedShipping) : undefined,
          quotedConditions: quotedConditions || undefined,
        }),
      })
      if (res.ok) {
        const updated = {
          ...selected,
          quotedPrice: quotedPrice ? Number(quotedPrice) : selected.quotedPrice,
          quotedShipping: quotedShipping ? Number(quotedShipping) : selected.quotedShipping,
          quotedConditions: quotedConditions || selected.quotedConditions,
        }
        setSelected(updated)
        setOrders(prev => prev.map(o => o.id === selected.id ? updated : o))
      }
    } finally {
      setSavingQuote(false)
    }
  }

  async function convertToProduct() {
    if (!selected) return
    if (!confirm('Converter esta encomenda em produto? Será redirecionado para a criação do produto.')) return
    setConverting(true)
    try {
      const res = await fetch(`/api/admin/custom-orders/${selected.id}/convert`, { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        if (data.productId) window.open(`/admin/produtos/${data.productId}`, '_blank')
      }
    } finally {
      setConverting(false)
    }
  }

  const filtered = orders.filter(o => {
    const matchStatus = statusFilter === 'all' || o.status === statusFilter
    const matchSearch = !search || [o.customerName, o.customerEmail, o.title]
      .some(s => s?.toLowerCase().includes(search.toLowerCase()))
    return matchStatus && matchSearch
  })

  const stats = {
    total:       orders.length,
    received:    orders.filter(o => o.status === 'received').length,
    negotiating: orders.filter(o => o.status === 'negotiating').length,
    approved:    orders.filter(o => o.status === 'approved').length,
    delivered:   orders.filter(o => o.status === 'delivered').length,
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TopBar
        title="Encomendas Personalizadas"
        actions={
          <Button variant="ghost" size="sm" onClick={loadOrders}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        }
      />

      <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4">
        {/* Stats bar */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {[
            { label: 'Total', value: stats.total, icon: ClipboardList, color: 'text-gray-600 bg-gray-100' },
            { label: 'Recebidos', value: stats.received, icon: Clock, color: 'text-orange-600 bg-orange-100' },
            { label: 'A Negociar', value: stats.negotiating, icon: MessageSquare, color: 'text-purple-600 bg-purple-100' },
            { label: 'Aprovados', value: stats.approved, icon: CheckCircle, color: 'text-emerald-600 bg-emerald-100' },
            { label: 'Entregues', value: stats.delivered, icon: Package, color: 'text-green-600 bg-green-100' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${s.color}`}>
                <s.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                <p className="text-xs text-gray-500">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4" style={{ minHeight: 0 }}>
          {/* Left sidebar — list */}
          <div className="bg-white rounded-xl border border-gray-200 flex flex-col overflow-hidden">
            <div className="p-3 border-b border-gray-100 space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Pesquisar..."
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="all">Todos os estados</option>
                {ALL_STATUSES.map(s => (
                  <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                ))}
              </select>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
              {loading ? (
                <div className="p-8 text-center text-gray-400 text-sm">A carregar...</div>
              ) : filtered.length === 0 ? (
                <div className="p-8 text-center text-gray-400">
                  <ClipboardList className="w-10 h-10 mx-auto mb-2 text-gray-200" />
                  <p className="text-sm">Sem encomendas</p>
                </div>
              ) : filtered.map(o => (
                <button
                  key={o.id}
                  onClick={() => selectOrder(o)}
                  className={`w-full text-left p-4 hover:bg-gray-50 flex items-center justify-between gap-2 transition-colors ${
                    selected?.id === o.id ? 'bg-orange-50 border-l-2 border-orange-500' : ''
                  }`}
                >
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 text-sm truncate">{o.title}</p>
                    <p className="text-xs text-gray-500 truncate">{o.customerName}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[o.status]}`}>
                        {STATUS_LABELS[o.status]}
                      </span>
                      {o.messages.length > 0 && (
                        <span className="text-xs text-gray-400 flex items-center gap-0.5">
                          <MessageSquare className="w-3 h-3" /> {o.messages.length}
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                </button>
              ))}
            </div>
          </div>

          {/* Right — detail + chat */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            {!selected ? (
              <div className="bg-white rounded-xl border border-gray-200 flex-1 flex items-center justify-center min-h-64 text-gray-400">
                <div className="text-center">
                  <ClipboardList className="w-12 h-12 mx-auto mb-3 text-gray-200" />
                  <p className="text-sm">Seleccione uma encomenda para ver detalhes</p>
                </div>
              </div>
            ) : (
              <>
                {/* Detail card */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  {/* Header */}
                  <div className="p-4 border-b border-gray-100 flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-gray-900 text-lg">{selected.title}</h3>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {selected.customerName} · {selected.customerEmail}
                        {selected.customerPhone && ` · ${selected.customerPhone}`}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">{formatDate(selected.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={selected.status}
                        onChange={e => changeStatus(e.target.value as CustomOrderStatus)}
                        disabled={updatingStatus}
                        className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50"
                      >
                        {ALL_STATUSES.map(s => (
                          <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                        ))}
                      </select>
                      {selected.status === 'approved' && (
                        <Button
                          size="sm"
                          onClick={convertToProduct}
                          disabled={converting}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                        >
                          <Package className="w-3.5 h-3.5 mr-1" />
                          {converting ? 'A converter...' : 'Converter em Produto'}
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Info grid */}
                  <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4 border-b border-gray-100 text-sm">
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Descrição</p>
                      <p className="text-gray-700 text-xs leading-relaxed">{selected.description}</p>
                    </div>
                    {selected.originCountry && (
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Origem</p>
                        <p className="text-gray-700 font-medium">{selected.originCountry}</p>
                      </div>
                    )}
                    {selected.quantity != null && (
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Quantidade</p>
                        <p className="text-gray-700 font-medium">{selected.quantity}</p>
                      </div>
                    )}
                    {selected.budget != null && (
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Orçamento cliente</p>
                        <p className="text-gray-900 font-bold">
                          {formatCurrency(selected.budget)} {selected.currency}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Quotation fields */}
                  <div className="p-4 border-b border-gray-100">
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-3 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5" /> Cotação Admin
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block flex items-center gap-1">
                          <DollarSign className="w-3 h-3" /> Preço Cotado
                        </label>
                        <input
                          type="number"
                          value={quotedPrice}
                          onChange={e => setQuotedPrice(e.target.value)}
                          placeholder="0.00"
                          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block flex items-center gap-1">
                          <Truck className="w-3 h-3" /> Envio
                        </label>
                        <input
                          type="number"
                          value={quotedShipping}
                          onChange={e => setQuotedShipping(e.target.value)}
                          placeholder="0.00"
                          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Condições</label>
                        <input
                          type="text"
                          value={quotedConditions}
                          onChange={e => setQuotedConditions(e.target.value)}
                          placeholder="Ex: pagamento antecipado 50%"
                          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      </div>
                    </div>
                    <div className="mt-2 flex justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={saveQuote}
                        disabled={savingQuote}
                        className="text-xs"
                      >
                        {savingQuote ? 'A guardar...' : 'Guardar Cotação'}
                      </Button>
                    </div>
                    {(selected.quotedPrice != null || selected.quotedShipping != null || selected.quotedConditions) && (
                      <div className="mt-2 p-2 bg-emerald-50 rounded-lg text-xs text-emerald-700 flex flex-wrap gap-3">
                        {selected.quotedPrice != null && <span>Preço: <strong>{formatCurrency(selected.quotedPrice)}</strong></span>}
                        {selected.quotedShipping != null && <span>Envio: <strong>{formatCurrency(selected.quotedShipping)}</strong></span>}
                        {selected.quotedConditions && <span>Condições: <strong>{selected.quotedConditions}</strong></span>}
                      </div>
                    )}
                  </div>

                  {/* Messages thread */}
                  <div className="flex flex-col">
                    <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between">
                      <p className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5" /> Mensagens ({selected.messages.length})
                      </p>
                    </div>

                    <div className="p-4 space-y-3 max-h-72 overflow-y-auto bg-gray-50">
                      {selected.messages.length === 0 ? (
                        <p className="text-sm text-gray-400 text-center py-6">Sem mensagens ainda.</p>
                      ) : selected.messages.map(m => (
                        <div key={m.id} className={`flex ${m.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-sm rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                            m.sender === 'admin'
                              ? 'bg-orange-500 text-white rounded-br-sm'
                              : 'bg-white text-gray-800 border border-gray-200 rounded-bl-sm'
                          }`}>
                            <p>{m.text}</p>
                            <p className={`text-xs mt-1 ${m.sender === 'admin' ? 'text-orange-100' : 'text-gray-400'}`}>
                              {new Date(m.createdAt).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Reply input */}
                    <div className="p-3 border-t border-gray-100 flex gap-2 bg-white">
                      <input
                        value={reply}
                        onChange={e => setReply(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendReply()}
                        placeholder="Escrever resposta ao cliente..."
                        className="flex-1 text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                      <Button
                        onClick={sendReply}
                        disabled={sending || !reply.trim()}
                        size="sm"
                        className="bg-orange-500 hover:bg-orange-600 text-white"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
