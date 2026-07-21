'use client'

import { useEffect, useState, useCallback } from 'react'
import { Plus, Trash2, Save, ChevronUp, ChevronDown, Loader2, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Variant {
  id: string
  productId: string
  name: string
  sku: string
  barcode?: string
  price: number
  comparePrice?: number
  purchasePrice?: number
  stock: number
  minStock: number
  imageUrl?: string
  weight?: number
  position: number
  isActive: boolean
  attributes: Record<string, string>
}

const EMPTY_VARIANT: Omit<Variant, 'id' | 'productId' | 'position'> = {
  name: '', sku: '', barcode: '', price: 0, comparePrice: undefined,
  purchasePrice: undefined, stock: 0, minStock: 0, imageUrl: '',
  weight: undefined, isActive: true, attributes: {},
}

function fmt(n: number) {
  return new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA', maximumFractionDigits: 0 }).format(n)
}

function VariantRow({
  variant, productId, onSave, onDelete, onMove,
}: {
  variant: Variant
  productId: string
  onSave: (v: Variant) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onMove: (id: string, dir: 'up' | 'down') => void
}) {
  const [editing, setEditing] = useState(false)
  const [form, setForm]     = useState(variant)
  const [saving, setSaving] = useState(false)

  function set(field: string, val: unknown) {
    setForm(f => ({ ...f, [field]: val }))
  }

  async function handleSave() {
    setSaving(true)
    await onSave(form)
    setSaving(false)
    setEditing(false)
  }

  const margin = form.purchasePrice && form.price
    ? (((Number(form.price) - Number(form.purchasePrice)) / Number(form.price)) * 100).toFixed(0)
    : null

  if (!editing) {
    return (
      <tr className="group hover:bg-gray-50 transition-colors">
        <td className="py-2 px-3">
          <div className="flex flex-col gap-0.5">
            <button onClick={() => onMove(variant.id, 'up')} className="text-gray-300 hover:text-gray-500 leading-none">
              <ChevronUp className="w-3 h-3" />
            </button>
            <button onClick={() => onMove(variant.id, 'down')} className="text-gray-300 hover:text-gray-500 leading-none">
              <ChevronDown className="w-3 h-3" />
            </button>
          </div>
        </td>
        <td className="py-2 px-3">
          <p className="font-medium text-gray-900 text-sm">{variant.name}</p>
          <p className="text-xs font-mono text-gray-400">{variant.sku}</p>
        </td>
        <td className="py-2 px-3 text-sm">
          <p className="font-semibold text-gray-900">{fmt(Number(variant.price))}</p>
          {margin && <p className="text-xs text-emerald-600">M: {margin}%</p>}
        </td>
        <td className="py-2 px-3 text-sm">
          <span className={`font-semibold ${variant.stock === 0 ? 'text-red-600' : variant.stock <= variant.minStock ? 'text-orange-500' : 'text-gray-900'}`}>
            {variant.stock}
          </span>
        </td>
        <td className="py-2 px-3">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${variant.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
            {variant.isActive ? 'Activo' : 'Inactivo'}
          </span>
        </td>
        <td className="py-2 px-3">
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => setEditing(true)}
              className="text-xs px-2 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-600">
              Editar
            </button>
            <button onClick={() => onDelete(variant.id)}
              className="p-1 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-lg">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </td>
      </tr>
    )
  }

  // Edit mode row
  return (
    <tr className="bg-blue-50/40 border-l-2 border-l-blue-400">
      <td className="py-3 px-3" />
      <td className="py-3 px-3" colSpan={5}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Nome da variante *</label>
            <input value={form.name} onChange={e => set('name', e.target.value)}
              placeholder="ex: Azul / 256 GB"
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-400" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">SKU *</label>
            <input value={form.sku} onChange={e => set('sku', e.target.value)}
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-400 font-mono" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Código de barras</label>
            <input value={form.barcode ?? ''} onChange={e => set('barcode', e.target.value)}
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-400 font-mono" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Preço de venda (AOA)</label>
            <input type="number" value={form.price} onChange={e => set('price', Number(e.target.value))}
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-400" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Preço riscado (AOA)</label>
            <input type="number" value={form.comparePrice ?? ''} onChange={e => set('comparePrice', e.target.value ? Number(e.target.value) : undefined)}
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-400" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Preço de custo (AOA)</label>
            <input type="number" value={form.purchasePrice ?? ''} onChange={e => set('purchasePrice', e.target.value ? Number(e.target.value) : undefined)}
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-400" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Stock</label>
            <input type="number" value={form.stock} onChange={e => set('stock', Number(e.target.value))}
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-400" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Stock mínimo</label>
            <input type="number" value={form.minStock} onChange={e => set('minStock', Number(e.target.value))}
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-400" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs text-gray-500 mb-1">URL da imagem desta variante</label>
            <input value={form.imageUrl ?? ''} onChange={e => set('imageUrl', e.target.value)}
              placeholder="https://..."
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-400" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Peso (kg)</label>
            <input type="number" step="0.001" value={form.weight ?? ''} onChange={e => set('weight', e.target.value ? Number(e.target.value) : undefined)}
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-400" />
          </div>
          <div className="flex items-end gap-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isActive} onChange={e => set('isActive', e.target.checked)}
                className="w-4 h-4 accent-orange-500" />
              <span className="text-sm text-gray-700">Activo</span>
            </label>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleSave} disabled={saving || !form.name || !form.sku}
            className="flex items-center gap-1.5 text-sm px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Guardar variante
          </button>
          <button onClick={() => { setEditing(false); setForm(variant) }}
            className="text-sm px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-600">
            Cancelar
          </button>
        </div>
      </td>
    </tr>
  )
}

// ── New Variant Form ──────────────────────────────────────────────────────────

function NewVariantForm({ productId, onCreated }: { productId: string; onCreated: () => void }) {
  const [open, setOpen]   = useState(false)
  const [form, setForm]   = useState({ ...EMPTY_VARIANT })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function set(field: string, val: unknown) { setForm(f => ({ ...f, [field]: val })) }

  async function handleCreate() {
    if (!form.name || !form.sku || form.price === 0) {
      setError('Nome, SKU e Preço são obrigatórios')
      return
    }
    setSaving(true)
    setError('')
    const res = await fetch(`/api/admin/products/${productId}/variants`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (!res.ok) {
      const d = await res.json()
      setError(d.error ?? 'Erro ao criar variante')
    } else {
      setForm({ ...EMPTY_VARIANT })
      setOpen(false)
      onCreated()
    }
    setSaving(false)
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)}
        className="flex items-center gap-2 text-sm text-orange-600 hover:text-orange-700 font-medium py-2 px-3 border-2 border-dashed border-orange-200 rounded-xl hover:border-orange-400 w-full justify-center transition-colors">
        <Plus className="w-4 h-4" /> Adicionar variante
      </button>
    )
  }

  return (
    <div className="border-2 border-orange-200 rounded-xl p-4 bg-orange-50/30">
      <h4 className="text-sm font-semibold text-gray-700 mb-3">Nova variante</h4>
      {error && <p className="text-sm text-red-600 mb-3 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Nome *</label>
          <input value={form.name} onChange={e => set('name', e.target.value)}
            placeholder="ex: Azul / 256 GB"
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-400" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">SKU *</label>
          <input value={form.sku} onChange={e => set('sku', e.target.value)}
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-400 font-mono" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Código de barras</label>
          <input value={form.barcode ?? ''} onChange={e => set('barcode', e.target.value)}
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-400 font-mono" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Preço (AOA) *</label>
          <input type="number" value={form.price} onChange={e => set('price', Number(e.target.value))}
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-400" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Preço de custo</label>
          <input type="number" value={form.purchasePrice ?? ''} onChange={e => set('purchasePrice', e.target.value ? Number(e.target.value) : undefined)}
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-400" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Stock</label>
          <input type="number" value={form.stock} onChange={e => set('stock', Number(e.target.value))}
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-400" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Stock mínimo</label>
          <input type="number" value={form.minStock} onChange={e => set('minStock', Number(e.target.value))}
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-400" />
        </div>
        <div className="flex items-end">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.isActive} onChange={e => set('isActive', e.target.checked)}
              className="w-4 h-4 accent-orange-500" />
            <span className="text-sm text-gray-700">Activo</span>
          </label>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={handleCreate} disabled={saving}
          className="flex items-center gap-1.5 text-sm px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Criar variante
        </button>
        <button onClick={() => { setOpen(false); setError('') }}
          className="text-sm px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-600">
          Cancelar
        </button>
      </div>
    </div>
  )
}

// ── Main VariantsTab ──────────────────────────────────────────────────────────

export function VariantsTab({ productId }: { productId: string }) {
  const [variants, setVariants]   = useState<Variant[]>([])
  const [loading, setLoading]     = useState(true)

  const fetchVariants = useCallback(() => {
    setLoading(true)
    fetch(`/api/admin/products/${productId}/variants`)
      .then(r => r.json())
      .then(d => { setVariants(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [productId])

  useEffect(() => { fetchVariants() }, [fetchVariants])

  const handleSave = async (v: Variant) => {
    await fetch(`/api/admin/products/${productId}/variants/${v.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(v),
    })
    fetchVariants()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Eliminar esta variante?')) return
    await fetch(`/api/admin/products/${productId}/variants/${id}`, { method: 'DELETE' })
    fetchVariants()
  }

  const handleMove = (id: string, dir: 'up' | 'down') => {
    const idx = variants.findIndex(v => v.id === id)
    if (dir === 'up' && idx === 0) return
    if (dir === 'down' && idx === variants.length - 1) return
    const newOrder = [...variants]
    const swap = dir === 'up' ? idx - 1 : idx + 1
    ;[newOrder[idx], newOrder[swap]] = [newOrder[swap], newOrder[idx]]
    const updated = newOrder.map((v, i) => ({ ...v, position: i }))
    setVariants(updated)
    fetch(`/api/admin/products/${productId}/variants`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated.map(v => ({ id: v.id, position: v.position }))),
    })
  }

  const totalStock = variants.reduce((s, v) => s + v.stock, 0)
  const hasVariants = variants.length > 0

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-700">Variantes do produto</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            {hasVariants
              ? `${variants.length} variante${variants.length !== 1 ? 's' : ''} · ${totalStock} un. em stock total`
              : 'Sem variantes. Adicione variantes para cor, capacidade, tamanho, etc.'}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="py-8 text-center">
          <div className="inline-block w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {hasVariants && (
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="py-2 px-3 w-8" />
                    <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Variante / SKU</th>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Preço</th>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Stock</th>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Estado</th>
                    <th className="py-2 px-3 w-24" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {variants.map(v => (
                    <VariantRow
                      key={v.id}
                      variant={v}
                      productId={productId}
                      onSave={handleSave}
                      onDelete={handleDelete}
                      onMove={handleMove}
                    />
                  ))}
                </tbody>
              </table>

              {/* Summary footer */}
              <div className="bg-gray-50 border-t border-gray-200 px-3 py-2 flex items-center gap-4 text-xs text-gray-500">
                <Package className="w-3.5 h-3.5" />
                <span>Stock total: <strong className="text-gray-700">{totalStock} un.</strong></span>
                <span>Variantes activas: <strong className="text-gray-700">{variants.filter(v => v.isActive).length}</strong></span>
              </div>
            </div>
          )}

          <NewVariantForm productId={productId} onCreated={fetchVariants} />
        </>
      )}
    </div>
  )
}
