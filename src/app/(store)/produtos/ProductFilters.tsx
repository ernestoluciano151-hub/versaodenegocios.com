'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { SlidersHorizontal, X, ChevronDown, ChevronUp } from 'lucide-react'

interface Category { id: string; name: string; slug: string }

interface Props {
  categories: Category[]
  brands: string[]
}

interface Filters {
  categoria?: string
  marca?: string
  precoMin?: string
  precoMax?: string
  promocao?: string
  novo?: string
  disponivel?: string
  destaque?: string
  ordenar?: string
}

export function ProductFilters({ categories, brands }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [open, setOpen] = useState(false)
  const [localFilters, setLocalFilters] = useState<Filters>({})
  const drawerRef = useRef<HTMLDivElement>(null)

  // Sync from URL
  useEffect(() => {
    setLocalFilters({
      categoria: searchParams.get('categoria') ?? undefined,
      marca: searchParams.get('marca') ?? undefined,
      precoMin: searchParams.get('precoMin') ?? undefined,
      precoMax: searchParams.get('precoMax') ?? undefined,
      promocao: searchParams.get('promocao') ?? undefined,
      novo: searchParams.get('novo') ?? undefined,
      disponivel: searchParams.get('disponivel') ?? undefined,
      destaque: searchParams.get('destaque') ?? undefined,
      ordenar: searchParams.get('ordenar') ?? undefined,
    })
  }, [searchParams])

  // Close on ESC
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  // Lock scroll when drawer open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  const applyFilters = useCallback((filters: Filters) => {
    const params = new URLSearchParams()
    const current = Object.fromEntries(searchParams.entries())
    const merged = { ...current, ...filters, pagina: undefined }
    Object.entries(merged).forEach(([k, v]) => {
      if (v && v !== 'undefined') params.set(k, v)
    })
    router.push(`/produtos?${params.toString()}`)
  }, [router, searchParams])

  function toggle(key: keyof Filters, value: string) {
    const updated = { ...localFilters, [key]: localFilters[key] === value ? undefined : value }
    setLocalFilters(updated)
    applyFilters(updated)
  }

  function toggleBool(key: keyof Filters) {
    toggle(key, localFilters[key] === 'true' ? '' : 'true')
  }

  function clearAll() {
    setLocalFilters({})
    router.push('/produtos')
    setOpen(false)
  }

  const activeCount = Object.values(localFilters).filter(v => v && v !== 'undefined').length

  const FiltersContent = () => (
    <div className="space-y-6 p-4 md:p-0">
      {/* Categorias */}
      <FilterSection title="Categoria">
        <ul className="space-y-1">
          {categories.map((cat) => (
            <li key={cat.id}>
              <button
                onClick={() => toggle('categoria', cat.slug)}
                className={`w-full text-left text-sm py-1.5 px-2 rounded-lg transition-colors ${localFilters.categoria === cat.slug ? 'bg-orange-50 text-orange-600 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                {cat.name}
              </button>
            </li>
          ))}
        </ul>
      </FilterSection>

      {/* Marcas */}
      {brands.length > 0 && (
        <FilterSection title="Marca">
          <ul className="space-y-1 max-h-40 overflow-y-auto">
            {brands.map((brand) => (
              <li key={brand}>
                <button
                  onClick={() => toggle('marca', brand)}
                  className={`w-full text-left text-sm py-1.5 px-2 rounded-lg transition-colors ${localFilters.marca === brand ? 'bg-orange-50 text-orange-600 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  {brand}
                </button>
              </li>
            ))}
          </ul>
        </FilterSection>
      )}

      {/* Preço */}
      <FilterSection title="Preço (AOA)">
        <div className="flex gap-2 items-center">
          <input
            type="number"
            placeholder="Mín"
            value={localFilters.precoMin ?? ''}
            onChange={e => setLocalFilters(f => ({ ...f, precoMin: e.target.value }))}
            onBlur={() => applyFilters(localFilters)}
            className="w-full text-sm border border-gray-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
          <span className="text-gray-400 text-sm">–</span>
          <input
            type="number"
            placeholder="Máx"
            value={localFilters.precoMax ?? ''}
            onChange={e => setLocalFilters(f => ({ ...f, precoMax: e.target.value }))}
            onBlur={() => applyFilters(localFilters)}
            className="w-full text-sm border border-gray-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
      </FilterSection>

      {/* Outros */}
      <FilterSection title="Outros">
        <div className="space-y-1">
          {[
            { key: 'promocao' as keyof Filters, label: '🔥 Em Promoção' },
            { key: 'novo' as keyof Filters, label: '✨ Novidades' },
            { key: 'disponivel' as keyof Filters, label: '✅ Em Stock' },
            { key: 'destaque' as keyof Filters, label: '⭐ Destaque' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => toggleBool(key)}
              className={`w-full text-left text-sm py-1.5 px-2 rounded-lg transition-colors ${localFilters[key] === 'true' ? 'bg-orange-50 text-orange-600 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Ordenar */}
      <FilterSection title="Ordenar por">
        <select
          value={localFilters.ordenar ?? ''}
          onChange={e => { const f = { ...localFilters, ordenar: e.target.value }; setLocalFilters(f); applyFilters(f) }}
          className="w-full text-sm border border-gray-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-500"
        >
          <option value="">Mais recentes</option>
          <option value="preco-asc">Preço: menor primeiro</option>
          <option value="preco-desc">Preço: maior primeiro</option>
          <option value="nome">Nome A-Z</option>
        </select>
      </FilterSection>

      {activeCount > 0 && (
        <button
          onClick={clearAll}
          className="w-full text-sm text-red-500 hover:text-red-600 font-medium py-2 border border-red-100 rounded-lg hover:bg-red-50 transition-colors"
        >
          Limpar todos os filtros ({activeCount})
        </button>
      )}
    </div>
  )

  return (
    <>
      {/* Mobile toggle button */}
      <div className="md:hidden mb-4">
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 border border-gray-300 rounded-xl px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filtros
          {activeCount > 0 && (
            <span className="bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{activeCount}</span>
          )}
        </button>
      </div>

      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile drawer */}
      <div
        ref={drawerRef}
        className={`fixed inset-y-0 left-0 w-80 max-w-[90vw] bg-white z-50 shadow-2xl transform transition-transform duration-300 ease-in-out md:hidden flex flex-col ${open ? 'translate-x-0' : '-translate-x-full'}`}
        role="dialog"
        aria-modal="true"
        aria-label="Filtros de produtos"
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-gray-600" />
            <span className="font-semibold text-gray-900">Filtros</span>
            {activeCount > 0 && (
              <span className="bg-orange-100 text-orange-600 text-xs rounded-full px-2 py-0.5 font-medium">{activeCount} activos</span>
            )}
          </div>
          <button
            onClick={() => setOpen(false)}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors"
            aria-label="Fechar filtros"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Drawer body */}
        <div className="flex-1 overflow-y-auto">
          <FiltersContent />
        </div>

        {/* Drawer footer */}
        <div className="border-t border-gray-100 p-4 flex gap-2 flex-shrink-0">
          <button
            onClick={() => setOpen(false)}
            className="flex-1 bg-orange-500 text-white font-medium py-2.5 rounded-xl text-sm hover:bg-orange-600 transition-colors"
          >
            Ver Resultados
          </button>
        </div>
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden md:block w-64 flex-shrink-0">
        <div className="bg-white rounded-xl border border-gray-200 sticky top-4">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-2 font-semibold text-gray-900">
              <SlidersHorizontal className="w-4 h-4" />
              Filtros
              {activeCount > 0 && (
                <span className="bg-orange-100 text-orange-600 text-xs rounded-full px-2 py-0.5 font-medium">{activeCount}</span>
              )}
            </div>
          </div>
          <div className="py-2">
            <FiltersContent />
          </div>
        </div>
      </aside>
    </>
  )
}

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  return (
    <div>
      <button
        onClick={() => setCollapsed(c => !c)}
        className="w-full flex items-center justify-between text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 hover:text-gray-700 transition-colors"
      >
        {title}
        {collapsed ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
      </button>
      {!collapsed && children}
    </div>
  )
}
