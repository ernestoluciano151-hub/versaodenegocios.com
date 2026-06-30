'use client'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Loader2, Plus, Pencil, Power, X } from 'lucide-react'

type CouponType = 'percentage' | 'fixed'

interface Coupon {
  id: string
  code: string
  type: CouponType
  value: number
  minOrder: number | null
  maxUses: number | null
  usedCount: number
  active: boolean
  expiresAt: string | null
  createdAt: string
}

const emptyForm = {
  code: '',
  type: 'percentage' as CouponType,
  value: '',
  minOrder: '',
  maxUses: '',
  expiresAt: '',
  active: true,
}

export function CouponManager({ initialCoupons }: { initialCoupons: Coupon[] }) {
  const [coupons, setCoupons] = useState<Coupon[]>(initialCoupons)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  function openNew() {
    setForm(emptyForm)
    setEditId(null)
    setShowForm(true)
    setError(null)
  }

  function openEdit(c: Coupon) {
    setForm({
      code: c.code,
      type: c.type,
      value: String(c.value),
      minOrder: c.minOrder != null ? String(c.minOrder) : '',
      maxUses: c.maxUses != null ? String(c.maxUses) : '',
      expiresAt: c.expiresAt ? c.expiresAt.slice(0, 10) : '',
      active: c.active,
    })
    setEditId(c.id)
    setShowForm(true)
    setError(null)
  }

  function cancelForm() {
    setShowForm(false)
    setEditId(null)
    setError(null)
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      const payload = {
        code: form.code,
        type: form.type,
        value: Number(form.value),
        minOrder: form.minOrder !== '' ? form.minOrder : null,
        maxUses: form.maxUses !== '' ? form.maxUses : null,
        expiresAt: form.expiresAt || null,
        active: form.active,
      }
      let res: Response
      if (editId) {
        res = await fetch(`/api/admin/coupons/${editId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      } else {
        res = await fetch('/api/admin/coupons', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      }
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Erro ao guardar') }
      const saved: Coupon = await res.json()
      if (editId) {
        setCoupons(prev => prev.map(c => c.id === editId ? saved : c))
      } else {
        setCoupons(prev => [saved, ...prev])
      }
      cancelForm()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro desconhecido')
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(c: Coupon) {
    setTogglingId(c.id)
    try {
      const res = await fetch(`/api/admin/coupons/${c.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ active: !c.active }) })
      if (!res.ok) return
      const updated: Coupon = await res.json()
      setCoupons(prev => prev.map(x => x.id === c.id ? updated : x))
    } finally {
      setTogglingId(null)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">Cupões de Desconto</h2>
        <Button size="sm" onClick={openNew} className="gap-1">
          <Plus className="w-4 h-4" /> Novo Cupão
        </Button>
      </div>

      {showForm && (
        <div className="p-5 border-b border-gray-100 bg-gray-50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-gray-900">{editId ? 'Editar Cupão' : 'Novo Cupão'}</h3>
            <button onClick={cancelForm}><X className="w-4 h-4 text-gray-400" /></button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <Label>Código</Label>
              <Input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="DESCONTO20" className="uppercase" />
            </div>
            <div>
              <Label>Tipo</Label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as CouponType }))} className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm">
                <option value="percentage">Percentagem (%)</option>
                <option value="fixed">Valor Fixo (AOA)</option>
              </select>
            </div>
            <div>
              <Label>Valor {form.type === 'percentage' ? '(%)' : '(AOA)'}</Label>
              <Input type="number" value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))} min={0} />
            </div>
            <div>
              <Label>Pedido Mínimo (AOA) <span className="text-gray-400 font-normal">(opcional)</span></Label>
              <Input type="number" value={form.minOrder} onChange={e => setForm(f => ({ ...f, minOrder: e.target.value }))} min={0} />
            </div>
            <div>
              <Label>Máx. Utilizações <span className="text-gray-400 font-normal">(opcional)</span></Label>
              <Input type="number" value={form.maxUses} onChange={e => setForm(f => ({ ...f, maxUses: e.target.value }))} min={1} />
            </div>
            <div>
              <Label>Expira em <span className="text-gray-400 font-normal">(opcional)</span></Label>
              <Input type="date" value={form.expiresAt} onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))} />
            </div>
          </div>
          <div className="flex items-center gap-2 mt-3">
            <input type="checkbox" id="coupon-active" checked={form.active} onChange={e => setForm(f => ({ ...f, active: e.target.checked }))} className="rounded" />
            <Label htmlFor="coupon-active">Activo</Label>
          </div>
          {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
          <div className="flex gap-2 mt-4">
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
              {editId ? 'Actualizar' : 'Criar Cupão'}
            </Button>
            <Button variant="outline" onClick={cancelForm}>Cancelar</Button>
          </div>
        </div>
      )}

      {coupons.length === 0 ? (
        <p className="px-5 py-8 text-sm text-gray-400">Nenhum cupão criado.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100 bg-gray-50">
              <tr>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Código</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Desconto</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Usos</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Estado</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Expira</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Acções</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {coupons.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4 font-mono font-bold text-gray-900">{c.code}</td>
                  <td className="py-3 px-4">
                    {c.type === 'percentage' ? `${Number(c.value)}%` : `${Number(c.value).toLocaleString('pt-AO')} AOA`}
                  </td>
                  <td className="py-3 px-4 text-gray-600">{c.usedCount}{c.maxUses ? `/${c.maxUses}` : ''}</td>
                  <td className="py-3 px-4">
                    <Badge variant={c.active ? 'success' : 'secondary'}>{c.active ? 'Activo' : 'Inactivo'}</Badge>
                  </td>
                  <td className="py-3 px-4 text-xs text-gray-400">
                    {c.expiresAt ? new Date(c.expiresAt).toLocaleDateString('pt-AO') : '—'}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(c)} className="p-1.5 rounded hover:bg-gray-100 text-gray-500" title="Editar">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => toggleActive(c)} disabled={togglingId === c.id} className="p-1.5 rounded hover:bg-gray-100 text-gray-500" title={c.active ? 'Desactivar' : 'Activar'}>
                        {togglingId === c.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Power className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
