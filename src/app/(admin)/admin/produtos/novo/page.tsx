'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { TopBar } from '@/components/admin/TopBar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { ArrowLeft, Plus, RefreshCw, Upload, Trash2 } from 'lucide-react'
import { ImageUpload } from '@/components/admin/ImageUpload'

interface Category {
  id: string
  name: string
  slug: string
}

function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export default function NovoProdutoPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [categories, setCategories] = useState<Category[]>([])
  const [categoriesLoaded, setCategoriesLoaded] = useState(false)

  const [form, setForm] = useState({
    name: '',
    brand: '',
    sku: '',
    categoryId: '',
    originCountry: 'Angola',
    description: '',
    warranty: '',
    price: '',
    salePrice: '',
    stock: '',
    minStock: '',
    weight: '',
    active: true,
    featured: false,
    isNew: false,
    isBestseller: false,
  })

  const [images, setImages] = useState<string[]>([''])
  const [specs, setSpecs] = useState<{ key: string; value: string }[]>([{ key: '', value: '' }])

  const loadCategories = useCallback(async () => {
    if (categoriesLoaded) return
    try {
      const res = await fetch('/api/admin/categories?limit=100&status=all')
      const data = await res.json()
      setCategories(data.categories ?? data)
      setCategoriesLoaded(true)
    } catch {
      // ignore
    }
  }, [categoriesLoaded])

  const generateSku = () => {
    if (!form.name) return
    const slug = slugify(form.name).replace(/-/g, '').toUpperCase().slice(0, 8)
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase()
    setForm((f) => ({ ...f, sku: `${slug}-${rand}` }))
  }

  const setField = (field: string, value: string | boolean) => {
    setForm((f) => ({ ...f, [field]: value }))
  }

  const addImage = () => setImages((imgs) => [...imgs, ''])
  const removeImage = (i: number) => setImages((imgs) => imgs.filter((_, idx) => idx !== i))
  const setImage = (i: number, val: string) => setImages((imgs) => imgs.map((img, idx) => idx === i ? val : img))

  const addSpec = () => setSpecs((s) => [...s, { key: '', value: '' }])
  const removeSpec = (i: number) => setSpecs((s) => s.filter((_, idx) => idx !== i))
  const setSpec = (i: number, field: 'key' | 'value', val: string) =>
    setSpecs((s) => s.map((sp, idx) => idx === i ? { ...sp, [field]: val } : sp))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const technicalSpecs: Record<string, string> = {}
      specs.forEach(({ key, value }) => {
        if (key.trim()) technicalSpecs[key.trim()] = value.trim()
      })

      const body = {
        name: form.name,
        brand: form.brand,
        sku: form.sku,
        categoryId: form.categoryId,
        originCountry: form.originCountry,
        description: form.description,
        warranty: form.warranty || null,
        price: parseFloat(form.price),
        salePrice: form.salePrice ? parseFloat(form.salePrice) : null,
        stock: parseInt(form.stock) || 0,
        minStock: parseInt(form.minStock) || 0,
        weight: form.weight ? parseFloat(form.weight) : null,
        active: form.active,
        featured: form.featured,
        isNew: form.isNew,
        isBestseller: form.isBestseller,
        images: images.filter((img) => img.trim()),
        technicalSpecs,
      }

      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Erro ao criar produto')
      }

      const product = await res.json()
      router.push(`/admin/produtos/${product.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar produto')
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TopBar
        title="Novo Produto"
        actions={
          <Link href="/admin/produtos">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </Button>
          </Link>
        }
      />

      <div className="flex-1 overflow-y-auto p-6">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Informação Básica */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wide">Informação Básica</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="name">Nome do Produto *</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setField('name', e.target.value)}
                  placeholder="Ex: Samsung Galaxy S24 Ultra"
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="brand">Marca *</Label>
                <Input
                  id="brand"
                  value={form.brand}
                  onChange={(e) => setField('brand', e.target.value)}
                  placeholder="Ex: Samsung"
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="sku">SKU *</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="sku"
                    value={form.sku}
                    onChange={(e) => setField('sku', e.target.value)}
                    placeholder="Ex: SAM-S24U-ABC1"
                    required
                  />
                  <Button type="button" variant="outline" size="sm" onClick={generateSku} title="Gerar SKU">
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="categoryId">Categoria *</Label>
                <select
                  id="categoryId"
                  value={form.categoryId}
                  onChange={(e) => setField('categoryId', e.target.value)}
                  onFocus={loadCategories}
                  required
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                >
                  <option value="">Seleccionar categoria...</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="originCountry">País de Origem</Label>
                <Input
                  id="originCountry"
                  value={form.originCountry}
                  onChange={(e) => setField('originCountry', e.target.value)}
                  placeholder="Angola"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="warranty">Garantia</Label>
                <Input
                  id="warranty"
                  value={form.warranty}
                  onChange={(e) => setField('warranty', e.target.value)}
                  placeholder="Ex: 12 meses"
                  className="mt-1"
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="description">Descrição</Label>
                <textarea
                  id="description"
                  value={form.description}
                  onChange={(e) => setField('description', e.target.value)}
                  placeholder="Descreva o produto..."
                  rows={4}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                />
              </div>
            </div>
          </div>

          {/* Preço e Stock */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wide">Preço e Stock</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="price">Preço (AOA) *</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={(e) => setField('price', e.target.value)}
                  placeholder="0.00"
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="salePrice">Preço Promocional (AOA)</Label>
                <Input
                  id="salePrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.salePrice}
                  onChange={(e) => setField('salePrice', e.target.value)}
                  placeholder="0.00"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="weight">Peso (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.weight}
                  onChange={(e) => setField('weight', e.target.value)}
                  placeholder="0.00"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="stock">Stock *</Label>
                <Input
                  id="stock"
                  type="number"
                  min="0"
                  value={form.stock}
                  onChange={(e) => setField('stock', e.target.value)}
                  placeholder="0"
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="minStock">Stock Mínimo</Label>
                <Input
                  id="minStock"
                  type="number"
                  min="0"
                  value={form.minStock}
                  onChange={(e) => setField('minStock', e.target.value)}
                  placeholder="0"
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          {/* Estado */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wide">Estado e Visibilidade</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {(
                [
                  { field: 'active', label: 'Activo' },
                  { field: 'featured', label: 'Destaque' },
                  { field: 'isNew', label: 'Novidade' },
                  { field: 'isBestseller', label: 'Mais Vendido' },
                ] as const
              ).map(({ field, label }) => (
                <div key={field} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <Label htmlFor={field} className="cursor-pointer">{label}</Label>
                  <Switch
                    id={field}
                    checked={form[field]}
                    onCheckedChange={(v) => setField(field, v)}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Imagens */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Imagens</h2>
              <Button type="button" variant="outline" size="sm" onClick={addImage} className="gap-1">
                <Plus className="w-3 h-3" /> Adicionar
              </Button>
            </div>
            <p className="text-xs text-gray-400 mb-3">A primeira imagem será a principal. Clica em <Upload className="w-3 h-3 inline" /> para fazer upload ou cola uma URL.</p>
            <div className="space-y-3">
              {images.map((img, i) => (
                <ImageUpload
                  key={i}
                  index={i}
                  value={img}
                  onChange={(url) => setImage(i, url)}
                  onRemove={() => removeImage(i)}
                  showRemove={images.length > 1}
                  placeholder={i === 0 ? 'URL da imagem principal...' : 'URL da imagem...'}
                />
              ))}
            </div>
          </div>

          {/* Especificações */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Especificações Técnicas</h2>
              <Button type="button" variant="outline" size="sm" onClick={addSpec} className="gap-1">
                <Plus className="w-3 h-3" /> Adicionar
              </Button>
            </div>
            <div className="space-y-2">
              {specs.map((spec, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <Input
                    value={spec.key}
                    onChange={(e) => setSpec(i, 'key', e.target.value)}
                    placeholder="Característica"
                    className="flex-1"
                  />
                  <Input
                    value={spec.value}
                    onChange={(e) => setSpec(i, 'value', e.target.value)}
                    placeholder="Valor"
                    className="flex-1"
                  />
                  {specs.length > 1 && (
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeSpec(i)}>
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pb-6">
            <Link href="/admin/produtos">
              <Button type="button" variant="outline">Cancelar</Button>
            </Link>
            <Button type="submit" disabled={saving}>
              {saving ? 'A criar...' : 'Criar Produto'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
