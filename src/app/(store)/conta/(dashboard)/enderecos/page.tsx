'use client'
import { useEffect, useState } from 'react'
import { MapPin, Plus, Trash2, Pencil, Star, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'

const PROVINCES = [
  'Luanda','Benguela','Huambo','Bié','Moxico','Lunda Norte','Lunda Sul','Malanje',
  'Uíge','Zaire','Cabinda','Cuando Cubango','Cunene','Huíla','Namibe','Kwanza Norte',
  'Kwanza Sul','Bengo',
]

interface Address {
  id: string; label: string; street: string; city: string; province: string
  municipality: string | null; district: string | null; reference: string | null
  isDefault: boolean; country: string
}

const EMPTY_FORM = { label: 'Casa', street: '', city: '', province: 'Luanda', municipality: '', district: '', reference: '', isDefault: false }

export default function ContaEnderecosPage() {
  const [addresses, setAddresses] = useState<Address[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Address | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)

  async function load() {
    const res = await fetch('/api/conta/addresses')
    if (res.ok) setAddresses(await res.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function startNew() { setForm(EMPTY_FORM); setEditing(null); setShowForm(true) }
  function startEdit(a: Address) {
    setForm({ label: a.label, street: a.street, city: a.city, province: a.province, municipality: a.municipality ?? '', district: a.district ?? '', reference: a.reference ?? '', isDefault: a.isDefault })
    setEditing(a); setShowForm(true)
  }

  async function handleSave() {
    setSaving(true)
    const body = { ...form, city: form.municipality || form.city }
    if (editing) {
      await fetch(`/api/conta/addresses/${editing.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    } else {
      await fetch('/api/conta/addresses', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    }
    await load(); setShowForm(false); setSaving(false)
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Eliminar endereço?')) return
    await fetch(`/api/conta/addresses/${id}`, { method: 'DELETE' })
    setAddresses(prev => prev.filter(a => a.id !== id))
  }

  async function setDefault(id: string) {
    await fetch(`/api/conta/addresses/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isDefault: true }) })
    await load()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Endereços</h1>
          <p className="text-gray-500 text-sm mt-1">{addresses.length} endereço{addresses.length !== 1 ? 's' : ''} guardado{addresses.length !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={startNew} className="bg-orange-500 hover:bg-orange-600 gap-2">
          <Plus className="w-4 h-4" /> Novo endereço
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-orange-300 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">{editing ? 'Editar endereço' : 'Novo endereço'}</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Etiqueta</Label>
              <Input value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <Label>Província</Label>
              <select value={form.province} onChange={e => setForm(f => ({ ...f, province: e.target.value }))} className="w-full h-9 px-3 text-sm border border-gray-300 rounded-md mt-1 focus:outline-none focus:ring-2 focus:ring-orange-500">
                {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <Label>Município</Label>
              <Input value={form.municipality} onChange={e => setForm(f => ({ ...f, municipality: e.target.value }))} placeholder="Ex: Talatona" className="mt-1" />
            </div>
            <div>
              <Label>Bairro</Label>
              <Input value={form.district} onChange={e => setForm(f => ({ ...f, district: e.target.value }))} placeholder="Ex: Camama" className="mt-1" />
            </div>
            <div className="col-span-2">
              <Label>Rua / Endereço</Label>
              <Input value={form.street} onChange={e => setForm(f => ({ ...f, street: e.target.value }))} placeholder="Ex: Rua das Acácias, nº 42" className="mt-1" required />
            </div>
            <div className="col-span-2">
              <Label>Referência / Ponto de referência</Label>
              <Input value={form.reference} onChange={e => setForm(f => ({ ...f, reference: e.target.value }))} placeholder="Ex: Perto do Shopping" className="mt-1" />
            </div>
            <div className="col-span-2 flex items-center gap-2">
              <input type="checkbox" id="isDefault" checked={form.isDefault} onChange={e => setForm(f => ({ ...f, isDefault: e.target.checked }))} className="w-4 h-4 accent-orange-500" />
              <Label htmlFor="isDefault" className="cursor-pointer">Definir como endereço principal</Label>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <Button onClick={handleSave} disabled={saving || !form.street} className="bg-orange-500 hover:bg-orange-600">
              {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {editing ? 'Guardar alterações' : 'Adicionar endereço'}
            </Button>
            <Button variant="ghost" onClick={() => setShowForm(false)}>Cancelar</Button>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-orange-500" /></div>
      ) : addresses.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 py-16 text-center">
          <MapPin className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Nenhum endereço guardado</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {addresses.map((a) => (
            <div key={a.id} className={`bg-white rounded-xl border p-4 ${a.isDefault ? 'border-orange-300' : 'border-gray-200'}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-gray-900">{a.label}</p>
                      {a.isDefault && <Badge variant="success" className="text-xs">Principal</Badge>}
                    </div>
                    <p className="text-sm text-gray-600">{a.street}</p>
                    <p className="text-sm text-gray-500">{[a.district, a.municipality ?? a.city, a.province].filter(Boolean).join(', ')}</p>
                    {a.reference && <p className="text-xs text-gray-400 mt-0.5">Ref: {a.reference}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {!a.isDefault && (
                    <button onClick={() => setDefault(a.id)} className="p-1.5 rounded-lg hover:bg-orange-50 text-gray-400 hover:text-orange-500" title="Definir como principal">
                      <Star className="w-4 h-4" />
                    </button>
                  )}
                  <button onClick={() => startEdit(a)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(a.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
