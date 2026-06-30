'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Loader2, Plus, Pencil, Send, Trash2, X } from 'lucide-react'

type CampaignStatus = 'draft' | 'scheduled' | 'sent'

interface Campaign {
  id: string
  name: string
  subject: string
  body: string
  status: CampaignStatus
  scheduledAt: string | null
  sentAt: string | null
  recipientCount: number
  createdAt: string
}

const STATUS_LABELS: Record<CampaignStatus, string> = { draft: 'Rascunho', scheduled: 'Agendado', sent: 'Enviado' }
const STATUS_VARIANTS: Record<CampaignStatus, 'secondary' | 'warning' | 'success'> = { draft: 'secondary', scheduled: 'warning', sent: 'success' }

const emptyForm = { name: '', subject: '', body: '', scheduledAt: '', status: 'draft' as CampaignStatus }

export function CampaignManager({ initialCampaigns }: { initialCampaigns: Campaign[] }) {
  const [campaigns, setCampaigns] = useState<Campaign[]>(initialCampaigns)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [sendingId, setSendingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  function openNew() {
    setForm(emptyForm)
    setEditId(null)
    setShowForm(true)
    setError(null)
  }

  function openEdit(c: Campaign) {
    setForm({
      name: c.name,
      subject: c.subject,
      body: c.body,
      scheduledAt: c.scheduledAt ? c.scheduledAt.slice(0, 16) : '',
      status: c.status,
    })
    setEditId(c.id)
    setShowForm(true)
    setError(null)
  }

  function cancelForm() { setShowForm(false); setEditId(null); setError(null) }

  async function handleSave() {
    setSaving(true); setError(null)
    try {
      const payload = { name: form.name, subject: form.subject, body: form.body, scheduledAt: form.scheduledAt || null, status: form.status }
      let res: Response
      if (editId) {
        res = await fetch(`/api/admin/campaigns/${editId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      } else {
        res = await fetch('/api/admin/campaigns', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      }
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Erro ao guardar') }
      const saved: Campaign = await res.json()
      if (editId) { setCampaigns(prev => prev.map(c => c.id === editId ? saved : c)) }
      else { setCampaigns(prev => [saved, ...prev]) }
      cancelForm()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro desconhecido')
    } finally { setSaving(false) }
  }

  async function sendNow(c: Campaign) {
    setSendingId(c.id)
    try {
      const res = await fetch(`/api/admin/campaigns/${c.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'sent', sentAt: new Date().toISOString() }) })
      if (!res.ok) return
      const updated: Campaign = await res.json()
      setCampaigns(prev => prev.map(x => x.id === c.id ? updated : x))
    } finally { setSendingId(null) }
  }

  async function deleteCampaign(id: string) {
    if (!confirm('Tem a certeza que quer eliminar esta campanha?')) return
    setDeletingId(id)
    try {
      await fetch(`/api/admin/campaigns/${id}`, { method: 'DELETE' })
      setCampaigns(prev => prev.filter(c => c.id !== id))
    } finally { setDeletingId(null) }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">Campanhas de Email</h2>
        <Button size="sm" onClick={openNew} className="gap-1">
          <Plus className="w-4 h-4" /> Nova Campanha
        </Button>
      </div>

      {showForm && (
        <div className="p-5 border-b border-gray-100 bg-gray-50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-gray-900">{editId ? 'Editar Campanha' : 'Nova Campanha'}</h3>
            <button onClick={cancelForm}><X className="w-4 h-4 text-gray-400" /></button>
          </div>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Nome da Campanha</Label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Promoção de Verão" />
              </div>
              <div>
                <Label>Estado</Label>
                <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as CampaignStatus }))} className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm">
                  <option value="draft">Rascunho</option>
                  <option value="scheduled">Agendado</option>
                </select>
              </div>
            </div>
            <div>
              <Label>Assunto</Label>
              <Input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} placeholder="Assunto do email" />
            </div>
            <div>
              <Label>Corpo do Email</Label>
              <textarea
                value={form.body}
                onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
                rows={6}
                placeholder="Escreva o conteúdo do email..."
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm resize-y"
              />
            </div>
            <div>
              <Label>Agendado para <span className="text-gray-400 font-normal">(opcional)</span></Label>
              <Input type="datetime-local" value={form.scheduledAt} onChange={e => setForm(f => ({ ...f, scheduledAt: e.target.value }))} />
            </div>
          </div>
          {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
          <div className="flex gap-2 mt-4">
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
              {editId ? 'Actualizar' : 'Criar Campanha'}
            </Button>
            <Button variant="outline" onClick={cancelForm}>Cancelar</Button>
          </div>
        </div>
      )}

      {campaigns.length === 0 ? (
        <p className="px-5 py-8 text-sm text-gray-400">Nenhuma campanha criada.</p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {campaigns.map((c) => (
            <li key={c.id} className="px-5 py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{c.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5 truncate">{c.subject}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {c.sentAt ? `Enviado: ${new Date(c.sentAt).toLocaleDateString('pt-AO')}` : c.scheduledAt ? `Agendado: ${new Date(c.scheduledAt).toLocaleDateString('pt-AO')}` : new Date(c.createdAt).toLocaleDateString('pt-AO')}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge variant={STATUS_VARIANTS[c.status]}>{STATUS_LABELS[c.status]}</Badge>
                  {c.recipientCount > 0 && <span className="text-xs text-gray-400">{c.recipientCount} dest.</span>}
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEdit(c)} className="p-1.5 rounded hover:bg-gray-100 text-gray-500" title="Editar">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    {c.status !== 'sent' && (
                      <button onClick={() => sendNow(c)} disabled={sendingId === c.id} className="p-1.5 rounded hover:bg-orange-50 text-orange-500" title="Enviar agora">
                        {sendingId === c.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                      </button>
                    )}
                    <button onClick={() => deleteCampaign(c.id)} disabled={deletingId === c.id} className="p-1.5 rounded hover:bg-red-50 text-red-400" title="Eliminar">
                      {deletingId === c.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
