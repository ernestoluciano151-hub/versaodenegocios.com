'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Loader2, Save, Trash2, Plus } from 'lucide-react'
import { ImageUpload } from '@/components/admin/ImageUpload'

interface Props {
  product: {
    id: string
    name: string
    slug: string
    brand: string
    categoryId: string
    description: string
    technicalSpecs: Record<string, string>
    originCountry: string
    images: string[]
    warranty: string
    price: number
    salePrice?: number
    sku: string
    internalCode: string
    stock: number
    minStock: number
    active: boolean
    featured: boolean
    isNew: boolean
    isBestseller: boolean
    weight?: number
  }
  categories: { id: string; name: string }[]
}

export function ProductEditForm({ product, categories }: Props) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState(product)
  const [specsText, setSpecsText] = useState(
    Object.entries(product.technicalSpecs).map(([k, v]) => `${k}: ${v}`).join('\n')
  )

  function parseSpecs(text: string): Record<string, string> {
    const result: Record<string, string> = {}
    text.split('\n').forEach(line => {
      const idx = line.indexOf(':')
      if (idx > 0) {
        const key = line.slice(0, idx).trim()
        const val = line.slice(idx + 1).trim()
        if (key && val) result[key] = val
      }
    })
    return result
  }

  async function handleSave() {
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, technicalSpecs: parseSpecs(specsText) }),
      })
      if (!res.ok) throw new Error('Erro ao guardar')
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro desconhecido')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!window.confirm('Eliminar produto permanentemente?')) return
    setDeleting(true)
    try {
      await fetch(`/api/products/${product.id}`, { method: 'DELETE' })
      router.push('/admin/produtos')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-4">
      {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Label>Nome</Label>
          <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
        </div>
        <div>
          <Label>Marca</Label>
          <Input value={form.brand} onChange={e => setForm(f => ({ ...f, brand: e.target.value }))} />
        </div>
        <div>
          <Label>Categoria</Label>
          <select
            value={form.categoryId}
            onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))}
            className="w-full h-9 px-3 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <Label>SKU</Label>
          <Input value={form.sku} onChange={e => setForm(f => ({ ...f, sku: e.target.value }))} />
        </div>
        <div>
          <Label>Código Interno</Label>
          <Input value={form.internalCode} onChange={e => setForm(f => ({ ...f, internalCode: e.target.value }))} />
        </div>
        <div>
          <Label>Preço (AOA)</Label>
          <Input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))} />
        </div>
        <div>
          <Label>Preço Promoção (AOA)</Label>
          <Input type="number" value={form.salePrice ?? ''} onChange={e => setForm(f => ({ ...f, salePrice: e.target.value ? Number(e.target.value) : undefined }))} placeholder="Sem promoção" />
        </div>
        <div>
          <Label>Stock</Label>
          <Input type="number" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: Number(e.target.value) }))} />
        </div>
        <div>
          <Label>Stock Mínimo</Label>
          <Input type="number" value={form.minStock} onChange={e => setForm(f => ({ ...f, minStock: Number(e.target.value) }))} />
        </div>
        <div>
          <Label>País de Origem</Label>
          <Input value={form.originCountry} onChange={e => setForm(f => ({ ...f, originCountry: e.target.value }))} />
        </div>
        <div>
          <Label>Garantia</Label>
          <Input value={form.warranty} onChange={e => setForm(f => ({ ...f, warranty: e.target.value }))} />
        </div>
        <div className="col-span-2">
          <Label>Descrição</Label>
          <textarea
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            rows={4}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 resize-y"
          />
        </div>
        <div className="col-span-2">
          <Label>Especificações Técnicas (uma por linha: Chave: Valor)</Label>
          <textarea
            value={specsText}
            onChange={e => setSpecsText(e.target.value)}
            rows={5}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 resize-y font-mono"
          />
        </div>
        <div className="col-span-2">
          <div className="flex items-center justify-between mb-2">
            <Label>Imagens</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1 h-7 text-xs"
              onClick={() => setForm(f => ({ ...f, images: [...f.images, ''] }))}
            >
              <Plus className="w-3 h-3" /> Adicionar
            </Button>
          </div>
          <div className="space-y-2">
            {(form.images.length > 0 ? form.images : ['']).map((img, i) => (
              <ImageUpload
                key={i}
                index={i}
                value={img}
                onChange={(url) => setForm(f => ({
                  ...f,
                  images: f.images.map((im, idx) => idx === i ? url : im)
                }))}
                onRemove={() => setForm(f => ({ ...f, images: f.images.filter((_, idx) => idx !== i) }))}
                showRemove={form.images.length > 1}
                placeholder={i === 0 ? 'URL da imagem principal...' : 'URL da imagem...'}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
        {([
          ['active', 'Activo'],
          ['featured', 'Destaque'],
          ['isNew', 'Novo'],
          ['isBestseller', 'Mais Vendido'],
        ] as const).map(([key, label]) => (
          <div key={key} className="flex items-center gap-2">
            <Switch checked={form[key]} onCheckedChange={v => setForm(f => ({ ...f, [key]: v }))} />
            <Label className="cursor-pointer">{label}</Label>
          </div>
        ))}
      </div>

      <div className="flex gap-3 pt-2">
        <Button onClick={handleSave} disabled={saving} className="bg-orange-500 hover:bg-orange-600">
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          Guardar
        </Button>
        <Button onClick={handleDelete} disabled={deleting} variant="destructive" size="sm">
          {deleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
          Eliminar
        </Button>
      </div>
    </div>
  )
}
