'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { TopBar } from '@/components/admin/TopBar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Plus, Search, Edit, Package, Archive, Trash2, Eye, EyeOff,
  ChevronLeft, ChevronRight, MoreVertical, CheckSquare, Square,
  Star, Copy, ExternalLink, RefreshCw, Download, Filter,
  AlertTriangle, X, ChevronDown,
} from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────

interface ProductRow {
  id: string
  name: string
  slug: string
  brand: string
  sku: string
  barcode?: string
  images: string[]
  price: number
  salePrice?: number
  purchasePrice?: number
  stock: number
  minStock: number
  active: boolean
  featured: boolean
  visibility: string
  condition: string
  createdAt: string
  updatedAt: string
  category: { id: string; name: string }
  _count: { variants: number; reviews: number }
}

interface Stats {
  total: number
  active: number
  archived: number
  outOfStock: number
  lowStock: number
}

interface ApiResponse {
  products: ProductRow[]
  total: number
  pages: number
  page: number
  stats: Stats
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const VISIBILITY_LABELS: Record<string, { label: string; color: string }> = {
  visible:       { label: 'Visível',      color: 'bg-green-100 text-green-700' },
  hidden:        { label: 'Oculto',       color: 'bg-gray-100 text-gray-600' },
  maintenance:   { label: 'Manutenção',   color: 'bg-yellow-100 text-yellow-700' },
  out_of_stock:  { label: 'Esgotado',     color: 'bg-red-100 text-red-600' },
  catalog_only:  { label: 'Só catálogo',  color: 'bg-blue-100 text-blue-700' },
  members_only:  { label: 'Membros',      color: 'bg-purple-100 text-purple-700' },
  affiliates_only:{ label: 'Afiliados',   color: 'bg-indigo-100 text-indigo-700' },
  archived:      { label: 'Arquivado',    color: 'bg-gray-200 text-gray-500' },
}

function fmt(n: number) {
  return new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA', maximumFractionDigits: 0 }).format(n)
}
function fmtDate(s: string) {
  return new Date(s).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: '2-digit' })
}

// ── Context Menu ─────────────────────────────────────────────────────────────

function ContextMenu({ x, y, product, onClose, onAction }: {
  x: number; y: number
  product: ProductRow
  onClose: () => void
  onAction: (action: string, id: string) => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  // Adjust position so menu doesn't overflow viewport
  const menuW = 200
  const menuH = 280
  const left = Math.min(x, window.innerWidth - menuW - 8)
  const top  = Math.min(y, window.innerHeight - menuH - 8)

  return (
    <div
      ref={ref}
      className="fixed z-50 bg-white border border-gray-200 rounded-xl shadow-xl py-1 w-52 text-sm"
      style={{ left, top }}
    >
      <Link href={`/admin/produtos/${product.id}`} onClick={onClose}>
        <div className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-gray-700">
          <Edit className="w-4 h-4" /> Editar
        </div>
      </Link>
      <button
        onClick={() => { onAction('duplicate', product.id); onClose() }}
        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-gray-700"
      >
        <Copy className="w-4 h-4" /> Duplicar
      </button>
      <Link href={`/produtos/${product.slug}`} target="_blank" onClick={onClose}>
        <div className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-gray-700">
          <ExternalLink className="w-4 h-4" /> Ver na loja
        </div>
      </Link>
      <div className="border-t border-gray-100 my-1" />
      <button
        onClick={() => { onAction('featured', product.id); onClose() }}
        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-gray-700"
      >
        <Star className={`w-4 h-4 ${product.featured ? 'fill-orange-400 text-orange-400' : ''}`} />
        {product.featured ? 'Remover destaque' : 'Marcar destaque'}
      </button>
      <button
        onClick={() => { onAction(product.visibility === 'archived' ? 'unarchive' : 'archive', product.id); onClose() }}
        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-gray-700"
      >
        <Archive className="w-4 h-4" />
        {product.visibility === 'archived' ? 'Desarquivar' : 'Arquivar'}
      </button>
      <div className="border-t border-gray-100 my-1" />
      <button
        onClick={() => { onAction('delete', product.id); onClose() }}
        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-red-50 text-red-600"
      >
        <Trash2 className="w-4 h-4" /> Eliminar
      </button>
    </div>
  )
}

// ── Bulk Actions Bar ─────────────────────────────────────────────────────────

function BulkBar({ count, onBulkAction, onClear }: {
  count: number
  onBulkAction: (action: string, value?: string) => void
  onClear: () => void
}) {
  const [visMenu, setVisMenu] = useState(false)
  const VISIBILITIES = [
    { value: 'visible', label: 'Visível' },
    { value: 'hidden', label: 'Oculto' },
    { value: 'catalog_only', label: 'Só catálogo' },
    { value: 'members_only', label: 'Membros' },
  ]

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-orange-50 border-b border-orange-200">
      <button onClick={onClear} className="text-orange-600 hover:text-orange-800 mr-1">
        <X className="w-4 h-4" />
      </button>
      <span className="text-sm font-medium text-orange-700">{count} seleccionado{count !== 1 ? 's' : ''}</span>
      <div className="h-4 w-px bg-orange-300 mx-2" />
      <button onClick={() => onBulkAction('archive')} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-gray-700">
        <Archive className="w-3.5 h-3.5" /> Arquivar
      </button>
      <button onClick={() => onBulkAction('activate')} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-gray-700">
        <Eye className="w-3.5 h-3.5" /> Activar
      </button>
      <button onClick={() => onBulkAction('deactivate')} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-gray-700">
        <EyeOff className="w-3.5 h-3.5" /> Desactivar
      </button>
      <div className="relative">
        <button onClick={() => setVisMenu(v => !v)} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-gray-700">
          <Filter className="w-3.5 h-3.5" /> Visibilidade <ChevronDown className="w-3 h-3" />
        </button>
        {visMenu && (
          <div className="absolute top-full left-0 mt-1 w-44 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1">
            {VISIBILITIES.map(v => (
              <button key={v.value} onClick={() => { onBulkAction('visibility', v.value); setVisMenu(false) }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50">
                {v.label}
              </button>
            ))}
          </div>
        )}
      </div>
      <button onClick={() => onBulkAction('delete')} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-red-200 bg-white hover:bg-red-50 text-red-600">
        <Trash2 className="w-3.5 h-3.5" /> Eliminar
      </button>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function ProdutosAdminPage() {
  const router   = useRouter()
  const pathname = usePathname()
  const sp       = useSearchParams()

  // State
  const [data, setData]         = useState<ApiResponse | null>(null)
  const [loading, setLoading]   = useState(true)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [ctxMenu, setCtxMenu]   = useState<{ x: number; y: number; product: ProductRow } | null>(null)

  // Filter state (mirrors URL)
  const q          = sp.get('q') ?? ''
  const categoryId = sp.get('categoryId') ?? ''
  const visibility = sp.get('visibility') ?? ''
  const condition  = sp.get('condition') ?? ''
  const stockStatus = sp.get('stockStatus') ?? ''
  const page       = parseInt(sp.get('page') ?? '1')
  const sort       = sp.get('sort') ?? 'updatedAt'
  const order      = sp.get('order') ?? 'desc'

  // Local search input (debounced)
  const [searchInput, setSearchInput] = useState(q)

  // Categories for filter dropdown
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([])
  useEffect(() => {
    fetch('/api/admin/categories?limit=200&status=all')
      .then(r => r.json())
      .then(d => setCategories(d.categories ?? d ?? []))
      .catch(() => {})
  }, [])

  // Push URL helper
  const pushUrl = useCallback((updates: Record<string, string>) => {
    const params = new URLSearchParams(sp.toString())
    Object.entries(updates).forEach(([k, v]) => {
      if (v) params.set(k, v)
      else params.delete(k)
    })
    params.delete('page') // reset to page 1 on filter change unless explicitly set
    if (updates.page) params.set('page', updates.page)
    router.push(`${pathname}?${params.toString()}`)
  }, [sp, router, pathname])

  // Fetch data
  const fetchData = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams({ q, categoryId, visibility, condition, stockStatus, page: String(page), sort, order, limit: '25' })
    fetch(`/api/admin/products?${params}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [q, categoryId, visibility, condition, stockStatus, page, sort, order])

  useEffect(() => { fetchData() }, [fetchData])

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => { if (searchInput !== q) pushUrl({ q: searchInput }) }, 400)
    return () => clearTimeout(t)
  }, [searchInput]) // eslint-disable-line react-hooks/exhaustive-deps

  // Selection
  const allIds = data?.products.map(p => p.id) ?? []
  const allSelected = allIds.length > 0 && allIds.every(id => selected.has(id))
  const toggleAll = () => {
    if (allSelected) setSelected(new Set())
    else setSelected(new Set(allIds))
  }
  const toggleOne = (id: string) => {
    setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  // Bulk action
  const bulkAction = useCallback(async (action: string, value?: string) => {
    const ids = [...selected]
    if (ids.length === 0) return
    if (action === 'delete' && !confirm(`Eliminar ${ids.length} produto(s)?`)) return

    await fetch('/api/admin/products', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids, action, value }),
    })
    setSelected(new Set())
    fetchData()
  }, [selected, fetchData])

  // Single row action
  const rowAction = useCallback(async (action: string, id: string) => {
    if (action === 'delete' && !confirm('Eliminar este produto?')) return
    if (action === 'duplicate') {
      router.push(`/admin/produtos/novo?duplicateFrom=${id}`)
      return
    }
    if (action === 'featured') {
      const p = data?.products.find(x => x.id === id)
      await fetch('/api/admin/products', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [id], action: 'featured', value: String(!p?.featured) }),
      })
    } else {
      await fetch('/api/admin/products', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [id], action }),
      })
    }
    fetchData()
  }, [data, fetchData, router])

  // Sort toggle
  const toggleSort = (field: string) => {
    if (sort === field) pushUrl({ sort: field, order: order === 'asc' ? 'desc' : 'asc' })
    else pushUrl({ sort: field, order: 'desc' })
  }

  const SortIcon = ({ field }: { field: string }) => {
    if (sort !== field) return <span className="ml-1 text-gray-300">↕</span>
    return <span className="ml-1 text-orange-500">{order === 'asc' ? '↑' : '↓'}</span>
  }

  const stats = data?.stats

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TopBar title="Produtos" />

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {/* ── Stats Cards ── */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: 'Total', value: stats?.total ?? '—', onClick: () => pushUrl({ visibility: '', stockStatus: '' }) },
            { label: 'Activos', value: stats?.active ?? '—', color: 'text-green-600', onClick: () => pushUrl({ visibility: 'visible', stockStatus: '' }) },
            { label: 'Stock baixo', value: stats?.lowStock ?? '—', color: 'text-orange-500', onClick: () => pushUrl({ stockStatus: 'low', visibility: '' }) },
            { label: 'Esgotados', value: stats?.outOfStock ?? '—', color: 'text-red-600', onClick: () => pushUrl({ stockStatus: 'out', visibility: '' }) },
            { label: 'Arquivados', value: stats?.archived ?? '—', color: 'text-gray-400', onClick: () => pushUrl({ visibility: 'archived', stockStatus: '' }) },
          ].map(card => (
            <button key={card.label} onClick={card.onClick}
              className="bg-white border border-gray-200 rounded-xl p-4 text-left hover:border-orange-300 hover:shadow-sm transition-all">
              <p className="text-xs text-gray-500 mb-1">{card.label}</p>
              <p className={`text-2xl font-bold ${card.color ?? 'text-gray-900'}`}>{card.value}</p>
            </button>
          ))}
        </div>

        {/* ── Main Panel ── */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-3 p-4 border-b border-gray-200">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                placeholder="Pesquisar nome, SKU, marca, código de barras…"
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              {searchInput && (
                <button onClick={() => { setSearchInput(''); pushUrl({ q: '' }) }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filters */}
            <select value={categoryId} onChange={e => pushUrl({ categoryId: e.target.value })}
              className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-700">
              <option value="">Todas categorias</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>

            <select value={visibility} onChange={e => pushUrl({ visibility: e.target.value })}
              className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-700">
              <option value="">Visibilidade</option>
              <option value="visible">Visível</option>
              <option value="hidden">Oculto</option>
              <option value="archived">Arquivado</option>
              <option value="catalog_only">Só catálogo</option>
              <option value="members_only">Membros</option>
            </select>

            <select value={condition} onChange={e => pushUrl({ condition: e.target.value })}
              className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-700">
              <option value="">Estado</option>
              <option value="Novo">Novo</option>
              <option value="Como Novo">Como Novo</option>
              <option value="Bom Estado">Bom Estado</option>
              <option value="Recondicionado">Recondicionado</option>
              <option value="Para Peças">Para Peças</option>
            </select>

            <select value={stockStatus} onChange={e => pushUrl({ stockStatus: e.target.value })}
              className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-700">
              <option value="">Stock</option>
              <option value="ok">Em stock</option>
              <option value="low">Stock baixo</option>
              <option value="out">Esgotado</option>
            </select>

            {/* Active filter chips */}
            {(q || categoryId || visibility || condition || stockStatus) && (
              <button onClick={() => { setSearchInput(''); router.push(pathname) }}
                className="flex items-center gap-1 text-xs text-orange-600 hover:text-orange-800 border border-orange-200 rounded-lg px-2 py-1.5">
                <X className="w-3 h-3" /> Limpar filtros
              </button>
            )}

            <div className="flex-1" />

            <button onClick={fetchData} className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg" title="Actualizar">
              <RefreshCw className="w-4 h-4" />
            </button>
            <button onClick={() => {}} className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg" title="Exportar">
              <Download className="w-4 h-4" />
            </button>
            <Link href="/admin/produtos/novo">
              <Button className="gap-2"><Plus className="w-4 h-4" /> Novo Produto</Button>
            </Link>
          </div>

          {/* Bulk Actions Bar */}
          {selected.size > 0 && (
            <BulkBar count={selected.size} onBulkAction={bulkAction} onClear={() => setSelected(new Set())} />
          )}

          {/* Table */}
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
              <p className="mt-2 text-sm text-gray-500">A carregar produtos…</p>
            </div>
          ) : !data?.products.length ? (
            <div className="py-16 text-center">
              <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500">Nenhum produto encontrado.</p>
              {(q || categoryId || visibility) && (
                <button onClick={() => router.push(pathname)} className="mt-3 text-sm text-orange-600 hover:underline">
                  Limpar filtros
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-gray-200 bg-gray-50">
                  <tr>
                    <th className="py-3 px-4 w-10">
                      <button onClick={toggleAll} className="text-gray-400 hover:text-orange-500">
                        {allSelected ? <CheckSquare className="w-4 h-4 text-orange-500" /> : <Square className="w-4 h-4" />}
                      </button>
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">
                      <button onClick={() => toggleSort('name')} className="flex items-center hover:text-gray-700">
                        Produto <SortIcon field="name" />
                      </button>
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Categoria</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">
                      <button onClick={() => toggleSort('price')} className="flex items-center hover:text-gray-700">
                        Preço <SortIcon field="price" />
                      </button>
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">
                      <button onClick={() => toggleSort('stock')} className="flex items-center hover:text-gray-700">
                        Stock <SortIcon field="stock" />
                      </button>
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase hidden lg:table-cell">Estado</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase hidden xl:table-cell">
                      <button onClick={() => toggleSort('updatedAt')} className="flex items-center hover:text-gray-700">
                        Actualizado <SortIcon field="updatedAt" />
                      </button>
                    </th>
                    <th className="py-3 px-4 w-12" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.products.map(p => {
                    const vis = VISIBILITY_LABELS[p.visibility] ?? { label: p.visibility, color: 'bg-gray-100 text-gray-600' }
                    const isSelected = selected.has(p.id)
                    const margin = p.purchasePrice
                      ? (((Number(p.salePrice ?? p.price) - Number(p.purchasePrice)) / Number(p.salePrice ?? p.price)) * 100).toFixed(0)
                      : null

                    return (
                      <tr
                        key={p.id}
                        className={`group hover:bg-orange-50/40 transition-colors ${isSelected ? 'bg-orange-50' : ''}`}
                        onContextMenu={e => { e.preventDefault(); setCtxMenu({ x: e.clientX, y: e.clientY, product: p }) }}
                      >
                        {/* Checkbox */}
                        <td className="py-3 px-4">
                          <button onClick={() => toggleOne(p.id)} className="text-gray-300 hover:text-orange-500">
                            {isSelected
                              ? <CheckSquare className="w-4 h-4 text-orange-500" />
                              : <Square className="w-4 h-4" />}
                          </button>
                        </td>

                        {/* Product info */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 relative bg-gray-100 rounded-xl flex-shrink-0 overflow-hidden border border-gray-200">
                              {p.images[0] ? (
                                <Image src={p.images[0]} alt={p.name} fill className="object-contain p-1" sizes="48px" />
                              ) : (
                                <Package className="w-5 h-5 text-gray-400 absolute inset-0 m-auto" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <Link href={`/admin/produtos/${p.id}`}
                                  className="font-medium text-gray-900 hover:text-orange-600 line-clamp-1 transition-colors">
                                  {p.name}
                                </Link>
                                {p.featured && <Star className="w-3.5 h-3.5 fill-orange-400 text-orange-400 flex-shrink-0" />}
                                {p._count.variants > 0 && (
                                  <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">
                                    {p._count.variants}v
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-xs text-gray-400 font-mono">{p.sku}</span>
                                <span className="text-gray-300">·</span>
                                <span className="text-xs text-gray-400">{p.brand}</span>
                              </div>
                              {/* Visibility badge inline for mobile */}
                              <span className={`inline-block mt-1 text-xs px-1.5 py-0.5 rounded-full font-medium lg:hidden ${vis.color}`}>
                                {vis.label}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="py-3 px-4 text-gray-600 text-xs hidden md:table-cell">
                          {p.category.name}
                        </td>

                        {/* Price */}
                        <td className="py-3 px-4">
                          {p.salePrice ? (
                            <div>
                              <p className="font-semibold text-orange-500">{fmt(Number(p.salePrice))}</p>
                              <p className="text-xs text-gray-400 line-through">{fmt(Number(p.price))}</p>
                            </div>
                          ) : (
                            <p className="font-semibold text-gray-900">{fmt(Number(p.price))}</p>
                          )}
                          {margin && (
                            <p className="text-xs text-emerald-600 font-medium">M: {margin}%</p>
                          )}
                        </td>

                        {/* Stock */}
                        <td className="py-3 px-4">
                          <div className="flex flex-col gap-0.5">
                            <span className={`font-semibold text-sm ${p.stock === 0 ? 'text-red-600' : p.stock <= p.minStock ? 'text-orange-500' : 'text-gray-900'}`}>
                              {p.stock}
                            </span>
                            {p.stock === 0 && (
                              <span className="inline-flex items-center gap-1 text-xs text-red-500">
                                <AlertTriangle className="w-3 h-3" /> Esgotado
                              </span>
                            )}
                            {p.stock > 0 && p.stock <= p.minStock && (
                              <span className="text-xs text-orange-400">↓ Mínimo {p.minStock}</span>
                            )}
                          </div>
                        </td>

                        {/* Condition + visibility */}
                        <td className="py-3 px-4 hidden lg:table-cell">
                          <div className="flex flex-col gap-1">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium w-fit ${vis.color}`}>
                              {vis.label}
                            </span>
                            {p.condition !== 'Novo' && (
                              <span className="text-xs text-gray-400">{p.condition}</span>
                            )}
                          </div>
                        </td>

                        {/* Updated */}
                        <td className="py-3 px-4 text-xs text-gray-400 hidden xl:table-cell">
                          {fmtDate(p.updatedAt)}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Link href={`/admin/produtos/${p.id}`}>
                              <button className="p-1.5 rounded-lg hover:bg-orange-100 text-gray-500 hover:text-orange-600" title="Editar">
                                <Edit className="w-4 h-4" />
                              </button>
                            </Link>
                            <button
                              onClick={e => { e.stopPropagation(); setCtxMenu({ x: e.clientX, y: e.clientY, product: p }) }}
                              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700"
                              title="Mais acções"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {data && data.pages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
              <p className="text-xs text-gray-500">
                Página {data.page} de {data.pages} · {data.total} produtos
              </p>
              <div className="flex items-center gap-1">
                <button
                  disabled={page <= 1}
                  onClick={() => pushUrl({ page: String(page - 1) })}
                  className="p-1.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: Math.min(data.pages, 7) }, (_, i) => {
                  const pg = i + 1
                  return (
                    <button key={pg}
                      onClick={() => pushUrl({ page: String(pg) })}
                      className={`w-8 h-8 rounded-lg text-sm font-medium border transition-colors
                        ${pg === page ? 'bg-orange-500 text-white border-orange-500' : 'bg-white border-gray-300 hover:bg-gray-50 text-gray-700'}`}>
                      {pg}
                    </button>
                  )
                })}
                <button
                  disabled={page >= data.pages}
                  onClick={() => pushUrl({ page: String(page + 1) })}
                  className="p-1.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Context Menu */}
      {ctxMenu && (
        <ContextMenu
          x={ctxMenu.x}
          y={ctxMenu.y}
          product={ctxMenu.product}
          onClose={() => setCtxMenu(null)}
          onAction={rowAction}
        />
      )}
    </div>
  )
}
