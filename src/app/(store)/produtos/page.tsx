export const dynamic = 'force-dynamic'
import { Suspense } from 'react'
import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { ProductCard } from '@/components/store/ProductCard'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { X } from 'lucide-react'
import { ProductFilters } from './ProductFilters'

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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = { active: true }
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
    if (params.precoMin) where.price.gte = Number(params.precoMin)
    if (params.precoMax) where.price.lte = Number(params.precoMax)
  }

  const orderBy =
    params.ordenar === 'preco-asc' ? { price: 'asc' as const }
    : params.ordenar === 'preco-desc' ? { price: 'desc' as const }
    : params.ordenar === 'nome' ? { name: 'asc' as const }
    : { createdAt: 'desc' as const }

  const [products, total, categories, brands] = await Promise.all([
    prisma.product.findMany({ where, include: { category: true }, orderBy, skip, take: limit }),
    prisma.product.count({ where }),
    prisma.category.findMany({ where: { active: true, parentId: null }, orderBy: { displayOrder: 'asc' } }),
    prisma.product.findMany({ where: { active: true }, select: { brand: true }, distinct: ['brand'], orderBy: { brand: 'asc' } }),
  ])

  return { products, total, categories, brands: brands.map((b) => b.brand), page, totalPages: Math.ceil(total / limit) }
}

export default async function ProdutosPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams
  const { products, total, categories, brands, page, totalPages } = await getProducts(params)

  const activeFilters = [
    params.search && { label: `"${params.search}"`, key: 'search' },
    params.categoria && { label: params.categoria, key: 'categoria' },
    params.marca && { label: params.marca, key: 'marca' },
    params.promocao === 'true' && { label: '🔥 Promoção', key: 'promocao' },
    params.novo === 'true' && { label: '✨ Novidades', key: 'novo' },
    params.disponivel === 'true' && { label: '✅ Em Stock', key: 'disponivel' },
    params.destaque === 'true' && { label: '⭐ Destaque', key: 'destaque' },
    params.precoMin && { label: `Mín ${params.precoMin} AOA`, key: 'precoMin' },
    params.precoMax && { label: `Máx ${params.precoMax} AOA`, key: 'precoMax' },
  ].filter(Boolean) as { label: string; key: string }[]

  function buildUrl(overrides: SearchParams) {
    const p = { ...params, ...overrides, pagina: undefined }
    const qs = Object.entries(p).filter(([, v]) => v).map(([k, v]) => `${k}=${encodeURIComponent(v!)}`).join('&')
    return `/produtos${qs ? '?' + qs : ''}`
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Filters — client component handles open/close */}
        <Suspense fallback={<div className="hidden md:block w-64 flex-shrink-0"><div className="h-96 bg-gray-100 rounded-xl animate-pulse" /></div>}>
          <ProductFilters categories={categories} brands={brands} />
        </Suspense>

        {/* Main */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Produtos</h1>
              <p className="text-sm text-gray-500">{total} resultado{total !== 1 ? 's' : ''}</p>
            </div>
          </div>

          {/* Active filter badges */}
          {activeFilters.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {activeFilters.map((f) => (
                <Link key={f.key} href={buildUrl({ [f.key]: undefined })}>
                  <Badge variant="outline" className="gap-1 cursor-pointer hover:bg-gray-100 transition-colors">
                    {f.label} <X className="w-3 h-3" />
                  </Badge>
                </Link>
              ))}
              <Link href="/produtos">
                <Badge variant="secondary" className="cursor-pointer hover:bg-gray-200 transition-colors">
                  Limpar tudo
                </Badge>
              </Link>
            </div>
          )}

          {/* Grid */}
          {products.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <p className="text-4xl mb-4">🔍</p>
              <p className="text-lg font-medium mb-2">Nenhum produto encontrado.</p>
              <p className="text-sm mb-4">Tente ajustar os filtros ou pesquisar por outra palavra.</p>
              <Link href="/produtos" className="text-orange-500 hover:underline text-sm font-medium">
                Remover filtros
              </Link>
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
            <div className="flex justify-center gap-2 mt-10">
              {page > 1 && (
                <Link href={buildUrl({ pagina: String(page - 1) })} className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                  ← Anterior
                </Link>
              )}
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                const p = totalPages <= 7 ? i + 1
                  : i === 0 ? 1
                  : i === 6 ? totalPages
                  : Math.max(2, Math.min(page - 1, totalPages - 4)) + i - 1
                return p
              }).filter((p, i, arr) => arr.indexOf(p) === i).map((p) => (
                <Link
                  key={p}
                  href={buildUrl({ pagina: String(p) })}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${p === page ? 'bg-orange-500 text-white' : 'border border-gray-300 hover:bg-gray-50'}`}
                >
                  {p}
                </Link>
              ))}
              {page < totalPages && (
                <Link href={buildUrl({ pagina: String(page + 1) })} className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                  Próxima →
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
