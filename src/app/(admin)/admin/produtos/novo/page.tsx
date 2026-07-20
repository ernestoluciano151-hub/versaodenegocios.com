'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { TopBar } from '@/components/admin/TopBar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Plus, RefreshCw, Trash2, Save, Tag, X } from 'lucide-react'
import { ImageUpload } from '@/components/admin/ImageUpload'

interface Category { id: string; name: string; slug: string }
interface Supplier { id: string; name: string; country: string }

function slugify(str: string): string {
  return str.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

const TABS = [
  { id: 'basico', label: 'Básico' },
  { id: 'preco', label: 'Preço' },
  { id: 'stock', label: 'Stock' },
  { id: 'importacao', label: 'Importação' },
  { id: 'imagens', label: 'Imagens' },
  { id: 'seo', label: 'SEO' },
  { id: 'publicacao', label: 'Publicação' },
] as const

type TabId = typeof TABS[number]['id']

const CONDITIONS = ['Novo', 'Como Novo', 'Bom Estado', 'Recondicionado', 'Para Peças']
const CURRENCIES = ['AOA', 'USD', 'EUR']

const STORAGE_KEY = 'vn_novo_produto_draft'

function calcMargin(price: string, purchasePrice: string): string {
  const p = parseFloat(price)
  const c = parseFloat(purchasePrice)
  if (!p || !c || c === 0) return ''
  const margin = ((p - c) / p) * 100
  return margin.toFixed(1)
}

function calcMarkup(price: string, purchasePrice: string): string {
  const p = parseFloat(price)
  const c = parseFloat(purchasePrice)
  if (!p || !c || c === 0) return ''
  const markup = ((p - c) / c) * 100
  return markup.toFixed(1)
}

export default function NovoProdutoPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabId>('basico')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [hasDraft, setHasDraft] = useState(false)

  const [categories, setCategories] = useState<Category[]>([])
  const [categoriesLoaded, setCategoriesLoaded] = useState(false)
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [suppliersLoaded, setSuppliersLoaded] = useState(false)

  const [form, setForm] = useState({
    // Básico
    name: '',
    brand: '',
    sku: '',
    internalCode: '',
    categoryId: '',
    originCountry: 'Angola',
    description: '',
    shortDescription: '',
    warranty: '',
    condition: 'Novo',
    conditionNote: '',
    color: '',
    capacity: '',
    model: '',
    // Preço
    price: '',
    salePrice: '',
    purchasePrice: '',
    currency: 'AOA',
    vatIncluded: false,
    weight: '',
    // Stock
    stock: '',
    minStock: '',
    maxStock: '',
    stockLocation: '',
    barcode: '',
    serialNumber: '',
    imei: '',
    // Importação
    supplierId: '',
    importDate: '',
    containerNumber: '',
    orderReference: '',
    supplierInvoice: '',
    lotNumber: '',
    manufactureDate: '',
    expiryDate: '',
    // SEO
    metaTitle: '',
    metaDescription: '',
    metaKeywords: '',
    // Publicação
    active: true,
    featured: false,
    isNew: false,
    isBestseller: false,
  })

  const [images, setImages] = useState<string[]>([''])
  const [specs, setSpecs] = useState<{ key: string; value: string }[]>([{ key: '', value: '' }])
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')

  // Load draft
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY)
      if (saved) {
        const draft = JSON.parse(saved)
        setForm(draft.form ?? form)
        setImages(draft.images ?? [''])
        setSpecs(draft.specs ?? [{ key: '', value: '' }])
        setTags(draft.tags ?? [])
        setHasDraft(true)
      }
    } catch { /* ignore */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Auto-save draft every 10s
  useEffect(() => {
    const id = setInterval(() => {
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ form, images, specs, tags }))
      } catch { /* ignore */ }
    }, 10000)
    return () => clearInterval(id)
  }, [form, images, specs, tags])

  const clearDraft = () => {
    try { sessionStorage.removeItem(STORAGE_KEY) } catch { /* ignore */ }
    setHasDraft(false)
  }

  const loadCategories = useCallback(async () => {
    if (categoriesLoaded) return
    try {
      const res = await fetch('/api/admin/categories?limit=200&status=all')
      const data = await res.json()
      setCategories(data.categories ?? data)
      setCategoriesLoaded(true)
    } catch { /* ignore */ }
  }, [categoriesLoaded])

  const loadSuppliers = useCallback(async () => {
    if (suppliersLoaded) return
    try {
      const res = await fetch('/api/admin/suppliers?limit=200')
      const data = await res.json()
      setSuppliers(data.suppliers ?? data)
      setSuppliersLoaded(true)
    } catch { /* ignore */ }
  }, [suppliersLoaded])

  const generateSku = () => {
    if (!form.name) return
    const slug = slugify(form.name).replace(/-/g, '').toUpperCase().slice(0, 8)
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase()
    setField('sku', `${slug}-${rand}`)
  }

  const setField = (field: string, value: string | boolean) => {
    setForm((f) => ({ ...f, [field]: value }))
  }

  // Images
  const addImage = () => setImages((imgs) => [...imgs, ''])
  const removeImage = (i: number) => setImages((imgs) => imgs.filter((_, idx) => idx !== i))
  const setImage = (i: number, val: string) => setImages((imgs) => imgs.map((img, idx) => idx === i ? val : img))

  // Specs
  const addSpec = () => setSpecs((s) => [...s, { key: '', value: '' }])
  const removeSpec = (i: number) => setSpecs((s) => s.filter((_, idx) => idx !== i))
  const setSpec = (i: number, field: 'key' | 'value', val: string) =>
    setSpecs((s) => s.map((sp, idx) => idx === i ? { ...sp, [field]: val } : sp))

  // Tags
  const addTag = () => {
    const t = tagInput.trim()
    if (t && !tags.includes(t)) setTags((ts) => [...ts, t])
    setTagInput('')
  }
  const removeTag = (t: string) => setTags((ts) => ts.filter((x) => x !== t))

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
        internalCode: form.internalCode || null,
        categoryId: form.categoryId,
        originCountry: form.originCountry,
        description: form.description,
        shortDescription: form.shortDescription || null,
        warranty: form.warranty || null,
        condition: form.condition,
        conditionNote: form.conditionNote || null,
        color: form.color || null,
        capacity: form.capacity || null,
        model: form.model || null,
        price: parseFloat(form.price),
        salePrice: form.salePrice ? parseFloat(form.salePrice) : null,
        purchasePrice: form.purchasePrice ? parseFloat(form.purchasePrice) : null,
        currency: form.currency,
        vatIncluded: form.vatIncluded,
        weight: form.weight ? parseFloat(form.weight) : null,
        stock: parseInt(form.stock) || 0,
        minStock: parseInt(form.minStock) || 0,
        maxStock: parseInt(form.maxStock) || 0,
        stockLocation: form.stockLocation || null,
        barcode: form.barcode || null,
        serialNumber: form.serialNumber || null,
        imei: form.imei || null,
        supplierId: form.supplierId || null,
        importDate: form.importDate || null,
        containerNumber: form.containerNumber || null,
        orderReference: form.orderReference || null,
        supplierInvoice: form.supplierInvoice || null,
        lotNumber: form.lotNumber || null,
        manufactureDate: form.manufactureDate || null,
        expiryDate: form.expiryDate || null,
        metaTitle: form.metaTitle || null,
        metaDescription: form.metaDescription || null,
        metaKeywords: form.metaKeywords || null,
        tags,
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
      clearDraft()
      router.push(`/admin/produtos/${product.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar produto')
      setSaving(false)
    }
  }

  const margin = calcMargin(form.price, form.purchasePrice)
  const markup = calcMarkup(form.price, form.purchasePrice)

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TopBar
        title="Novo Produto"
        actions={
          <div className="flex items-center gap-2">
            {hasDraft && (
              <span className="text-xs text-orange-500 bg-orange-50 px-2 py-1 rounded-full border border-orange-200">
                Rascunho guardado
              </span>
            )}
            <Link href="/admin/produtos">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="w-4 h-4" /> Voltar
              </Button>
            </Link>
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto">
        <form onSubmit={handleSubmit}>
          {/* Tabs */}
          <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6">
            <div className="flex gap-0 overflow-x-auto">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-orange-500 text-orange-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6 max-w-4xl mx-auto space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* ── TAB: BÁSICO ── */}
            {activeTab === 'basico' && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
                  <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Informação Básica</h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <Label htmlFor="name">Nome do Produto *</Label>
                      <Input id="name" value={form.name} onChange={(e) => setField('name', e.target.value)}
                        placeholder="Ex: Samsung Galaxy S24 Ultra" required className="mt-1" />
                    </div>

                    <div>
                      <Label htmlFor="brand">Marca *</Label>
                      <Input id="brand" value={form.brand} onChange={(e) => setField('brand', e.target.value)}
                        placeholder="Ex: Samsung" required className="mt-1" />
                    </div>

                    <div>
                      <Label htmlFor="model">Modelo</Label>
                      <Input id="model" value={form.model} onChange={(e) => setField('model', e.target.value)}
                        placeholder="Ex: SM-S928B" className="mt-1" />
                    </div>

                    <div>
                      <Label htmlFor="sku">SKU *</Label>
                      <div className="flex gap-2 mt-1">
                        <Input id="sku" value={form.sku} onChange={(e) => setField('sku', e.target.value)}
                          placeholder="Ex: SAM-S24U-ABC1" required />
                        <Button type="button" variant="outline" size="sm" onClick={generateSku} title="Gerar SKU">
                          <RefreshCw className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="internalCode">Código Interno</Label>
                      <Input id="internalCode" value={form.internalCode} onChange={(e) => setField('internalCode', e.target.value)}
                        placeholder="Ex: VN-2024-001" className="mt-1" />
                    </div>

                    <div>
                      <Label htmlFor="categoryId">Categoria *</Label>
                      <select id="categoryId" value={form.categoryId} onChange={(e) => setField('categoryId', e.target.value)}
                        onFocus={loadCategories} required
                        className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white">
                        <option value="">Seleccionar categoria...</option>
                        {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                      </select>
                    </div>

                    <div>
                      <Label htmlFor="originCountry">País de Origem</Label>
                      <Input id="originCountry" value={form.originCountry} onChange={(e) => setField('originCountry', e.target.value)}
                        placeholder="Angola" className="mt-1" />
                    </div>

                    <div>
                      <Label htmlFor="condition">Estado do Artigo</Label>
                      <select id="condition" value={form.condition} onChange={(e) => setField('condition', e.target.value)}
                        className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white">
                        {CONDITIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>

                    {form.condition !== 'Novo' && (
                      <div>
                        <Label htmlFor="conditionNote">Observação do Estado</Label>
                        <Input id="conditionNote" value={form.conditionNote} onChange={(e) => setField('conditionNote', e.target.value)}
                          placeholder="Descreva o estado..." className="mt-1" />
                      </div>
                    )}

                    <div>
                      <Label htmlFor="color">Cor</Label>
                      <Input id="color" value={form.color} onChange={(e) => setField('color', e.target.value)}
                        placeholder="Ex: Preto Fantasma" className="mt-1" />
                    </div>

                    <div>
                      <Label htmlFor="capacity">Capacidade / Tamanho</Label>
                      <Input id="capacity" value={form.capacity} onChange={(e) => setField('capacity', e.target.value)}
                        placeholder="Ex: 256GB / 6.1&quot;" className="mt-1" />
                    </div>

                    <div>
                      <Label htmlFor="warranty">Garantia</Label>
                      <Input id="warranty" value={form.warranty} onChange={(e) => setField('warranty', e.target.value)}
                        placeholder="Ex: 12 meses" className="mt-1" />
                    </div>

                    <div className="md:col-span-2">
                      <Label htmlFor="shortDescription">Descrição Curta</Label>
                      <Input id="shortDescription" value={form.shortDescription} onChange={(e) => setField('shortDescription', e.target.value)}
                        placeholder="Resumo em 1 linha para listagens" className="mt-1" />
                    </div>

                    <div className="md:col-span-2">
                      <Label htmlFor="description">Descrição Completa</Label>
                      <textarea id="description" value={form.description} onChange={(e) => setField('description', e.target.value)}
                        placeholder="Descreva o produto em detalhe..." rows={5}
                        className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none" />
                    </div>
                  </div>
                </div>

                {/* Tags */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">Tags</h2>
                  <div className="flex gap-2 mb-3">
                    <Input value={tagInput} onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }}
                      placeholder="Adicionar tag e pressionar Enter..." className="flex-1" />
                    <Button type="button" variant="outline" size="sm" onClick={addTag}>
                      <Tag className="w-4 h-4" />
                    </Button>
                  </div>
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {tags.map((t) => (
                        <Badge key={t} variant="secondary" className="gap-1 pr-1">
                          {t}
                          <button type="button" onClick={() => removeTag(t)} className="ml-1 hover:text-red-500">
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Especificações Técnicas */}
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
                        <Input value={spec.key} onChange={(e) => setSpec(i, 'key', e.target.value)}
                          placeholder="Característica" className="flex-1" />
                        <Input value={spec.value} onChange={(e) => setSpec(i, 'value', e.target.value)}
                          placeholder="Valor" className="flex-1" />
                        {specs.length > 1 && (
                          <Button type="button" variant="ghost" size="sm" onClick={() => removeSpec(i)}>
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── TAB: PREÇO ── */}
            {activeTab === 'preco' && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
                  <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Preços</h2>

                  <div>
                    <Label>Moeda</Label>
                    <div className="flex gap-2 mt-1">
                      {CURRENCIES.map((c) => (
                        <button key={c} type="button" onClick={() => setField('currency', c)}
                          className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                            form.currency === c
                              ? 'bg-orange-500 text-white border-orange-500'
                              : 'bg-white text-gray-700 border-gray-300 hover:border-orange-300'
                          }`}>{c}</button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="price">Preço de Venda ({form.currency}) *</Label>
                      <Input id="price" type="number" min="0" step="0.01" value={form.price}
                        onChange={(e) => setField('price', e.target.value)} placeholder="0.00" required className="mt-1" />
                    </div>

                    <div>
                      <Label htmlFor="salePrice">Preço Promocional ({form.currency})</Label>
                      <Input id="salePrice" type="number" min="0" step="0.01" value={form.salePrice}
                        onChange={(e) => setField('salePrice', e.target.value)} placeholder="0.00" className="mt-1" />
                    </div>

                    <div>
                      <Label htmlFor="purchasePrice">Preço de Custo ({form.currency})</Label>
                      <Input id="purchasePrice" type="number" min="0" step="0.01" value={form.purchasePrice}
                        onChange={(e) => setField('purchasePrice', e.target.value)} placeholder="0.00" className="mt-1" />
                    </div>
                  </div>

                  {/* Margin calculator */}
                  {margin && (
                    <div className="grid grid-cols-2 gap-4 bg-green-50 rounded-lg p-4 border border-green-100">
                      <div>
                        <p className="text-xs text-green-600 font-medium">Margem</p>
                        <p className="text-2xl font-bold text-green-700">{margin}%</p>
                        <p className="text-xs text-green-500">Lucro sobre preço de venda</p>
                      </div>
                      <div>
                        <p className="text-xs text-green-600 font-medium">Markup</p>
                        <p className="text-2xl font-bold text-green-700">{markup}%</p>
                        <p className="text-xs text-green-500">Lucro sobre custo</p>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="weight">Peso (kg)</Label>
                      <Input id="weight" type="number" min="0" step="0.001" value={form.weight}
                        onChange={(e) => setField('weight', e.target.value)} placeholder="0.000" className="mt-1" />
                    </div>

                    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg mt-6">
                      <div>
                        <Label htmlFor="vatIncluded" className="cursor-pointer">IVA Incluído</Label>
                        <p className="text-xs text-gray-400">O preço já inclui IVA?</p>
                      </div>
                      <Switch id="vatIncluded" checked={form.vatIncluded} onCheckedChange={(v) => setField('vatIncluded', v)} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── TAB: STOCK ── */}
            {activeTab === 'stock' && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
                  <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Controlo de Stock</h2>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="stock">Stock Inicial *</Label>
                      <Input id="stock" type="number" min="0" value={form.stock}
                        onChange={(e) => setField('stock', e.target.value)} placeholder="0" required className="mt-1" />
                    </div>

                    <div>
                      <Label htmlFor="minStock">Stock Mínimo</Label>
                      <Input id="minStock" type="number" min="0" value={form.minStock}
                        onChange={(e) => setField('minStock', e.target.value)} placeholder="0" className="mt-1" />
                      <p className="text-xs text-gray-400 mt-1">Alerta quando abaixo deste valor</p>
                    </div>

                    <div>
                      <Label htmlFor="maxStock">Stock Máximo</Label>
                      <Input id="maxStock" type="number" min="0" value={form.maxStock}
                        onChange={(e) => setField('maxStock', e.target.value)} placeholder="0" className="mt-1" />
                      <p className="text-xs text-gray-400 mt-1">Capacidade máxima em armazém</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="stockLocation">Localização em Armazém</Label>
                      <Input id="stockLocation" value={form.stockLocation}
                        onChange={(e) => setField('stockLocation', e.target.value)}
                        placeholder="Ex: Prateleira A3, Corredor 2" className="mt-1" />
                    </div>

                    <div>
                      <Label htmlFor="barcode">Código de Barras / EAN</Label>
                      <Input id="barcode" value={form.barcode}
                        onChange={(e) => setField('barcode', e.target.value)}
                        placeholder="Ex: 8806094697056" className="mt-1" />
                    </div>

                    <div>
                      <Label htmlFor="serialNumber">Número de Série</Label>
                      <Input id="serialNumber" value={form.serialNumber}
                        onChange={(e) => setField('serialNumber', e.target.value)}
                        placeholder="Ex: SN123456789" className="mt-1" />
                    </div>

                    <div>
                      <Label htmlFor="imei">IMEI (para telemóveis)</Label>
                      <Input id="imei" value={form.imei}
                        onChange={(e) => setField('imei', e.target.value)}
                        placeholder="Ex: 353879234567890" className="mt-1" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── TAB: IMPORTAÇÃO ── */}
            {activeTab === 'importacao' && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
                  <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Dados de Importação</h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="supplierId">Fornecedor</Label>
                      <select id="supplierId" value={form.supplierId}
                        onChange={(e) => setField('supplierId', e.target.value)}
                        onFocus={loadSuppliers}
                        className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white">
                        <option value="">Seleccionar fornecedor...</option>
                        {suppliers.map((s) => (
                          <option key={s.id} value={s.id}>{s.name} ({s.country})</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <Label htmlFor="importDate">Data de Importação</Label>
                      <Input id="importDate" type="date" value={form.importDate}
                        onChange={(e) => setField('importDate', e.target.value)} className="mt-1" />
                    </div>

                    <div>
                      <Label htmlFor="containerNumber">Número de Contentor</Label>
                      <Input id="containerNumber" value={form.containerNumber}
                        onChange={(e) => setField('containerNumber', e.target.value)}
                        placeholder="Ex: MSCU1234567" className="mt-1" />
                    </div>

                    <div>
                      <Label htmlFor="orderReference">Referência da Encomenda</Label>
                      <Input id="orderReference" value={form.orderReference}
                        onChange={(e) => setField('orderReference', e.target.value)}
                        placeholder="Ex: PO-2024-001" className="mt-1" />
                    </div>

                    <div>
                      <Label htmlFor="supplierInvoice">Factura do Fornecedor</Label>
                      <Input id="supplierInvoice" value={form.supplierInvoice}
                        onChange={(e) => setField('supplierInvoice', e.target.value)}
                        placeholder="Ex: INV-2024-5678" className="mt-1" />
                    </div>

                    <div>
                      <Label htmlFor="lotNumber">Número de Lote</Label>
                      <Input id="lotNumber" value={form.lotNumber}
                        onChange={(e) => setField('lotNumber', e.target.value)}
                        placeholder="Ex: LOT-2024-Q1-001" className="mt-1" />
                    </div>

                    <div>
                      <Label htmlFor="manufactureDate">Data de Fabrico</Label>
                      <Input id="manufactureDate" type="date" value={form.manufactureDate}
                        onChange={(e) => setField('manufactureDate', e.target.value)} className="mt-1" />
                    </div>

                    <div>
                      <Label htmlFor="expiryDate">Data de Validade</Label>
                      <Input id="expiryDate" type="date" value={form.expiryDate}
                        onChange={(e) => setField('expiryDate', e.target.value)} className="mt-1" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── TAB: IMAGENS ── */}
            {activeTab === 'imagens' && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Imagens do Produto</h2>
                    <p className="text-xs text-gray-400 mt-0.5">A primeira imagem será a principal. Arrastar para reordenar.</p>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={addImage} className="gap-1">
                    <Plus className="w-3 h-3" /> Adicionar
                  </Button>
                </div>
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
            )}

            {/* ── TAB: SEO ── */}
            {activeTab === 'seo' && (
              <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
                <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">SEO & Meta</h2>
                <p className="text-xs text-gray-400">Se não preenchido, o título e descrição do produto serão usados automaticamente.</p>

                <div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="metaTitle">Título SEO</Label>
                    <span className="text-xs text-gray-400">{form.metaTitle.length}/60</span>
                  </div>
                  <Input id="metaTitle" value={form.metaTitle}
                    onChange={(e) => setField('metaTitle', e.target.value)}
                    placeholder={form.name || 'Título para motores de busca...'}
                    maxLength={60} className="mt-1" />
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="metaDescription">Descrição SEO</Label>
                    <span className="text-xs text-gray-400">{form.metaDescription.length}/160</span>
                  </div>
                  <textarea id="metaDescription" value={form.metaDescription}
                    onChange={(e) => setField('metaDescription', e.target.value)}
                    placeholder="Descrição para motores de busca..." rows={3} maxLength={160}
                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none" />
                </div>

                <div>
                  <Label htmlFor="metaKeywords">Palavras-chave (separadas por vírgula)</Label>
                  <Input id="metaKeywords" value={form.metaKeywords}
                    onChange={(e) => setField('metaKeywords', e.target.value)}
                    placeholder="smartphone, samsung, galaxy, android" className="mt-1" />
                </div>

                {/* Preview */}
                {(form.name || form.metaTitle) && (
                  <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <p className="text-xs text-gray-400 mb-2 font-medium">Pré-visualização no Google</p>
                    <p className="text-blue-600 text-base font-medium truncate">
                      {form.metaTitle || form.name}
                    </p>
                    <p className="text-green-700 text-xs">versaodenegocios.com/produtos/{slugify(form.name || '')}</p>
                    <p className="text-gray-600 text-sm mt-1 line-clamp-2">
                      {form.metaDescription || form.shortDescription || form.description || 'Sem descrição'}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* ── TAB: PUBLICAÇÃO ── */}
            {activeTab === 'publicacao' && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">Estado e Visibilidade</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {([
                      { field: 'active', label: 'Produto Activo', desc: 'Visível na loja' },
                      { field: 'featured', label: 'Destaque', desc: 'Aparece na secção de destaques' },
                      { field: 'isNew', label: 'Novidade', desc: 'Exibe badge "Novo"' },
                      { field: 'isBestseller', label: 'Mais Vendido', desc: 'Exibe badge "Bestseller"' },
                    ] as const).map(({ field, label, desc }) => (
                      <div key={field} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div>
                          <Label htmlFor={field} className="cursor-pointer font-medium">{label}</Label>
                          <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
                        </div>
                        <Switch id={field} checked={form[field]} onCheckedChange={(v) => setField(field, v)} />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Summary before save */}
                <div className="bg-orange-50 border border-orange-100 rounded-xl p-6">
                  <h3 className="text-sm font-semibold text-orange-800 mb-3">Resumo do Produto</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="text-gray-500">Nome:</div>
                    <div className="font-medium truncate">{form.name || '—'}</div>
                    <div className="text-gray-500">SKU:</div>
                    <div className="font-mono text-xs">{form.sku || '—'}</div>
                    <div className="text-gray-500">Preço:</div>
                    <div className="font-medium">{form.price ? `${parseFloat(form.price).toLocaleString('pt-AO')} ${form.currency}` : '—'}</div>
                    <div className="text-gray-500">Stock:</div>
                    <div>{form.stock || '0'} unidades</div>
                    <div className="text-gray-500">Estado:</div>
                    <div><Badge variant={form.active ? 'success' : 'secondary'}>{form.active ? 'Activo' : 'Inactivo'}</Badge></div>
                    <div className="text-gray-500">Condição:</div>
                    <div>{form.condition}</div>
                    <div className="text-gray-500">Imagens:</div>
                    <div>{images.filter(Boolean).length} imagem(ns)</div>
                  </div>
                </div>
              </div>
            )}

            {/* Footer actions */}
            <div className="flex items-center justify-between pb-6">
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" onClick={() => {
                  try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ form, images, specs, tags })); setHasDraft(true) } catch { /* ignore */ }
                }}>
                  <Save className="w-4 h-4 mr-1" /> Guardar Rascunho
                </Button>
                {hasDraft && (
                  <Button type="button" variant="ghost" size="sm" onClick={clearDraft} className="text-gray-400 hover:text-red-500">
                    Limpar rascunho
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-3">
                <Link href="/admin/produtos">
                  <Button type="button" variant="outline">Cancelar</Button>
                </Link>
                <Button type="submit" disabled={saving} className="min-w-[130px]">
                  {saving ? 'A criar...' : 'Criar Produto'}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
