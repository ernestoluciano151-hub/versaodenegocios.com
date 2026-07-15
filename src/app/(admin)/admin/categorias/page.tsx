'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Search, Plus, Pencil, Trash2, Eye, EyeOff, Star, Tag,
  ChevronLeft, ChevronRight, Loader2, Copy, MoreHorizontal,
  Package, FolderOpen, AlertTriangle, X, CheckSquare,
} from 'lucide-react'
import { TopBar } from '@/components/admin/TopBar'
import { useToast } from '@/components/ui/toast'
import { Switch } from '@/components/ui/switch'
import { CategoryForm } from './CategoryForm'

// ─── Types ────────────────────────────────────────────────────────────────────

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

type Stats = {
  total: number
  active: number
  inactive: number
  visible: number
  hidden: number
  featured: number
  withProducts: number
  withoutProducts: number
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-200 rounded ${className ?? ''}`} />
}

// ─── Stats Cards ──────────────────────────────────────────────────────────────

function StatsBar({ stats, loading }: { stats: Stats | null; loading: boolean }) {
  const cards = [
    { label: 'Total Categorias', value: stats?.total, icon: FolderOpen, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Ativas', value: stats?.active, icon: CheckSquare, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Ocultas', value: stats?.hidden, icon: EyeOff, color: 'text-gray-600', bg: 'bg-gray-100' },
    { label: 'Em Destaque', value: stats?.featured, icon: Star, color: 'text-orange-600', bg: 'bg-orange-50' },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map(card => (
        <div key={card.label} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg ${card.bg} flex items-center justify-center flex-shrink-0`}>
            <card.icon className={`w-5 h-5 ${card.color}`} />
          </div>
          <div>
            <p className="text-xs text-gray-500">{card.label}</p>
            {loading ? (
              <Skeleton className="h-6 w-12 mt-1" />
            ) : (
              <p className="text-xl font-bold text-gray-900">{card.value ?? 0}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────

function DeleteModal({
  category,
  onConfirm,
  onCancel,
  loading,
}: {
  category: Category
  onConfirm: () => void
  onCancel: () => void
  loading: boolean
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
      <div className="relative z-10 bg-white rounded-2xl shadow-xl p-6 max-w-md w-full mx-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Eliminar Categoria</h3>
            <p className="text-sm text-gray-500">Esta acção não pode ser desfeita</p>
          </div>
        </div>
        <p className="text-sm text-gray-700 mb-1">
          Tem a certeza que quer eliminar <strong className="text-gray-900">"{category.name}"</strong>?
        </p>
        <p className="text-sm text-gray-500 mb-6">
          Esta categoria e os seus produtos ficarão ocultos. Os produtos não serão eliminados.
        </p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center gap-1.5"
          >
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Eliminar
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Table Skeleton ───────────────────────────────────────────────────────────

function TableSkeleton() {
  return (
    <div className="divide-y divide-gray-100">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-3">
          <Skeleton className="w-4 h-4 rounded" />
          <Skeleton className="w-10 h-10 rounded-lg flex-shrink-0" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-5 w-14 rounded-full" />
          <Skeleton className="h-7 w-16 rounded-lg" />
          <Skeleton className="h-7 w-16 rounded-lg" />
          <Skeleton className="h-7 w-12 rounded-lg" />
          <Skeleton className="h-7 w-7 rounded-lg" />
          <Skeleton className="h-7 w-7 rounded-lg" />
          <Skeleton className="h-7 w-7 rounded-lg" />
        </div>
      ))}
    </div>
  )
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ hasFilters, onNew }: { hasFilters: boolean; onNew: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <Tag className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-base font-semibold text-gray-900 mb-1">
        {hasFilters ? 'Nenhuma categoria encontrada' : 'Ainda não há categorias'}
      </h3>
      <p className="text-sm text-gray-500 mb-6 max-w-xs">
        {hasFilters
          ? 'Tente ajustar os filtros de pesquisa.'
          : 'Crie a sua primeira categoria para organizar os produtos da loja.'}
      </p>
      {!hasFilters && (
        <button
          onClick={onNew}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg"
        >
          <Plus className="w-4 h-4" />
          Nova Categoria
        </button>
      )}
    </div>
  )
}

// ─── Inline Order Edit ────────────────────────────────────────────────────────

function OrderCell({ category, onSave }: { category: Category; onSave: (id: string, order: number) => void }) {
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(String(category.displayOrder))
  const ref = useRef<HTMLInputElement>(null)

  function commit() {
    const num = parseInt(val, 10)
    if (!isNaN(num) && num !== category.displayOrder) {
      onSave(category.id, num)
    }
    setEditing(false)
  }

  if (editing) {
    return (
      <input
        ref={ref}
        type="number"
        value={val}
        onChange={e => setVal(e.target.value)}
        onBlur={commit}
        onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false) }}
        autoFocus
        className="w-16 px-2 py-1 text-sm border border-orange-400 rounded focus:outline-none focus:ring-1 focus:ring-orange-500"
      />
    )
  }

  return (
    <button
      onClick={() => { setVal(String(category.displayOrder)); setEditing(true) }}
      className="px-2 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded border border-transparent hover:border-gray-300 min-w-[2.5rem] text-center"
      title="Clique para editar ordem"
    >
      {category.displayOrder}
    </button>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CategoriasAdminPage() {
  const { addToast } = useToast()

  // Data state
  const [categories, setCategories] = useState<Category[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [flatParents, setFlatParents] = useState<{ id: string; name: string; slug: string }[]>([])

  // Filter state
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterVisible, setFilterVisible] = useState('')
  const [filterFeatured, setFilterFeatured] = useState('')
  const [page, setPage] = useState(1)
  const LIMIT = 20

  // UI state
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null | undefined>(undefined)
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [bulkLoading, setBulkLoading] = useState(false)

  // Debounced search
  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [debouncedSearch, setDebouncedSearch] = useState('')

  useEffect(() => {
    if (searchDebounce.current) clearTimeout(searchDebounce.current)
    searchDebounce.current = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 300)
    return () => { if (searchDebounce.current) clearTimeout(searchDebounce.current) }
  }, [search])

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (debouncedSearch) params.set('search', debouncedSearch)
      if (filterStatus) params.set('status', filterStatus)
      if (filterVisible) params.set('visible', filterVisible)
      if (filterFeatured) params.set('featured', filterFeatured)
      params.set('page', String(page))
      params.set('limit', String(LIMIT))

      const res = await fetch(`/api/admin/categories?${params.toString()}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setCategories(data.categories ?? [])
      setTotal(data.total ?? 0)
      setTotalPages(data.totalPages ?? 1)
      if (data.stats) setStats(data.stats)
    } catch {
      addToast('error', 'Erro ao carregar categorias')
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, filterStatus, filterVisible, filterFeatured, page, addToast])

  useEffect(() => { fetchCategories() }, [fetchCategories])

  // Fetch flat list for parent select
  useEffect(() => {
    fetch('/api/admin/categories?limit=200')
      .then(r => r.json())
      .then(d => {
        setFlatParents((d.categories ?? []).map((c: Category) => ({ id: c.id, name: c.name, slug: c.slug })))
      })
      .catch(() => {})
  }, [])

  // Selection helpers
  const allSelected = categories.length > 0 && categories.every(c => selected.has(c.id))
  const someSelected = selected.size > 0

  function toggleAll() {
    if (allSelected) {
      setSelected(new Set())
    } else {
      setSelected(new Set(categories.map(c => c.id)))
    }
  }

  function toggleOne(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  // Toggle active
  async function toggleActive(cat: Category) {
    setTogglingId(cat.id)
    try {
      const res = await fetch(`/api/admin/categories/${cat.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !cat.active }),
      })
      if (!res.ok) throw new Error()
      setCategories(prev => prev.map(c => c.id === cat.id ? { ...c, active: !c.active } : c))
      if (stats) setStats({ ...stats, active: stats.active + (cat.active ? -1 : 1), inactive: stats.inactive + (cat.active ? 1 : -1) })
    } catch {
      addToast('error', 'Erro ao actualizar estado')
    } finally {
      setTogglingId(null)
    }
  }

  // Toggle visibility
  async function toggleVisible(cat: Category) {
    setTogglingId(cat.id + '_v')
    try {
      const res = await fetch(`/api/admin/categories/${cat.id}/visibility`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isVisible: !cat.isVisible }),
      })
      if (!res.ok) throw new Error()
      setCategories(prev => prev.map(c => c.id === cat.id ? { ...c, isVisible: !c.isVisible } : c))
      if (stats) setStats({ ...stats, visible: stats.visible + (cat.isVisible ? -1 : 1), hidden: stats.hidden + (cat.isVisible ? 1 : -1) })
    } catch {
      addToast('error', 'Erro ao actualizar visibilidade')
    } finally {
      setTogglingId(null)
    }
  }

  // Toggle featured
  async function toggleFeatured(cat: Category) {
    setTogglingId(cat.id + '_f')
    try {
      const res = await fetch(`/api/admin/categories/${cat.id}/featured`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFeatured: !cat.isFeatured }),
      })
      if (!res.ok) throw new Error()
      setCategories(prev => prev.map(c => c.id === cat.id ? { ...c, isFeatured: !c.isFeatured } : c))
      if (stats) setStats({ ...stats, featured: stats.featured + (cat.isFeatured ? -1 : 1) })
    } catch {
      addToast('error', 'Erro ao actualizar destaque')
    } finally {
      setTogglingId(null)
    }
  }

  // Update order inline
  async function updateOrder(id: string, order: number) {
    try {
      await fetch('/api/admin/categories/reorder', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: [{ id, displayOrder: order }] }),
      })
      setCategories(prev => prev.map(c => c.id === id ? { ...c, displayOrder: order } : c))
    } catch {
      addToast('error', 'Erro ao actualizar ordem')
    }
  }

  // Delete
  async function handleDelete() {
    if (!deleteTarget) return
    setDeleteLoading(true)
    try {
      const res = await fetch(`/api/admin/categories/${deleteTarget.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      setCategories(prev => prev.filter(c => c.id !== deleteTarget.id))
      setTotal(t => t - 1)
      if (stats) setStats({ ...stats, total: stats.total - 1 })
      addToast('success', `Categoria "${deleteTarget.name}" eliminada`)
      setDeleteTarget(null)
    } catch {
      addToast('error', 'Erro ao eliminar categoria')
    } finally {
      setDeleteLoading(false)
    }
  }

  // Duplicate
  async function handleDuplicate(cat: Category) {
    try {
      const payload = {
        name: `${cat.name} (cópia)`,
        slug: `${cat.slug}-copia-${Date.now()}`,
        description: cat.description,
        parentId: cat.parentId,
        active: false,
        isVisible: false,
        isFeatured: false,
        displayOrder: cat.displayOrder + 1,
        color: cat.color,
        showInHomepage: cat.showInHomepage,
        showInMenu: cat.showInMenu,
        showInMobileMenu: cat.showInMobileMenu,
        showInFooter: cat.showInFooter,
      }
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error()
      const saved = await res.json()
      setCategories(prev => [saved, ...prev])
      addToast('success', 'Categoria duplicada')
    } catch {
      addToast('error', 'Erro ao duplicar categoria')
    }
  }

  // Bulk actions
  async function bulkAction(action: 'activate' | 'deactivate' | 'delete') {
    if (selected.size === 0) return
    setBulkLoading(true)
    try {
      const ids = Array.from(selected)
      if (action === 'delete') {
        await Promise.all(ids.map(id => fetch(`/api/admin/categories/${id}`, { method: 'DELETE' })))
        setCategories(prev => prev.filter(c => !selected.has(c.id)))
        setTotal(t => t - ids.length)
        addToast('success', `${ids.length} categorias eliminadas`)
      } else {
        const active = action === 'activate'
        await Promise.all(ids.map(id =>
          fetch(`/api/admin/categories/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ active }),
          })
        ))
        setCategories(prev => prev.map(c => selected.has(c.id) ? { ...c, active } : c))
        addToast('success', `${ids.length} categorias ${active ? 'activadas' : 'desactivadas'}`)
      }
      setSelected(new Set())
    } catch {
      addToast('error', 'Erro na acção em massa')
    } finally {
      setBulkLoading(false)
    }
  }

  // Drawer open/close
  function openNew() { setEditingCategory(null); setDrawerOpen(true) }
  function openEdit(cat: Category) { setEditingCategory(cat); setDrawerOpen(true) }
  function closeDrawer() { setDrawerOpen(false); setEditingCategory(undefined) }

  function handleSaved(saved: Category) {
    const isEdit = categories.some(c => c.id === saved.id)
    if (isEdit) {
      setCategories(prev => prev.map(c => c.id === saved.id ? saved : c))
      addToast('success', 'Categoria actualizada')
    } else {
      setCategories(prev => [saved, ...prev])
      setTotal(t => t + 1)
      if (stats) setStats({ ...stats, total: stats.total + 1, active: saved.active ? stats.active + 1 : stats.active })
      addToast('success', 'Categoria criada com sucesso')
    }
    closeDrawer()
  }

  const hasFilters = !!(debouncedSearch || filterStatus || filterVisible || filterFeatured)

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TopBar title="Categorias" />

      <div className="flex-1 overflow-y-auto p-6">
        {/* Stats */}
        <StatsBar stats={stats} loading={loading && !stats} />

        {/* Bulk Actions Bar */}
        {someSelected && (
          <div className="mb-4 flex items-center gap-3 bg-orange-50 border border-orange-200 rounded-xl px-4 py-3">
            <span className="text-sm font-medium text-orange-800">{selected.size} seleccionados</span>
            <div className="flex gap-2 ml-2">
              <button
                onClick={() => bulkAction('activate')}
                disabled={bulkLoading}
                className="px-3 py-1.5 text-xs font-medium bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
              >
                Activar
              </button>
              <button
                onClick={() => bulkAction('deactivate')}
                disabled={bulkLoading}
                className="px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Desactivar
              </button>
              <button
                onClick={() => bulkAction('delete')}
                disabled={bulkLoading}
                className="px-3 py-1.5 text-xs font-medium bg-red-100 text-red-700 rounded-lg hover:bg-red-200 flex items-center gap-1"
              >
                {bulkLoading && <Loader2 className="w-3 h-3 animate-spin" />}
                Eliminar selecionados
              </button>
            </div>
            <button onClick={() => setSelected(new Set())} className="ml-auto text-orange-600 hover:text-orange-800">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Main card */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-3 p-4 border-b border-gray-200">
            {/* Search */}
            <div className="relative flex-1 min-w-[180px] max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Pesquisar categorias..."
                className="pl-9 pr-4 py-2 w-full text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            {/* Filters */}
            <select
              value={filterStatus}
              onChange={e => { setFilterStatus(e.target.value); setPage(1) }}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
            >
              <option value="">Estado: Todos</option>
              <option value="active">Activas</option>
              <option value="inactive">Inactivas</option>
            </select>

            <select
              value={filterVisible}
              onChange={e => { setFilterVisible(e.target.value); setPage(1) }}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
            >
              <option value="">Visibilidade: Todas</option>
              <option value="visible">Visíveis</option>
              <option value="hidden">Ocultas</option>
            </select>

            <select
              value={filterFeatured}
              onChange={e => { setFilterFeatured(e.target.value); setPage(1) }}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
            >
              <option value="">Destaque: Todos</option>
              <option value="yes">Em Destaque</option>
              <option value="no">Sem Destaque</option>
            </select>

            {hasFilters && (
              <button
                onClick={() => { setSearch(''); setFilterStatus(''); setFilterVisible(''); setFilterFeatured(''); setPage(1) }}
                className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" /> Limpar
              </button>
            )}

            <div className="ml-auto">
              <button
                onClick={openNew}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg"
              >
                <Plus className="w-4 h-4" />
                Nova Categoria
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            {loading ? (
              <TableSkeleton />
            ) : categories.length === 0 ? (
              <EmptyState hasFilters={hasFilters} onNew={openNew} />
            ) : (
              <table className="w-full text-sm">
                <thead className="border-b border-gray-200 bg-gray-50">
                  <tr>
                    <th className="py-3 pl-4 pr-2 w-8">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={toggleAll}
                        className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                      />
                    </th>
                    <th className="py-3 px-3 w-12 text-left text-xs font-semibold text-gray-500 uppercase">Img</th>
                    <th className="py-3 px-3 text-left text-xs font-semibold text-gray-500 uppercase">Nome</th>
                    <th className="py-3 px-3 text-left text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Pai</th>
                    <th className="py-3 px-3 text-left text-xs font-semibold text-gray-500 uppercase hidden sm:table-cell">Produtos</th>
                    <th className="py-3 px-3 text-left text-xs font-semibold text-gray-500 uppercase">Estado</th>
                    <th className="py-3 px-3 text-center text-xs font-semibold text-gray-500 uppercase hidden lg:table-cell">Visível</th>
                    <th className="py-3 px-3 text-center text-xs font-semibold text-gray-500 uppercase hidden lg:table-cell">Destaque</th>
                    <th className="py-3 px-3 text-center text-xs font-semibold text-gray-500 uppercase hidden xl:table-cell">Ordem</th>
                    <th className="py-3 px-4 text-right text-xs font-semibold text-gray-500 uppercase">Acções</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {categories.map(cat => (
                    <tr key={cat.id} className={`hover:bg-gray-50 transition-colors ${selected.has(cat.id) ? 'bg-orange-50/40' : ''}`}>
                      {/* Checkbox */}
                      <td className="pl-4 pr-2 py-3 w-8">
                        <input
                          type="checkbox"
                          checked={selected.has(cat.id)}
                          onChange={() => toggleOne(cat.id)}
                          className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                        />
                      </td>

                      {/* Image */}
                      <td className="px-3 py-3">
                        <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden flex items-center justify-center flex-shrink-0">
                          {cat.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
                          ) : (
                            <Tag className="w-5 h-5 text-gray-300" />
                          )}
                        </div>
                      </td>

                      {/* Name + slug */}
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          {cat.color && (
                            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                          )}
                          <div>
                            <p className="font-medium text-gray-900 leading-tight">{cat.name}</p>
                            <p className="text-xs text-gray-400 mt-0.5">/{cat.slug}</p>
                          </div>
                        </div>
                      </td>

                      {/* Parent */}
                      <td className="px-3 py-3 hidden md:table-cell">
                        {cat.parent ? (
                          <span className="text-sm text-gray-600">{cat.parent.name}</span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>

                      {/* Products count */}
                      <td className="px-3 py-3 hidden sm:table-cell">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cat._count.products > 0 ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                          <Package className="w-3 h-3" />
                          {cat._count.products}
                        </span>
                      </td>

                      {/* Active toggle */}
                      <td className="px-3 py-3">
                        <button
                          onClick={() => toggleActive(cat)}
                          disabled={togglingId === cat.id}
                          className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                            cat.active
                              ? 'bg-green-100 text-green-700 hover:bg-green-200'
                              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                          }`}
                        >
                          {togglingId === cat.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            cat.active ? 'Activa' : 'Inactiva'
                          )}
                        </button>
                      </td>

                      {/* Visible toggle */}
                      <td className="px-3 py-3 text-center hidden lg:table-cell">
                        <button
                          onClick={() => toggleVisible(cat)}
                          disabled={togglingId === cat.id + '_v'}
                          title={cat.isVisible ? 'Tornar oculta' : 'Tornar visível'}
                          className={`p-1.5 rounded-lg transition-colors ${cat.isVisible ? 'text-green-600 hover:bg-green-50' : 'text-gray-300 hover:bg-gray-50'}`}
                        >
                          {togglingId === cat.id + '_v'
                            ? <Loader2 className="w-4 h-4 animate-spin" />
                            : cat.isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />
                          }
                        </button>
                      </td>

                      {/* Featured toggle */}
                      <td className="px-3 py-3 text-center hidden lg:table-cell">
                        <button
                          onClick={() => toggleFeatured(cat)}
                          disabled={togglingId === cat.id + '_f'}
                          title={cat.isFeatured ? 'Remover destaque' : 'Adicionar destaque'}
                          className={`p-1.5 rounded-lg transition-colors ${cat.isFeatured ? 'text-orange-500 hover:bg-orange-50' : 'text-gray-300 hover:bg-gray-50'}`}
                        >
                          {togglingId === cat.id + '_f'
                            ? <Loader2 className="w-4 h-4 animate-spin" />
                            : <Star className={`w-4 h-4 ${cat.isFeatured ? 'fill-orange-500' : ''}`} />
                          }
                        </button>
                      </td>

                      {/* Display order */}
                      <td className="px-3 py-3 hidden xl:table-cell">
                        <OrderCell category={cat} onSave={updateOrder} />
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEdit(cat)}
                            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700"
                            title="Editar"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDuplicate(cat)}
                            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700"
                            title="Duplicar"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(cat)}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                {total} categorias · Página {page} de {totalPages}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const p = totalPages <= 5 ? i + 1 : page <= 3 ? i + 1 : page >= totalPages - 2 ? totalPages - 4 + i : page - 2 + i
                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`w-8 h-8 text-sm rounded-lg ${p === page ? 'bg-orange-500 text-white' : 'hover:bg-gray-100 text-gray-600'}`}
                    >
                      {p}
                    </button>
                  )
                })}
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Drawer */}
      {drawerOpen && editingCategory !== undefined && (
        <CategoryForm
          category={editingCategory}
          parentCategories={flatParents}
          onClose={closeDrawer}
          onSaved={handleSaved}
        />
      )}

      {/* Delete Modal */}
      {deleteTarget && (
        <DeleteModal
          category={deleteTarget}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleteLoading}
        />
      )}
    </div>
  )
}
