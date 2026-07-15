'use client'

import { useState, useEffect } from 'react'
import { TopBar } from '@/components/admin/TopBar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ClipboardList, Clock, CheckCircle, XCircle, MessageSquare, Send, ChevronRight } from 'lucide-react'

type Status = 'pending' | 'reviewing' | 'quoted' | 'approved' | 'in_production' | 'ready' | 'delivered' | 'cancelled' | 'rejected'

interface CustomOrder {
  id: string
  customerName: string
  customerEmail: string
  title: string
  description: string
  budget: number
  currency: string
  status: Status
  createdAt: string
  messages: { id: string; sender: 'customer' | 'admin'; text: string; createdAt: string }[]
}

const statusConfig: Record<Status, { label: string; color: string }> = {
  pending:       { label: 'Pendente',        color: 'bg-gray-100 text-gray-700' },
  reviewing:     { label: 'Em análise',      color: 'bg-blue-100 text-blue-700' },
  quoted:        { label: 'Orçamentado',     color: 'bg-purple-100 text-purple-700' },
  approved:      { label: 'Aprovado',        color: 'bg-emerald-100 text-emerald-700' },
  in_production: { label: 'Em produção',     color: 'bg-orange-100 text-orange-700' },
  ready:         { label: 'Pronto',          color: 'bg-teal-100 text-teal-700' },
  delivered:     { label: 'Entregue',        color: 'bg-green-100 text-green-700' },
  cancelled:     { label: 'Cancelado',       color: 'bg-red-100 text-red-700' },
  rejected:      { label: 'Rejeitado',       color: 'bg-rose-100 text-rose-700' },
}

const STATUSES: Status[] = ['pending','reviewing','quoted','approved','in_production','ready','delivered','cancelled','rejected']

export default function EncomendasPersonalizadasPage() {
  const [orders, setOrders] = useState<CustomOrder[]>([])
  const [selected, setSelected] = useState<CustomOrder | null>(null)
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)

  useEffect(() => {
    fetch('/api/admin/custom-orders')
      .then(r => r.json())
      .then(setOrders)
      .catch(() => setOrders([]))
  }, [])

  async function sendReply() {
    if (!reply.trim() || !selected) return
    setSending(true)
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
    setSending(false)
  }

  async function changeStatus(status: Status) {
    if (!selected) return
    setUpdatingStatus(true)
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
    setUpdatingStatus(false)
  }

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    inProgress: orders.filter(o => ['reviewing','quoted','approved','in_production','ready'].includes(o.status)).length,
    delivered: orders.filter(o => o.status === 'delivered').length,
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TopBar title="Encomendas Personalizadas" />
      <div className="flex-1 overflow-y-auto p-4 lg:p-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Total', value: stats.total, icon: ClipboardList, color: 'text-gray-600 bg-gray-100' },
            { label: 'Pendentes', value: stats.pending, icon: Clock, color: 'text-orange-600 bg-orange-100' },
            { label: 'Em curso', value: stats.inProgress, icon: MessageSquare, color: 'text-blue-600 bg-blue-100' },
            { label: 'Entregues', value: stats.delivered, icon: CheckCircle, color: 'text-green-600 bg-green-100' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.color}`}>
                <s.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                <p className="text-xs text-gray-500">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* List */}
          <div className="lg:col-span-1 bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Pedidos</h2>
            </div>
            <div className="divide-y divide-gray-50 overflow-y-auto max-h-[500px]">
              {orders.length === 0 ? (
                <div className="py-12 text-center text-gray-400">
                  <ClipboardList className="w-10 h-10 mx-auto mb-2 text-gray-200" />
                  <p className="text-sm">Sem encomendas personalizadas</p>
                </div>
              ) : orders.map(o => (
                <button
                  key={o.id}
                  onClick={() => setSelected(o)}
                  className={`w-full text-left p-4 hover:bg-gray-50 flex items-center justify-between gap-2 transition-colors ${selected?.id === o.id ? 'bg-orange-50 border-l-2 border-orange-500' : ''}`}
                >
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 text-sm truncate">{o.title}</p>
                    <p className="text-xs text-gray-500 truncate">{o.customerName}</p>
                    <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium ${statusConfig[o.status].color}`}>
                      {statusConfig[o.status].label}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                </button>
              ))}
            </div>
          </div>

          {/* Detail */}
          <div className="lg:col-span-2">
            {!selected ? (
              <div className="bg-white rounded-xl border border-gray-200 h-full flex items-center justify-center text-gray-400 min-h-[300px]">
                <div className="text-center">
                  <ClipboardList className="w-12 h-12 mx-auto mb-3 text-gray-200" />
                  <p className="text-sm">Seleccione uma encomenda para ver detalhes</p>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-4 border-b border-gray-100 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{selected.title}</h3>
                    <p className="text-sm text-gray-500">{selected.customerName} · {selected.customerEmail}</p>
                  </div>
                  <select
                    value={selected.status}
                    onChange={e => changeStatus(e.target.value as Status)}
                    disabled={updatingStatus}
                    className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    {STATUSES.map(s => (
                      <option key={s} value={s}>{statusConfig[s].label}</option>
                    ))}
                  </select>
                </div>

                {/* Info */}
                <div className="p-4 border-b border-gray-100 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Descrição</p>
                    <p className="text-gray-700">{selected.description}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Orçamento</p>
                    <p className="text-gray-900 font-bold">{selected.budget.toLocaleString('pt-AO')} {selected.currency}</p>
                  </div>
                </div>

                {/* Messages */}
                <div className="p-4 space-y-3 max-h-60 overflow-y-auto flex-1">
                  {selected.messages.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-4">Sem mensagens ainda</p>
                  ) : selected.messages.map(m => (
                    <div key={m.id} className={`flex ${m.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs rounded-2xl px-4 py-2.5 text-sm ${
                        m.sender === 'admin' ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-800'
                      }`}>
                        <p>{m.text}</p>
                        <p className={`text-xs mt-1 ${m.sender === 'admin' ? 'text-orange-100' : 'text-gray-400'}`}>
                          {new Date(m.createdAt).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Reply */}
                <div className="p-4 border-t border-gray-100 flex gap-2">
                  <input
                    value={reply}
                    onChange={e => setReply(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendReply()}
                    placeholder="Escrever resposta..."
                    className="flex-1 text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  <Button onClick={sendReply} disabled={sending || !reply.trim()} size="sm">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
