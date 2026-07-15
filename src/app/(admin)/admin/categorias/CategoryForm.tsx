'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, Loader2, Tag, ExternalLink, ChevronRight } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

type Category = {
  id: string
  name: string
  slug: string
  description?: string
  image?: string
  icon?: string
  bannerDesktop?: string
  bannerMobile?: string
  ogImage?: string
  parentId?: string
  parent?: { id: string; name: string; slug: string }
  active: boolean
  isVisible: boolean
  isFeatured: boolean
  displayOrder: number
  color?: string
  showInHomepage: boolean
  showInMenu: boolean
  showInMobileMenu: boolean
  showInFooter: boolean
  seoTitle?: string
  seoDescription?: string
  seoKeywords?: string
  customUrl?: string
  createdBy?: string
  updatedBy?: string
  deletedAt?: string
  createdAt: string
  updatedAt: string
  _count: { products: number; children: number }
  productStats?: {
    activeProducts: number
    inactiveProducts: number
    outOfStock: number
    onSale: number
    totalStockValue: number
  }
}

interface CategoryFormProps {
  category?: Category | null
  parentCategories: { id: string; name: string; slug: string }[]
  onClose: () => void
  onSaved: (category: Category) => void
}

type Tab = 'geral' | 'imagens' | 'visibilidade' | 'seo'

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

const defaultForm = {
  name: '',
  slug: '',
  description: '',
  image: '',
  icon: '',
  bannerDesktop: '',
  bannerMobile: '',
  ogImage: '',
  parentId: '',
  active: true,
  isVisible: true,
  isFeatured: false,
  displayOrder: 0,
  color: '',
  showInHomepage: false,
  showInMenu: true,
  showInMobileMenu: true,
  showInFooter: false,
  seoTitle: '',
  seoDescription: '',
  seoKeywords: '',
  customUrl: '',
}

export function CategoryForm({ category, parentCategories, onClose, onSaved }: CategoryFormProps) {
  const isEdit = !!category
  const [activeTab, setActiveTab] = useState<Tab>('geral')
  const [form, setForm] = useState({ ...defaultForm })
  const [slugManual, setSlugManual] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (category) {
      setForm({
        name: category.name ?? '',
        slug: category.slug ?? '',
        description: category.description ?? '',
        image: category.image ?? '',
        icon: category.icon ?? '',
        bannerDesktop: category.bannerDesktop ?? '',
        bannerMobile: category.bannerMobile ?? '',
        ogImage: category.ogImage ?? '',
        parentId: category.parentId ?? '',
        active: category.active ?? true,
        isVisible: category.isVisible ?? true,
        isFeatured: category.isFeatured ?? false,
        displayOrder: category.displayOrder ?? 0,
        color: category.color ?? '',
        showInHomepage: category.showInHomepage ?? false,
        showInMenu: category.showInMenu ?? true,
        showInMobileMenu: category.showInMobileMenu ?? true,
        showInFooter: category.showInFooter ?? false,
        seoTitle: category.seoTitle ?? '',
        seoDescription: category.seoDescription ?? '',
        seoKeywords: category.seoKeywords ?? '',
        customUrl: category.customUrl ?? '',
      })
      setSlugManual(true)
    } else {
      setForm({ ...defaultForm })
      setSlugManual(false)
    }
  }, [category])

  const set = useCallback(<K extends keyof typeof defaultForm>(field: K, value: (typeof defaultForm)[K]) => {
    setForm(prev => {
      const next = { ...prev, [field]: value }
      if (field === 'name' && !slugManual) {
        next.slug = slugify(value as string)
      }
      return next
    })
    setErrors(prev => { const e = { ...prev }; delete e[field]; return e })
  }, [slugManual])

  function validate() {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = 'Nome é obrigatório'
    if (!form.slug.trim()) e.slug = 'Slug é obrigatório'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setSaving(true)
    try {
      const payload = {
        name: form.name,
        slug: form.slug,
        description: form.description || undefined,
        image: form.image || undefined,
        icon: form.icon || undefined,
        bannerDesktop: form.bannerDesktop || undefined,
        bannerMobile: form.bannerMobile || undefined,
        ogImage: form.ogImage || undefined,
        parentId: form.parentId || undefined,
        active: form.active,
        isVisible: form.isVisible,
        isFeatured: form.isFeatured,
        displayOrder: Number(form.displayOrder),
        color: form.color || undefined,
        showInHomepage: form.showInHomepage,
        showInMenu: form.showInMenu,
        showInMobileMenu: form.showInMobileMenu,
        showInFooter: form.showInFooter,
        seoTitle: form.seoTitle || undefined,
        seoDescription: form.seoDescription || undefined,
        seoKeywords: form.seoKeywords || undefined,
        customUrl: form.customUrl || undefined,
      }

      const url = isEdit ? `/api/admin/categories/${category!.id}` : '/api/admin/categories'
      const method = isEdit ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Erro ao guardar')
      }
      const saved: Category = await res.json()
      onSaved(saved)
    } catch (err) {
      setErrors({ _global: err instanceof Error ? err.message : 'Erro desconhecido' })
    } finally {
      setSaving(false)
    }
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'geral', label: 'Geral' },
    { id: 'imagens', label: 'Imagens' },
    { id: 'visibilidade', label: 'Visibilidade' },
    { id: 'seo', label: 'SEO' },
  ]

  const seoDescLen = form.seoDescription.length

  const googlePreviewUrl = form.customUrl || `https://vncommerce.ao/categorias/${form.slug}`
  const googleTitle = form.seoTitle || form.name || 'Título da Página'
  const googleDesc = form.seoDescription || form.description || 'Descrição da categoria para motores de busca.'

  function ImageField({ field, label }: { field: 'image' | 'bannerDesktop' | 'bannerMobile' | 'ogImage'; label: string }) {
    const val = form[field]
    return (
      <div className="space-y-2">
        <Label>{label}</Label>
        <div className="flex gap-2">
          <Input
            value={val}
            onChange={e => set(field, e.target.value)}
            placeholder="https://res.cloudinary.com/..."
            className="flex-1"
          />
          <a
            href="https://cloudinary.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-3 py-2 text-xs border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-600 whitespace-nowrap"
          >
            <ExternalLink className="w-3 h-3" />
            Cloudinary
          </a>
        </div>
        {val && (
          <div className="mt-2 rounded-lg border border-gray-200 overflow-hidden w-40 h-24 bg-gray-50">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={val} alt={label} className="w-full h-full object-cover" onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
          </div>
        )}
      </div>
    )
  }

  function ToggleRow({ label, description, field }: { label: string; description?: string; field: 'isVisible' | 'isFeatured' | 'showInHomepage' | 'showInMenu' | 'showInMobileMenu' | 'showInFooter' | 'active' }) {
    return (
      <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
        <div>
          <p className="text-sm font-medium text-gray-900">{label}</p>
          {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
        </div>
        <Switch
          checked={form[field]}
          onCheckedChange={v => set(field, v)}
        />
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Drawer */}
      <div className="relative z-10 flex flex-col w-full max-w-2xl bg-white h-full shadow-2xl animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {isEdit ? 'Editar Categoria' : 'Nova Categoria'}
            </h2>
            {isEdit && (
              <p className="text-xs text-gray-400 mt-0.5">ID: {category!.id}</p>
            )}
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 px-6">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px ${
                activeTab === tab.id
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Form content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-5">
            {errors._global && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {errors._global}
              </div>
            )}

            {/* Tab: Geral */}
            {activeTab === 'geral' && (
              <div className="space-y-5">
                <div>
                  <Label htmlFor="cat-name">Nome *</Label>
                  <Input
                    id="cat-name"
                    value={form.name}
                    onChange={e => set('name', e.target.value)}
                    placeholder="Ex: Electrónica"
                    className={`mt-1 ${errors.name ? 'border-red-400' : ''}`}
                  />
                  {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                </div>

                <div>
                  <Label htmlFor="cat-slug">Slug *</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="cat-slug"
                      value={form.slug}
                      onChange={e => {
                        setSlugManual(true)
                        set('slug', e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''))
                      }}
                      placeholder="electronica"
                      className={errors.slug ? 'border-red-400' : ''}
                    />
                    <button
                      type="button"
                      onClick={() => { setSlugManual(false); set('slug', slugify(form.name)) }}
                      className="px-3 py-2 text-xs border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-600 whitespace-nowrap"
                    >
                      Auto
                    </button>
                  </div>
                  {errors.slug && <p className="text-xs text-red-500 mt-1">{errors.slug}</p>}
                  <p className="text-xs text-gray-400 mt-1">/categorias/{form.slug || '...'}</p>
                </div>

                <div>
                  <Label htmlFor="cat-desc">Descrição</Label>
                  <Textarea
                    id="cat-desc"
                    value={form.description}
                    onChange={e => set('description', e.target.value)}
                    placeholder="Descrição da categoria..."
                    rows={3}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="cat-parent">Categoria Pai</Label>
                  <select
                    id="cat-parent"
                    value={form.parentId}
                    onChange={e => set('parentId', e.target.value)}
                    className="mt-1 w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                  >
                    <option value="">Nenhuma (categoria raiz)</option>
                    {parentCategories
                      .filter(p => p.id !== category?.id)
                      .map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))
                    }
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="cat-order">Ordem de Exibição</Label>
                    <Input
                      id="cat-order"
                      type="number"
                      value={form.displayOrder}
                      onChange={e => set('displayOrder', Number(e.target.value) as unknown as typeof form.displayOrder)}
                      min={0}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="cat-color">Cor (hex)</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        id="cat-color"
                        value={form.color}
                        onChange={e => set('color', e.target.value)}
                        placeholder="#FF6B00"
                        className="flex-1"
                      />
                      {form.color && (
                        <div
                          className="w-10 h-10 rounded-lg border border-gray-200 flex-shrink-0"
                          style={{ backgroundColor: form.color }}
                        />
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="cat-icon">Ícone (URL)</Label>
                  <Input
                    id="cat-icon"
                    value={form.icon}
                    onChange={e => set('icon', e.target.value)}
                    placeholder="https://..."
                    className="mt-1"
                  />
                </div>

                <div className="flex items-center justify-between py-3 bg-gray-50 rounded-lg px-4">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Activa</p>
                    <p className="text-xs text-gray-500">Categoria visível e funcional na loja</p>
                  </div>
                  <Switch checked={form.active} onCheckedChange={v => set('active', v)} />
                </div>
              </div>
            )}

            {/* Tab: Imagens */}
            {activeTab === 'imagens' && (
              <div className="space-y-6">
                <p className="text-sm text-gray-500">
                  Cole o URL da imagem ou clique em Cloudinary para fazer upload e copiar o URL.
                </p>
                <ImageField field="image" label="Imagem Principal" />
                <ImageField field="bannerDesktop" label="Banner Desktop" />
                <ImageField field="bannerMobile" label="Banner Mobile" />
                <ImageField field="ogImage" label="OG Image (redes sociais)" />
              </div>
            )}

            {/* Tab: Visibilidade */}
            {activeTab === 'visibilidade' && (
              <div className="space-y-1">
                <ToggleRow
                  field="isVisible"
                  label="Visível"
                  description="Categoria aparece na loja para os clientes"
                />
                <ToggleRow
                  field="isFeatured"
                  label="Em Destaque"
                  description="Destacada nas secções de categorias em destaque"
                />
                <ToggleRow
                  field="showInHomepage"
                  label="Mostrar na Página Inicial"
                  description="Aparece nos destaques da homepage"
                />
                <ToggleRow
                  field="showInMenu"
                  label="Mostrar no Menu"
                  description="Aparece na barra de navegação principal"
                />
                <ToggleRow
                  field="showInMobileMenu"
                  label="Mostrar no Menu Mobile"
                  description="Aparece no menu de navegação em dispositivos móveis"
                />
                <ToggleRow
                  field="showInFooter"
                  label="Mostrar no Rodapé"
                  description="Aparece na secção de links do rodapé"
                />
              </div>
            )}

            {/* Tab: SEO */}
            {activeTab === 'seo' && (
              <div className="space-y-5">
                <div>
                  <Label htmlFor="cat-seo-title">Título SEO</Label>
                  <Input
                    id="cat-seo-title"
                    value={form.seoTitle}
                    onChange={e => set('seoTitle', e.target.value)}
                    placeholder={form.name || 'Título da página'}
                    className="mt-1"
                    maxLength={70}
                  />
                  <p className="text-xs text-gray-400 mt-1">{form.seoTitle.length}/70 caracteres</p>
                </div>

                <div>
                  <Label htmlFor="cat-seo-desc">Descrição SEO</Label>
                  <Textarea
                    id="cat-seo-desc"
                    value={form.seoDescription}
                    onChange={e => set('seoDescription', e.target.value)}
                    placeholder="Descrição para motores de busca..."
                    rows={3}
                    className={`mt-1 ${seoDescLen > 160 ? 'border-amber-400' : ''}`}
                    maxLength={200}
                  />
                  <p className={`text-xs mt-1 ${seoDescLen > 160 ? 'text-amber-600' : 'text-gray-400'}`}>
                    {seoDescLen}/160 caracteres {seoDescLen > 160 && '(recomendado: até 160)'}
                  </p>
                </div>

                <div>
                  <Label htmlFor="cat-seo-kw">Palavras-chave</Label>
                  <Input
                    id="cat-seo-kw"
                    value={form.seoKeywords}
                    onChange={e => set('seoKeywords', e.target.value)}
                    placeholder="electronica, gadgets, tecnologia"
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-400 mt-1">Separadas por vírgula</p>
                </div>

                <div>
                  <Label htmlFor="cat-custom-url">URL Personalizado</Label>
                  <Input
                    id="cat-custom-url"
                    value={form.customUrl}
                    onChange={e => set('customUrl', e.target.value)}
                    placeholder="https://vncommerce.ao/eletronicos"
                    className="mt-1"
                  />
                </div>

                {/* Google Preview */}
                <div className="mt-4 p-4 border border-gray-200 rounded-xl bg-white">
                  <p className="text-xs font-medium text-gray-500 uppercase mb-3">Pré-visualização Google</p>
                  <div className="space-y-1">
                    <p className="text-xs text-green-700 truncate">{googlePreviewUrl}</p>
                    <p className="text-blue-700 text-base font-medium hover:underline cursor-pointer leading-tight line-clamp-1">
                      {googleTitle}
                    </p>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {googleDesc}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex gap-2">
            {tabs.map((tab, i) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`w-2 h-2 rounded-full transition-colors ${activeTab === tab.id ? 'bg-orange-500' : 'bg-gray-300'}`}
                title={tab.label}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Cancelar
            </Button>
            <Button
              type="submit"
              onClick={handleSubmit}
              disabled={saving}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              {saving && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
              {isEdit ? 'Guardar Alterações' : 'Criar Categoria'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
