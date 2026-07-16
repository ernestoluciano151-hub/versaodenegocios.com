export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { prisma } from '@/lib/prisma'
import { ChevronRight, Home, PackageOpen } from 'lucide-react'

const PAGE_SIZE = 24

// ─── Currency formatter ───────────────────────────────────────────────────────
function formatAOA(value: number | { toNumber?: () => number } | null | undefined): string {
  const num = value == null ? 0 : typeof value === 'object' && typeof value.toNumber === 'function' ? value.toNumber() : Number(value)
  return new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(num)
}

// ─── generateMetadata ─────────────────────────────────────────────────────────
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const category = await prisma.category.findUnique({ where: { slug } })
  if (!category || category.deletedAt || !category.isVisible || !category.active) {
    return { title: 'Categoria não encontrada' }
  }
  return {
    title: category.seoTitle || category.name,
    description: category.seoDescription || category.description || '',
    keywords: category.seoKeywords ?? undefined,
    openGraph: {
      images: [category.ogImage || category.image || ''].filter(Boolean),
    },
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams?: Promise<{ page?: string }>
}) {
  const { slug } = await params
  const sp = await searchParams
  const page = Math.max(1, parseInt(sp?.page ?? '1', 10))

  // 1. Fetch category
  const category = await prisma.category.findUnique({
    where: { slug },
    include: {
      parent: { select: { name: true, slug: true } },
    },
  })

  if (
    !category ||
    category.deletedAt != null ||
    !category.isVisible ||
    !category.active
  ) {
    return notFound()
  }

  // 2. Fetch products (paginated)
  const where = { categoryId: category.id, active: true, deletedAt: null, visibility: 'visible' as const }
  const [products, totalProducts] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { category: { select: { name: true, slug: true } } },
      orderBy: { createdAt: 'desc' },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
    }),
    prisma.product.count({ where }),
  ])
  const totalPages = Math.ceil(totalProducts / PAGE_SIZE)

  // 3. Fetch subcategories
  const subcategories = await prisma.category.findMany({
    where: {
      parentId: category.id,
      isVisible: true,
      active: true,
      deletedAt: null,
    },
    orderBy: { displayOrder: 'asc' },
  })

  // Hero gradient color
  const heroColor = category.color || '#f97316'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Breadcrumb ───────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <nav className="flex items-center gap-1.5 text-sm text-gray-500" aria-label="Breadcrumb">
            <Link href="/" className="flex items-center gap-1 hover:text-orange-500 transition-colors">
              <Home className="w-3.5 h-3.5" />
              <span>Início</span>
            </Link>
            {category.parent && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                <Link
                  href={`/categoria/${category.parent.slug}`}
                  className="hover:text-orange-500 transition-colors"
                >
                  {category.parent.name}
                </Link>
              </>
            )}
            <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-gray-900 font-medium">{category.name}</span>
          </nav>
        </div>
      </div>

      {/* ── Hero Banner ──────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden">
        {category.bannerDesktop ? (
          <div className="relative h-48 sm:h-64 md:h-72">
            {/* Use regular img to avoid next/image domain config issues */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={category.bannerDesktop}
              alt={`Banner ${category.name}`}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/40" />
            <HeroContent
              category={category}
              productCount={products.length}
              light
            />
          </div>
        ) : (
          <div
            className="relative h-48 sm:h-64 md:h-72 flex items-center"
            style={{
              background: `linear-gradient(135deg, ${heroColor}dd 0%, ${heroColor}99 100%)`,
            }}
          >
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage:
                  'radial-gradient(circle at 20% 80%, white 0%, transparent 50%), radial-gradient(circle at 80% 20%, white 0%, transparent 50%)',
              }}
            />
            <HeroContent
              category={category}
              productCount={products.length}
              light={false}
            />
          </div>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
        {/* ── Subcategories ───────────────────────────────────────────────── */}
        {subcategories.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Subcategorias</h2>
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none">
              {subcategories.map((sub) => (
                <Link
                  key={sub.id}
                  href={`/categoria/${sub.slug}`}
                  className="flex-shrink-0 flex flex-col items-center gap-2 group"
                >
                  <div
                    className="w-20 h-20 rounded-2xl overflow-hidden border border-gray-200 bg-white shadow-sm group-hover:shadow-md transition-shadow flex items-center justify-center"
                    style={{ borderColor: sub.color || '#e5e7eb' }}
                  >
                    {sub.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={sub.image}
                        alt={sub.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-3xl" role="img" aria-label={sub.name}>
                        🗂️
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-center text-gray-700 font-medium group-hover:text-orange-500 transition-colors max-w-[80px] leading-tight">
                    {sub.name}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── Products Grid ───────────────────────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">
              Produtos{' '}
              <span className="text-sm font-normal text-gray-400">
                ({totalProducts})
              </span>
            </h2>
          </div>

          {products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <PackageOpen className="w-16 h-16 text-gray-300 mb-4" />
              <p className="text-gray-500 text-lg font-medium">
                Nenhum produto disponível nesta categoria
              </p>
              <p className="text-gray-400 text-sm mt-1">
                Volte mais tarde para ver novidades.
              </p>
              <Link
                href="/produtos"
                className="mt-6 px-6 py-2.5 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 transition-colors text-sm"
              >
                Ver todos os produtos
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map((product) => {
                const image = product.images[0] ?? '/placeholder-product.jpg'
                const price = Number(product.price)
                const salePrice = product.salePrice ? Number(product.salePrice) : null

                return (
                  <Link
                    key={product.id}
                    href={`/produtos/${product.slug}`}
                    className="group block bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 will-change-transform"
                  >
                    {/* Image */}
                    <div
                      className="relative bg-gray-50 overflow-hidden"
                      style={{ paddingBottom: '100%' }}
                    >
                      <Image
                        src={image}
                        alt={product.name}
                        fill
                        className="object-contain p-4 group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        loading="lazy"
                      />
                      {salePrice && (
                        <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                          Sale
                        </span>
                      )}
                    </div>

                    {/* Info */}
                    <div className="p-3">
                      <h3 className="text-sm font-medium text-gray-900 line-clamp-2 leading-snug mb-2 h-9">
                        {product.name}
                      </h3>
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          {salePrice ? (
                            <>
                              <p className="text-xs text-gray-400 line-through leading-tight">
                                {formatAOA(price)}
                              </p>
                              <p className="text-base font-bold text-orange-500 leading-tight">
                                {formatAOA(salePrice)}
                              </p>
                            </>
                          ) : (
                            <p className="text-base font-bold text-gray-900">
                              {formatAOA(price)}
                            </p>
                          )}
                        </div>
                        <span className="flex-shrink-0 text-xs px-3 py-1.5 bg-orange-500 text-white rounded-lg font-medium group-hover:bg-orange-600 transition-colors whitespace-nowrap">
                          Ver Produto
                        </span>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-10">
              {page > 1 && (
                <Link
                  href={`/categoria/${slug}?page=${page - 1}`}
                  className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:border-orange-500 hover:text-orange-500 transition-colors"
                >
                  ← Anterior
                </Link>
              )}
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <Link
                  key={p}
                  href={`/categoria/${slug}?page=${p}`}
                  className={`w-9 h-9 rounded-lg text-sm font-medium flex items-center justify-center transition-colors ${
                    p === page
                      ? 'bg-orange-500 text-white'
                      : 'border border-gray-200 text-gray-700 hover:border-orange-500 hover:text-orange-500'
                  }`}
                >
                  {p}
                </Link>
              ))}
              {page < totalPages && (
                <Link
                  href={`/categoria/${slug}?page=${page + 1}`}
                  className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:border-orange-500 hover:text-orange-500 transition-colors"
                >
                  Próxima →
                </Link>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

// ─── Hero Content (shared between banner and gradient variants) ───────────────
function HeroContent({
  category,
  productCount,
  light,
}: {
  category: {
    name: string
    description: string | null
    icon: string | null
    color: string | null
  }
  productCount: number
  light: boolean
}) {
  const textClass = light ? 'text-white' : 'text-white'
  const subTextClass = light ? 'text-white/80' : 'text-white/80'

  return (
    <div className="absolute inset-0 flex items-center">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex items-center gap-5">
          {/* Icon or emoji */}
          {category.icon ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={category.icon}
              alt=""
              aria-hidden="true"
              className="w-16 h-16 rounded-2xl object-cover shadow-lg flex-shrink-0 bg-white/20 p-1"
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0 shadow-lg">
              <span className="text-4xl" role="img" aria-hidden="true">
                🗂️
              </span>
            </div>
          )}

          {/* Text */}
          <div>
            <h1 className={`text-2xl sm:text-3xl md:text-4xl font-bold ${textClass} leading-tight`}>
              {category.name}
            </h1>
            {category.description && (
              <p className={`mt-1.5 text-sm sm:text-base ${subTextClass} max-w-xl line-clamp-2`}>
                {category.description}
              </p>
            )}
            <div className="mt-3">
              <span className="inline-flex items-center px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-sm font-medium rounded-full">
                {productCount} {productCount === 1 ? 'produto' : 'produtos'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
