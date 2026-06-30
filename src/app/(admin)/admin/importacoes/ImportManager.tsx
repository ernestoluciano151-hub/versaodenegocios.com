'use client'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Loader2, Plus, Pencil, X } from 'lucide-react'

type ImportStatus = 'pending' | 'in_transit' | 'customs' | 'delivered' | 'cancelled'

interface Supplier { id: string; name: string; country: string }

interface Import {
  id: string
  supplierId: string
  reference: string
  totalCost: number
  shippingCost: number
  customsDuty: number
  otherCosts: number
  totalLanded: number
  status: ImportStatus
  estimatedArrival: string | null
  notes: string | null
  createdAt: string
  supplier: { name: string; country: string }
}

const STATUS_LABELS: Record<ImportStatus, string> = { pending: 'Pendente', in_transit: 'Em Trânsito', customs: 'Alfândega', delivered: 'Entregue', cancelled: 'Cancelado' }
const STATUS_VARIANTS: Record<ImportStatus, 'default' | 'secondary' | 'success' | 'warning' | 'destructive'> = { pending: 'secondary', in_transit: 'default', customs: 'warning', delivered: 'success', cancelled: 'destructive' }

const emptyForm = { supplierId: '', reference: '', totalCost: '', shippingCost: '', customsDuty: '', otherCosts: '', estimatedArrival: '', notes: '', status: 'pending' as ImportStatus }

function calcLanded(f: typeof emptyForm): string {
  const total = Number(f.totalCost || 0) + Number(f.shippingCost || 0) + Number(f.customsDuty || 0) + Number(f.otherCosts || 0)
  return total > 0 ? total.toLocaleString('pt-AO') : '—'
}

export function ImportManager({ initialImports, suppliers }: { initialImports: Import[]; suppliers: Supplier[] }) {
  const [imports, setImports] = useState<Import[]>(initialImports)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  function openNew() { setForm(emptyForm); setEditId(null); setShowForm(true); setError(null) }

  function openEdit(imp: Import) {
    setForm({
      supplierId: imp.supplierId,
      reference: imp.reference,
      totalCost: String(imp.totalCost),
      shippingCost: String(imp.shippingCost),
      customsDuty: String(imp.customsDuty),
      otherCosts: String(imp.otherCosts),
      estimatedArrival: imp.estimatedArrival ? imp.estimatedArrival.slice(0, 10) : '',
      notes: imp.notes ?? '',
      status: imp.status,
    })
    setEditId(imp.id); setShowForm(true); setError(null)
  }

  function cancelForm() { setShowForm(false); setEditId(null); setError(null) }

  async function handleSave() {
    setSaving(true); setError(null)
    try {
      const landed = Number(form.totalCost || 0) + Number(form.shippingCost || 0) + Number(form.customsDuty || 0) + Number(form.otherCosts || 0)
      const payload = {
        supplierId: form.supplierId,
        reference: form.reference,
        totalCost: Number(form.totalCost),
        shippingCost: Number(form.shippingCost || 0),
        customsDuty: Number(form.customsDuty || 0),
        otherCosts: Number(form.otherCosts || 0),
        totalLanded: landed,
        estimatedArrival: form.estimatedArrival || null,
        notes: form.notes || null,
        status: form.status,
      }
      let res: Response
      if (editId) {
        res = await fetch(`/api/admin/imports/${editId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      } else {
        res = await fetch('/api/admin/imports', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      }
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Erro ao guardar') }
      const saved: Import = await res.json()
      if (editId) { setImports(prev => prev.map(x => x.id === editId ? saved : x)) }
      else { setImports(prev => [saved, ...prev]) }
      cancelForm()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro desconhecido')
    } finally { setSaving(false) }
  }

  async function updateStatus(imp: Import, status: ImportStatus) {
    setUpdatingStatusId(imp.id)
    try {
      const res = await fetch(`/api/admin/imports/${imp.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) })
      if (!res.ok) return
      const updated: Import = await res.json()
      setImports(prev => prev.map(x => x.id === imp.id ? updated : x))
    } finally { setUpdatingStatusId(null) }
  }

  const fmt = (n: number) => Number(n).toLocaleString('pt-AO', { style: 'currency', currency: 'AOA', minimumFractionDigits: 0 })

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">Importações</h2>
        <Button size="sm" onClick={openNew} className="gap-1">
          <Plus className="w-4 h-4" /> Nova Importação
        </Button>
      </div>

      {showForm && (
        <div className="p-5 border-b border-gray-100 bg-gray-50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-gray-900">{editId ? 'Editar Importação' : 'Nova Importação'}</h3>
            <button onClick={cancelForm}><X className="w-4 h-4 text-gray-400" /></button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <Label>Fornecedor *</Label>
              <select value={form.supplierId} onChange={e => setForm(f => ({ ...f, supplierId: e.target.value }))} className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm">
                <option value="">Seleccionar fornecedor...</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name} ({s.country})</option>)}
              </select>
            </div>
            <div>
              <Label>Referência *</Label>
              <Input value={form.reference} onChange={e => setForm(f => ({ ...f, reference: e.target.value }))} placeholder="IMP-2026-001" />
            </div>
            <div>
              <Label>Estado</Label>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as ImportStatus }))} className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm">
                {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <Label>Custo Total (AOA)</Label>
              <Input type="number" value={form.totalCost} onChange={e => setForm(f => ({ ...f, totalCost: e.target.value }))} min={0} step="0.01" />
            </div>
            <div>
              <Label>Frete (AOA)</Label>
              <Input type="number" value={form.shippingCost} onChange={e => setForm(f => ({ ...f, shippingCost: e.target.value }))} min={0} step="0.01" />
            </div>
            <div>
              <Label>Alfândega (AOA)</Label>
              <Input type="number" value={form.customsDuty} onChange={e => setForm(f => ({ ...f, customsDuty: e.target.value }))} min={0} step="0.01" />
            </div>
            <div>
              <Label>Outros Custos (AOA)</Label>
              <Input type="number" value={form.otherCosts} onChange={e => setForm(f => ({ ...f, otherCosts: e.target.value }))} min={0} step="0.01" />
            </div>
            <div>
              <Label>Custo Final (auto)</Label>
              <div className="h-9 flex items-center px-3 bg-gray-100 rounded-md text-sm font-bold text-gray-700">{calcLanded(form)} AOA</div>
            </div>
            <div>
              <Label>Chegada Estimada</Label>
              <Input type="date" value={form.estimatedArrival} onChange={e => setForm(f => ({ ...f, estimatedArrival: e.target.value }))} />
            </div>
            <div className="col-span-2 md:col-span-3">
              <Label>Notas</Label>
              <Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Observações..." />
            </div>
          </div>
          {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
          <div className="flex gap-2 mt-4">
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
              {editId ? 'Actualizar' : 'Criar Importação'}
            </Button>
            <Button variant="outline" onClick={cancelForm}>Cancelar</Button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-200 bg-gray-50">
            <tr>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Referência</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Fornecedor</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Custo Total</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Custo Final</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Estado</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Chegada Est.</th>
              <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Acções</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {imports.map((imp) => (
              <tr key={imp.id} className="hover:bg-gray-50">
                <td className="py-3 px-4 font-mono text-xs font-medium text-gray-900">{imp.reference}</td>
                <td className="py-3 px-4">
                  <p className="font-medium">{imp.supplier.name}</p>
                  <p className="text-xs text-gray-400">{imp.supplier.country}</p>
                </td>
                <td className="py-3 px-4">{fmt(Number(imp.totalCost))}</td>
                <td className="py-3 px-4 font-bold">{fmt(Number(imp.totalLanded))}</td>
                <td className="py-3 px-4">
                  <select
                    value={imp.status}
                    onChange={e => updateStatus(imp, e.target.value as ImportStatus)}
                    disabled={updatingStatusId === imp.id}
                    className="text-xs rounded border border-gray-200 px-2 py-1 bg-white"
                  >
                    {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </td>
                <td className="py-3 px-4 text-xs text-gray-400">{imp.estimatedArrival ? new Date(imp.estimatedArrival).toLocaleDateString('pt-AO') : '—'}</td>
                <td className="py-3 px-4 text-right">
                  <button onClick={() => openEdit(imp)} className="p-1.5 rounded hover:bg-gray-100 text-gray-500" title="Editar">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {imports.length === 0 && (
          <div className="text-center py-12 text-gray-500">Nenhuma importação encontrada.</div>
        )}
      </div>
    </div>
  )
}
