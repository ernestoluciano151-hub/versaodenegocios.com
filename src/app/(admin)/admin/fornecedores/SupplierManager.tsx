'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Loader2, Plus, Pencil, Power, Trash2, Globe, Mail, Phone, X } from 'lucide-react'

interface Supplier {
  id: string
  name: string
  country: string
  contact: string | null
  email: string | null
  phone: string | null
  website: string | null
  notes: string | null
  active: boolean
  createdAt: string
  _count: { imports: number }
}

const emptyForm = { name: '', country: '', contact: '', email: '', phone: '', website: '', notes: '', active: true }

export function SupplierManager({ initialSuppliers }: { initialSuppliers: Supplier[] }) {
  const [suppliers, setSuppliers] = useState<Supplier[]>(initialSuppliers)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  function openNew() { setForm(emptyForm); setEditId(null); setShowForm(true); setError(null) }

  function openEdit(s: Supplier) {
    setForm({ name: s.name, country: s.country, contact: s.contact ?? '', email: s.email ?? '', phone: s.phone ?? '', website: s.website ?? '', notes: s.notes ?? '', active: s.active })
    setEditId(s.id); setShowForm(true); setError(null)
  }

  function cancelForm() { setShowForm(false); setEditId(null); setError(null) }

  async function handleSave() {
    setSaving(true); setError(null)
    try {
      const payload = { ...form }
      let res: Response
      if (editId) {
        res = await fetch(`/api/admin/suppliers/${editId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      } else {
        res = await fetch('/api/admin/suppliers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      }
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Erro ao guardar') }
      const saved = await res.json()
      if (editId) {
        setSuppliers(prev => prev.map(s => s.id === editId ? { ...saved, _count: s._count } : s))
      } else {
        setSuppliers(prev => [...prev, { ...saved, _count: { imports: 0 } }].sort((a, b) => a.name.localeCompare(b.name)))
      }
      cancelForm()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro desconhecido')
    } finally { setSaving(false) }
  }

  async function toggleActive(s: Supplier) {
    setTogglingId(s.id)
    try {
      const res = await fetch(`/api/admin/suppliers/${s.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ active: !s.active }) })
      if (!res.ok) return
      const updated = await res.json()
      setSuppliers(prev => prev.map(x => x.id === s.id ? { ...updated, _count: s._count } : x))
    } finally { setTogglingId(null) }
  }

  async function deleteSupplier(s: Supplier) {
    if (!confirm(`Tem a certeza que quer eliminar "${s.name}"? Esta acção é irreversível.`)) return
    setDeletingId(s.id)
    try {
      await fetch(`/api/admin/suppliers/${s.id}`, { method: 'DELETE' })
      setSuppliers(prev => prev.filter(x => x.id !== s.id))
    } finally { setDeletingId(null) }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">Fornecedores</h2>
        <Button size="sm" onClick={openNew} className="gap-1">
          <Plus className="w-4 h-4" /> Novo Fornecedor
        </Button>
      </div>

      {showForm && (
        <div className="p-5 border-b border-gray-100 bg-gray-50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-gray-900">{editId ? 'Editar Fornecedor' : 'Novo Fornecedor'}</h3>
            <button onClick={cancelForm}><X className="w-4 h-4 text-gray-400" /></button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <Label>Nome *</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Nome do fornecedor" />
            </div>
            <div>
              <Label>País *</Label>
              <Input value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))} placeholder="China" />
            </div>
            <div>
              <Label>Contacto</Label>
              <Input value={form.contact} onChange={e => setForm(f => ({ ...f, contact: e.target.value }))} placeholder="Nome do responsável" />
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@fornecedor.com" />
            </div>
            <div>
              <Label>Telefone</Label>
              <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+86 123 456 7890" />
            </div>
            <div>
              <Label>Website</Label>
              <Input value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))} placeholder="https://fornecedor.com" />
            </div>
            <div className="col-span-2 md:col-span-3">
              <Label>Notas</Label>
              <Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Observações adicionais..." />
            </div>
          </div>
          <div className="flex items-center gap-2 mt-3">
            <input type="checkbox" id="supplier-active" checked={form.active} onChange={e => setForm(f => ({ ...f, active: e.target.checked }))} className="rounded" />
            <Label htmlFor="supplier-active">Activo</Label>
          </div>
          {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
          <div className="flex gap-2 mt-4">
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
              {editId ? 'Actualizar' : 'Criar Fornecedor'}
            </Button>
            <Button variant="outline" onClick={cancelForm}>Cancelar</Button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-200 bg-gray-50">
            <tr>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Fornecedor</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">País</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Contacto</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Importações</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Estado</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Desde</th>
              <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Acções</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {suppliers.map((s) => (
              <tr key={s.id} className="hover:bg-gray-50">
                <td className="py-3 px-4">
                  <p className="font-medium text-gray-900">{s.name}</p>
                  {s.website && <a href={s.website} target="_blank" rel="noopener noreferrer" className="text-xs text-orange-500 hover:underline">{s.website}</a>}
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-1 text-gray-600"><Globe className="w-3 h-3" />{s.country}</div>
                </td>
                <td className="py-3 px-4">
                  <div className="space-y-0.5">
                    {s.email && <div className="flex items-center gap-1 text-xs text-gray-500"><Mail className="w-3 h-3" />{s.email}</div>}
                    {s.phone && <div className="flex items-center gap-1 text-xs text-gray-500"><Phone className="w-3 h-3" />{s.phone}</div>}
                  </div>
                </td>
                <td className="py-3 px-4 font-medium">{s._count.imports}</td>
                <td className="py-3 px-4">
                  <Badge variant={s.active ? 'success' : 'secondary'}>{s.active ? 'Activo' : 'Inactivo'}</Badge>
                </td>
                <td className="py-3 px-4 text-xs text-gray-400">{new Date(s.createdAt).toLocaleDateString('pt-AO')}</td>
                <td className="py-3 px-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => openEdit(s)} className="p-1.5 rounded hover:bg-gray-100 text-gray-500" title="Editar">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => toggleActive(s)} disabled={togglingId === s.id} className="p-1.5 rounded hover:bg-gray-100 text-gray-500" title={s.active ? 'Desactivar' : 'Activar'}>
                      {togglingId === s.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Power className="w-3.5 h-3.5" />}
                    </button>
                    <button onClick={() => deleteSupplier(s)} disabled={deletingId === s.id} className="p-1.5 rounded hover:bg-red-50 text-red-400" title="Eliminar">
                      {deletingId === s.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {suppliers.length === 0 && (
          <div className="text-center py-12 text-gray-500">Nenhum fornecedor registado.</div>
        )}
      </div>
    </div>
  )
}
