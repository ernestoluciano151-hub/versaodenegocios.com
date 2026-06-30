'use client'
import { useEffect, useState } from 'react'
import { HelpCircle, Plus, Loader2, MessageCircle, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'

interface Ticket {
  id: string; subject: string; message: string; status: string
  adminReply: string | null; repliedAt: string | null; createdAt: string
}

const STATUS_LABELS: Record<string, string> = {
  open: 'Aberto', in_progress: 'Em Análise', resolved: 'Resolvido', closed: 'Fechado',
}
const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'success' | 'warning' | 'destructive'> = {
  open: 'default', in_progress: 'warning', resolved: 'success', closed: 'secondary',
}

export default function ContaSuportePage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ subject: '', message: '' })
  const [success, setSuccess] = useState(false)

  async function load() {
    const res = await fetch('/api/conta/support')
    if (res.ok) setTickets(await res.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSending(true)
    const res = await fetch('/api/conta/support', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      setForm({ subject: '', message: '' })
      setShowForm(false)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 4000)
      await load()
    }
    setSending(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Suporte</h1>
          <p className="text-gray-500 text-sm mt-1">Precisa de ajuda? Envie-nos uma mensagem.</p>
        </div>
        <Button onClick={() => setShowForm(v => !v)} className="bg-orange-500 hover:bg-orange-600 gap-2">
          <Plus className="w-4 h-4" /> Novo pedido
        </Button>
      </div>

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> Pedido de suporte enviado com sucesso! Responderemos em breve.
        </div>
      )}

      {showForm && (
        <div className="bg-white rounded-xl border border-orange-300 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Novo Pedido de Suporte</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Assunto</Label>
              <Input
                value={form.subject}
                onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                placeholder="Ex: Problema com a minha encomenda"
                required className="mt-1"
              />
            </div>
            <div>
              <Label>Mensagem</Label>
              <textarea
                value={form.message}
                onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                placeholder="Descreva o seu problema em detalhe..."
                rows={5}
                required
                className="w-full mt-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 resize-y"
              />
            </div>
            <div className="flex gap-3">
              <Button type="submit" disabled={sending} className="bg-orange-500 hover:bg-orange-600">
                {sending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Enviar pedido
              </Button>
              <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancelar</Button>
            </div>
          </form>
        </div>
      )}

      {/* Tickets */}
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-orange-500" /></div>
      ) : tickets.length === 0 && !showForm ? (
        <div className="bg-white rounded-xl border border-gray-200 py-16 text-center">
          <HelpCircle className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Sem pedidos de suporte</p>
          <p className="text-gray-400 text-sm mt-1">Clique em "Novo pedido" para entrar em contacto connosco</p>
        </div>
      ) : (
        <div className="space-y-4">
          {tickets.map((t) => (
            <div key={t.id} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <MessageCircle className="w-4 h-4 text-orange-500" />
                    <p className="font-semibold text-gray-900">{t.subject}</p>
                  </div>
                  <p className="text-xs text-gray-400">{new Date(t.createdAt).toLocaleDateString('pt-AO', { dateStyle: 'medium' })}</p>
                </div>
                <Badge variant={STATUS_VARIANTS[t.status]}>{STATUS_LABELS[t.status]}</Badge>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600 mb-3">
                {t.message}
              </div>
              {t.adminReply && (
                <div className="border-l-4 border-orange-500 pl-4 bg-orange-50 rounded-r-lg p-3">
                  <p className="text-xs font-semibold text-orange-600 mb-1">Resposta da equipa VN Commerce</p>
                  <p className="text-sm text-gray-700">{t.adminReply}</p>
                  {t.repliedAt && <p className="text-xs text-gray-400 mt-1">{new Date(t.repliedAt).toLocaleDateString('pt-AO', { dateStyle: 'medium' })}</p>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
