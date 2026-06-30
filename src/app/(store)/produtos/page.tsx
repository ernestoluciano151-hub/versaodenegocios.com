export const dynamic = 'force-dynamic'
import { Suspense } from 'react'
import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { ProductCard } from '@/components/store/ProductCard'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { SlidersHorizontal, X } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Catálogo de Produtos',
  description: 'Explore o nosso catálogo completo de produtos eletrónicos.',
}

interface SearchParams {
  search?: string
  categoria?: string
  marca?: string
  precoMin?: string
  precoMax?: string
  promocao?: string
  novo?: string
  destaque?: string
  disponivel?: string
  pagina?: string
  ordenar?: string
}

async function getProducts(params: SearchParams) {
  const page = Number(params.pagina ?? 1)
  const limit = 20
  const skip = (page - 1) * limit

  const where: Record<string, unknown> = { active: true }
  if (params.search) where.OR = [
    { name: { contains: params.search, mode: 'insensitive' } },
    { brand: { contains: params.search, mode: 'insensitive' } },
    { description: { contains: params.search, mode: 'insensitive' } },
  ]
  if (params.categoria) where.category = { slug: params.categoria }
  if (params.marca) where.brand = { contains: params.marca, mode: 'insensitive' }
  if (params.promocao === 'true') where.salePrice = { not: null }
  if (params.novo === 'true') where.isNew = true
  if (params.destaque === 'true') where.featured = true
  if (params.disponivel === 'true') where.stock = { gt: 0 }
  if (params.precoMin || params.precoMax) {
    where.price = {}
    if (params.precoMin) (where.price as Record<string, unknown>).gte = Number(params.precoMin)
    if (params.precoMax) (where.price as Record<string, unknown>).lte = Number(params.precoMax)
  }

  const orderBy: Record<string, unknown> =
    params.ordenar === 'preco-asc' ? { price: 'asc' }
    : params.ordenar === 'preco-desc' ? { price: 'desc' }
    : params.ordenar === 'nome' ? { name: 'asc' }
    : { createdAt: 'desc' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = where as any
  const [products, total, categories, brands] = await Promise.all([
    prisma.product.findMany({ where: w, include: { category: true }, orderBy, skip, take: limit }),
    prisma.product.count({ where: w }),
    prisma.category.findMany({ where: { active: true, parentId: null }, orderBy: { order: 'asc' } }),
    prisma.product.findMany({ where: { active: true }, select: { brand: true }, distinct: ['brand'], orderBy: { brand: 'asc' } }),
  ])

  return { products, total, categories, brands: brands.map((b) => b.brand), page, totalPages: Math.ceil(total / limit) }
}

export default async function ProdutosPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams
  const { products, total, categories, brands, page, totalPages } = await getProducts(params)

  const activeFilters = [
    params.search && { label: `Pesquisa: "${params.search}"`, key: 'search' },
    params.categoria && { label: `Categoria: ${params.categoria}`, key: 'categoria' },
    params.marca && { label: `Marca: ${params.marca}`, key: 'marca' },
    params.promocao === 'true' && { label: 'Em Promoção', key: 'promocao' },
    params.novo === 'true' && { label: 'Novidades', key: 'novo' },
    params.disponivel === 'true' && { label: 'Disponível', key: 'disponivel' },
  ].filter(Boolean) as { label: string; key: string }[]

  function buildUrl(overrides: SearchParams) {
    const p = { ...params, ...overrides }
    const qs = Object.entries(p).filter(([, v]) => v).map(([k, v]) => `${k}=${encodeURIComponent(v!)}`).join('&')
    return `/produtos${qs ? '?' + qs : ''}`
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar filters */}
        <aside className="w-full md:w-64 flex-shrink-0">
          <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-6">
            <div className="flex items-center gap-2 font-semibold text-gray-900">
              <SlidersHorizontal className="w-4 h-4" />
              Filtros
            </div>

            {/* Categorias */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Categoria</p>
              <ul className="space-y-1">
                {categories.map((cat) => (
                  <li key={cat.id}>
                    <Link
                      href={buildUrl({ categoria: params.categoria === cat.slug ? undefined : cat.slug, pagina: undefined })}
                      className={`block text-sm py-1 px-2 rounded-md transition-colors ${params.categoria === cat.slug ? 'bg-orange-50 text-orange-600 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                      {cat.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Marcas */}
            {brands.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Marca</p>
                <ul className="space-y-1 max-h-48 overflow-y-auto">
                  {brands.map((brand) => (
                    <li key={brand}>
                      <Link
                        href={buildUrl({ marca: params.marca === brand ? undefined : brand, pagina: undefined })}
                        className={`block text-sm py-1 px-2 rounded-md transition-colors ${params.marca === brand ? 'bg-orange-50 text-orange-600 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
                      >
                        {brand}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Outros */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Outros</p>
              <div className="space-y-1">
                {[
                  { key: 'promocao', label: '🔥 Em Promoção' },
                  { key: 'novo', label: '✨ Novidades' },
                  { key: 'disponivel', label: '✅ Em Stock' },
                ].map(({ key, label }) => (
                  <Link
                    key={key}
                    href={buildUrl({ [key]: params[key as keyof SearchParams] === 'true' ? undefined : 'true', pagina: undefined })}
                    className={`block text-sm py-1 px-2 rounded-md transition-colors ${params[key as keyof SearchParams] === 'true' ? 'bg-orange-50 text-orange-600 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Main */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Produtos</h1>
              <p className="text-sm text-gray-500">{total} resultado{total !== 1 ? 's' : ''}</p>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-500">Ordenar:</label>
              <select className="text-sm border border-gray-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-500">
                <option value="">Mais recentes</option>
                <option value="preco-asc">Preço: menor</option>
                <option value="preco-desc">Preço: maior</option>
                <option value="nome">Nome A-Z</option>
              </select>
            </div>
          </div>

          {/* Active filters */}
          {activeFilters.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {activeFilters.map((f) => (
                <Link key={f.key} href={buildUrl({ [f.key]: undefined, pagina: undefined })}>
                  <Badge variant="outline" className="gap-1 cursor-pointer hover:bg-gray-100">
                    {f.label} <X className="w-3 h-3" />
                  </Badge>
                </Link>
              ))}
              <Link href="/produtos">
                <Badge variant="secondary" className="cursor-pointer hover:bg-gray-200">
                  Limpar filtros
                </Badge>
              </Link>
            </div>
          )}

          {/* Grid */}
          {products.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <p className="text-lg mb-2">Nenhum produto encontrado.</p>
              <Link href="/produtos" className="text-orange-500 hover:underline">Remover filtros</Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {products.map((p) => (
                <ProductCard
                  key={p.id}
                  id={p.id}
                  name={p.name}
                  slug={p.slug}
                  brand={p.brand}
                  price={Number(p.price)}
                  salePrice={p.salePrice ? Number(p.salePrice) : null}
                  images={p.images}
                  stock={p.stock}
                  isNew={p.isNew}
                  isBestseller={p.isBestseller}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              {page > 1 && (
                <Link href={buildUrl({ pagina: String(page - 1) })} className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
                  Anterior
                </Link>
              )}
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <Link
                  key={p}
                  href={buildUrl({ pagina: String(p) })}
                  className={`px-3 py-1.5 text-sm rounded-lg ${p === page ? 'bg-orange-500 text-white' : 'border border-gray-300 hover:bg-gray-50'}`}
                >
                  {p}
                </Link>
              ))}
              {page < totalPages && (
                <Link href={buildUrl({ pagina: String(page + 1) })} className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
                  Próxima
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
