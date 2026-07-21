'use client'

import { useState, useCallback, useRef, useEffect, useTransition } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Edit, Package, Archive, Trash2, Eye, EyeOff,
  ChevronLeft, ChevronRight, MoreVertical, CheckSquare, Square,
  Star, Copy, ExternalLink, AlertTriangle, X, ChevronDown, Filter,
} from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ProductRow {
  id: string
  name: string
  slug: string
  brand: string
  sku: string
  images: string[]
  price: number | string
  salePrice?: number | string | null
  purchasePrice?: number | string | null
  stock: number
  minStock: number
  featured: boolean
  visibility: string
  condition: string
  updatedAt: Date | string
  category: { name: string }
}

export interface Stats {
  total: number
  active: number
  archived: number
  outOfStock: number
  lowStock: number
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const VISIBILITY_LABELS: Record<string, { label: string; color: string }> = {
  visible:        { label: 'Visível',     color: 'bg-green-100 text-green-700' },
  hidden:         { label: 'Oculto',      color: 'bg-gray-100 text-gray-600' },
  maintenance:    { label: 'Manutenção',  color: 'bg-yellow-100 text-yellow-700' },
  out_of_stock:   { label: 'Esgotado',    color: 'bg-red-100 text-red-600' },
  catalog_only:   { label: 'Catálogo',    color: 'bg-blue-100 text-blue-700' },
  members_only:   { label: 'Membros',     color: 'bg-purple-100 text-purple-700' },
  affiliates_only:{ label: 'Afiliados',   color: 'bg-indigo-100 text-indigo-700' },
  archived:       { label: 'Arquivado',   color: 'bg-gray-200 text-gray-500' },
}

function fmt(n: number | string) {
  return new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA', maximumFractionDigits: 0 }).format(Number(n))
}
function fmtDate(s: Date | string) {
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
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose() }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [onClose])

  const left = Math.min(x, (typeof window !== 'undefined' ? window.innerWidth : 800) - 210)
  const top  = Math.min(y, (typeof window !== 'undefined' ? window.innerHeight : 600) - 290)

  return (
    <div ref={ref} className="fixed z-50 bg-white border border-gray-200 rounded-xl shadow-xl py-1 w-52 text-sm" style={{ left, top }}>
      <Link href={`/admin/produtos/${product.id}`} onClick={onClose}>
        <div className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-gray-700 cursor-pointer">
          <Edit className="w-4 h-4" /> Editar
        </div>
      </Link>
      <button onClick={() => { onAction('duplicate', product.id); onClose() }}
        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-gray-700">
        <Copy className="w-4 h-4" /> Duplicar
      </button>
      <Link href={`/produtos/${product.slug}`} target="_blank" onClick={onClose}>
        <div className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-gray-700 cursor-pointer">
          <ExternalLink className="w-4 h-4" /> Ver na loja
        </div>
      </Link>
      <div className="border-t border-gray-100 my-1" />
      <button onClick={() => { onAction('featured', product.id); onClose() }}
        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-gray-700">
        <Star className={`w-4 h-4 ${product.featured ? 'fill-orange-400 text-orange-400' : ''}`} />
        {product.featured ? 'Remover destaque' : 'Marcar destaque'}
      </button>
      <button onClick={() => { onAction(product.visibility === 'archived' ? 'unarchive' : 'archive', product.id); onClose() }}
        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-gray-700">
        <Archive className="w-4 h-4" />
        {product.visibility === 'archived' ? 'Desarquivar' : 'Arquivar'}
      </button>
      <div className="border-t border-gray-100 my-1" />
      <button onClick={() => { onAction('delete', product.id); onClose() }}
        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-red-50 text-red-600">
        <Trash2 className="w-4 h-4" /> Eliminar
      </button>
    </div>
  )
}

// ── Bulk Bar ─────────────────────────────────────────────────────────────────

function BulkBar({ count, onAction, onClear }: {
  count: number
  onAction: (a: string, v?: string) => void
  onClear: () => void
}) {
  const [visMenu, setVisMenu] = useState(false)
  return (
    <div className="flex flex-wrap items-center gap-2 px-4 py-2 bg-orange-50 border-b border-orange-200">
      <button onClick={onClear} className="text-orange-600 hover:text-orange-800"><X className="w-4 h-4" /></button>
      <span className="text-sm font-medium text-orange-700">{count} seleccionado{count !== 1 ? 's' : ''}</span>
      <div className="h-4 w-px bg-orange-300 mx-1" />
      {[
        { a: 'archive',    icon: Archive, label: 'Arquivar' },
        { a: 'activate',   icon: Eye,     label: 'Activar' },
        { a: 'deactivate', icon: EyeOff,  label: 'Desactivar' },
      ].map(({ a, icon: Icon, label }) => (
        <button key={a} onClick={() => onAction(a)}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-gray-700">
          <Icon className="w-3.5 h-3.5" /> {label}
        </button>
      ))}
      <div className="relative">
        <button onClick={() => setVisMenu(v => !v)}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-gray-700">
          <Filter className="w-3.5 h-3.5" /> Visibilidade <ChevronDown className="w-3 h-3" />
        </button>
        {visMenu && (
          <div className="absolute top-full left-0 mt-1 w-44 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1">
            {['visible','hidden','catalog_only','members_only'].map(v => (
              <button key={v} onClick={() => { onAction('visibility', v); setVisMenu(false) }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50">
                {VISIBILITY_LABELS[v]?.label ?? v}
              </button>
            ))}
          </div>
        )}
      </div>
      <button onClick={() => onAction('delete')}
        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-red-200 bg-white hover:bg-red-50 text-red-600">
        <Trash2 className="w-3.5 h-3.5" /> Eliminar
      </button>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

interface Props {
  products: ProductRow[]
  total: number
  pages: number
  page: number
  stats: Stats
  categories: { id: string; name: string }[]
}

export function ProductsCatalog({ products: initialProducts, total, pages, page, stats, categories }: Props) {
  const router   = useRouter()
  const pathname = usePathname()
  const sp       = useSearchParams()
  const [, startTransition] = useTransition()

  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [ctxMenu, setCtxMenu]   = useState<{ x: number; y: number; product: ProductRow } | null>(null)
  const [searchInput, setSearchInput] = useState(sp.get('q') ?? '')

  // Push URL params
  const pushUrl = useCallback((updates: Record<string, string>) => {
    const params = new URLSearchParams(sp.toString())
    Object.entries(updates).forEach(([k, v]) => { if (v) params.set(k, v); else params.delete(k) })
    if (!updates.page) params.delete('page')
    if (updates.page) params.set('page', updates.page)
    startTransition(() => router.push(`${pathname}?${params.toString()}`))
  }, [sp, router, pathname])

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      const current = sp.get('q') ?? ''
      if (searchInput !== current) pushUrl({ q: searchInput })
    }, 400)
    return () => clearTimeout(t)
  }, [searchInput]) // eslint-disable-line react-hooks/exhaustive-deps

  // Sync search input with URL
  useEffect(() => { setSearchInput(sp.get('q') ?? '') }, [sp])

  // Selection
  const allIds = initialProducts.map(p => p.id)
  const allSelected = allIds.length > 0 && allIds.every(id => selected.has(id))
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(allIds))
  const toggleOne = (id: string) => setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })

  // Bulk + row actions via API
  const doAction = useCallback(async (action: string, ids: string[], value?: string) => {
    if (action === 'delete' && !confirm(`${ids.length > 1 ? `Arquivar ${ids.length} produtos` : 'Arquivar este produto'}?`)) return
    if (action === 'duplicate') { router.push(`/admin/produtos/novo?duplicateFrom=${ids[0]}`); return }
    await fetch('/api/admin/products', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids, action, value }),
    })
    setSelected(new Set())
    startTransition(() => router.refresh())
  }, [router])

  const bulkAction = (a: string, v?: string) => doAction(a, [...selected], v)
  const rowAction  = (a: string, id: string) => doAction(a, [id])

  // Sort
  const sort  = sp.get('sort') ?? 'updatedAt'
  const order = sp.get('order') ?? 'desc'
  const SortBtn = ({ field }: { field: string }) => (
    <button onClick={() => pushUrl({ sort: field, order: sort === field && order === 'desc' ? 'asc' : 'desc' })}
      className="flex items-center gap-1 hover:text-gray-700">
      {field === 'name' ? 'Produto' : field === 'price' ? 'Preço' : field === 'stock' ? 'Stock' : 'Actualizado'}
      <span className={sort === field ? 'text-orange-500' : 'text-gray-300'}>
        {sort === field ? (order === 'asc' ? '↑' : '↓') : '↕'}
      </span>
    </button>
  )

  return (
    <>
      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: 'Total',       value: stats.total,      color: '',                  filter: {} },
          { label: 'Activos',     value: stats.active,     color: 'text-green-600',    filter: { visibility: 'visible' } },
          { label: 'Stock baixo', value: stats.lowStock,   color: 'text-orange-500',   filter: { stockStatus: 'low' } },
          { label: 'Esgotados',   value: stats.outOfStock, color: 'text-red-600',      filter: { stockStatus: 'out' } },
          { label: 'Arquivados',  value: stats.archived,   color: 'text-gray-400',     filter: { visibility: 'archived' } },
        ].map(card => (
          <button key={card.label} onClick={() => pushUrl(card.filter)}
            className="bg-white border border-gray-200 rounded-xl p-4 text-left hover:border-orange-300 hover:shadow-sm transition-all">
            <p className="text-xs text-gray-500 mb-1">{card.label}</p>
            <p className={`text-2xl font-bold ${card.color || 'text-gray-900'}`}>{card.value}</p>
          </button>
        ))}
      </div>

      {/* Table Panel */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3 p-4 border-b border-gray-200">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" /></svg>
            <input value={searchInput} onChange={e => setSearchInput(e.target.value)}
              placeholder="Pesquisar nome, SKU, marca, código de barras…"
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500" />
            {searchInput && (
              <button onClick={() => { setSearchInput(''); pushUrl({ q: '' }) }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filters */}
          <select defaultValue={sp.get('categoryId') ?? ''} onChange={e => pushUrl({ categoryId: e.target.value })}
            className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-700">
            <option value="">Todas categorias</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>

          <select defaultValue={sp.get('visibility') ?? ''} onChange={e => pushUrl({ visibility: e.target.value })}
            className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-700">
            <option value="">Visibilidade</option>
            {Object.entries(VISIBILITY_LABELS).map(([v, { label }]) => <option key={v} value={v}>{label}</option>)}
          </select>

          <select defaultValue={sp.get('condition') ?? ''} onChange={e => pushUrl({ condition: e.target.value })}
            className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-700">
            <option value="">Estado</option>
            {['Novo','Como Novo','Bom Estado','Recondicionado','Para Peças'].map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          <select defaultValue={sp.get('stockStatus') ?? ''} onChange={e => pushUrl({ stockStatus: e.target.value })}
            className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-700">
            <option value="">Stock</option>
            <option value="ok">Em stock</option>
            <option value="low">Stock baixo</option>
            <option value="out">Esgotado</option>
          </select>

          {(sp.get('q') || sp.get('categoryId') || sp.get('visibility') || sp.get('condition') || sp.get('stockStatus')) && (
            <button onClick={() => router.push(pathname)}
              className="flex items-center gap-1 text-xs text-orange-600 hover:text-orange-800 border border-orange-200 rounded-lg px-2 py-1.5">
              <X className="w-3 h-3" /> Limpar
            </button>
          )}

          <div className="flex-1" />
          <Link href="/admin/produtos/novo">
            <Button className="gap-2">+ Novo Produto</Button>
          </Link>
        </div>

        {/* Bulk Bar */}
        {selected.size > 0 && <BulkBar count={selected.size} onAction={bulkAction} onClear={() => setSelected(new Set())} />}

        {/* Table */}
        {initialProducts.length === 0 ? (
          <div className="py-16 text-center">
            <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500">Nenhum produto encontrado.</p>
            {(sp.get('q') || sp.get('visibility')) && (
              <button onClick={() => router.push(pathname)} className="mt-3 text-sm text-orange-600 hover:underline">Limpar filtros</button>
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
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase"><SortBtn field="name" /></th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Categoria</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase"><SortBtn field="price" /></th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase"><SortBtn field="stock" /></th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase hidden lg:table-cell">Estado</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase hidden xl:table-cell"><SortBtn field="updatedAt" /></th>
                  <th className="py-3 px-4 w-24 text-left text-xs font-semibold text-gray-500 uppercase">Acções</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {initialProducts.map(p => {
                  const vis = VISIBILITY_LABELS[p.visibility] ?? { label: p.visibility, color: 'bg-gray-100 text-gray-600' }
                  const isSel = selected.has(p.id)
                  const margin = p.purchasePrice && Number(p.purchasePrice) > 0
                    ? (((Number(p.salePrice ?? p.price) - Number(p.purchasePrice)) / Number(p.salePrice ?? p.price)) * 100).toFixed(0)
                    : null

                  return (
                    <tr key={p.id}
                      className={`group hover:bg-orange-50/40 transition-colors ${isSel ? 'bg-orange-50' : ''}`}
                      onContextMenu={e => { e.preventDefault(); setCtxMenu({ x: e.clientX, y: e.clientY, product: p }) }}>

                      <td className="py-3 px-4">
                        <button onClick={() => toggleOne(p.id)} className="text-gray-300 hover:text-orange-500">
                          {isSel ? <CheckSquare className="w-4 h-4 text-orange-500" /> : <Square className="w-4 h-4" />}
                        </button>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 relative bg-gray-100 rounded-xl flex-shrink-0 overflow-hidden border border-gray-200">
                            {p.images[0]
                              ? <Image src={p.images[0]} alt={p.name} fill className="object-contain p-1" sizes="48px" />
                              : <Package className="w-5 h-5 text-gray-400 absolute inset-0 m-auto" />}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <Link href={`/admin/produtos/${p.id}`}
                                className="font-medium text-gray-900 hover:text-orange-600 line-clamp-1 transition-colors">
                                {p.name}
                              </Link>
                              {p.featured && <Star className="w-3.5 h-3.5 fill-orange-400 text-orange-400 flex-shrink-0" />}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs text-gray-400 font-mono">{p.sku}</span>
                              <span className="text-gray-300">·</span>
                              <span className="text-xs text-gray-400">{p.brand}</span>
                            </div>
                            <span className={`inline-block mt-1 text-xs px-1.5 py-0.5 rounded-full font-medium lg:hidden ${vis.color}`}>
                              {vis.label}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-gray-600 text-xs hidden md:table-cell">{p.category.name}</td>

                      <td className="py-3 px-4">
                        {p.salePrice ? (
                          <div>
                            <p className="font-semibold text-orange-500">{fmt(p.salePrice)}</p>
                            <p className="text-xs text-gray-400 line-through">{fmt(p.price)}</p>
                          </div>
                        ) : (
                          <p className="font-semibold text-gray-900">{fmt(p.price)}</p>
                        )}
                        {margin && <p className="text-xs text-emerald-600 font-medium">M: {margin}%</p>}
                      </td>

                      <td className="py-3 px-4">
                        <span className={`font-semibold text-sm ${p.stock === 0 ? 'text-red-600' : p.stock <= p.minStock ? 'text-orange-500' : 'text-gray-900'}`}>
                          {p.stock}
                        </span>
                        {p.stock === 0 && (
                          <div className="flex items-center gap-1 text-xs text-red-500 mt-0.5">
                            <AlertTriangle className="w-3 h-3" /> Esgotado
                          </div>
                        )}
                        {p.stock > 0 && p.stock <= p.minStock && (
                          <p className="text-xs text-orange-400">↓ mín {p.minStock}</p>
                        )}
                      </td>

                      <td className="py-3 px-4 hidden lg:table-cell">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${vis.color}`}>{vis.label}</span>
                        {p.condition !== 'Novo' && <p className="text-xs text-gray-400 mt-0.5">{p.condition}</p>}
                      </td>

                      <td className="py-3 px-4 text-xs text-gray-400 hidden xl:table-cell">{fmtDate(p.updatedAt)}</td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          <Link href={`/admin/produtos/${p.id}`}>
                            <button className="p-1.5 rounded-lg border border-gray-200 hover:bg-orange-100 hover:border-orange-300 text-gray-500 hover:text-orange-600 transition-colors" title="Editar produto">
                              <Edit className="w-4 h-4" />
                            </button>
                          </Link>
                          <button onClick={e => { e.stopPropagation(); setCtxMenu({ x: e.clientX, y: e.clientY, product: p }) }}
                            className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors" title="Mais acções">
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
        {pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
            <p className="text-xs text-gray-500">Página {page} de {pages} · {total} produtos</p>
            <div className="flex items-center gap-1">
              <button disabled={page <= 1} onClick={() => pushUrl({ page: String(page - 1) })}
                className="p-1.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-40">
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: Math.min(pages, 7) }, (_, i) => i + 1).map(pg => (
                <button key={pg} onClick={() => pushUrl({ page: String(pg) })}
                  className={`w-8 h-8 rounded-lg text-sm font-medium border transition-colors ${pg === page ? 'bg-orange-500 text-white border-orange-500' : 'bg-white border-gray-300 hover:bg-gray-50 text-gray-700'}`}>
                  {pg}
                </button>
              ))}
              <button disabled={page >= pages} onClick={() => pushUrl({ page: String(page + 1) })}
                className="p-1.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-40">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Context Menu */}
      {ctxMenu && (
        <ContextMenu x={ctxMenu.x} y={ctxMenu.y} product={ctxMenu.product}
          onClose={() => setCtxMenu(null)} onAction={rowAction} />
      )}
    </>
  )
}
