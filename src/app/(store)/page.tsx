export const dynamic = 'force-dynamic'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { HeroBanner } from '@/components/store/HeroBanner'
import { ProductCard } from '@/components/store/ProductCard'
import { NewsletterForm } from '@/components/store/NewsletterForm'
import { Skeleton } from '@/components/ui/skeleton'
import { Suspense } from 'react'
import Image from 'next/image'

async function getFeaturedProducts() {
  return prisma.product.findMany({
    where: { active: true, featured: true },
    include: { category: true },
    orderBy: { updatedAt: 'desc' },
    take: 8,
  })
}

async function getNewProducts() {
  return prisma.product.findMany({
    where: { active: true, isNew: true },
    include: { category: true },
    orderBy: { createdAt: 'desc' },
    take: 4,
  })
}

async function getBestsellers() {
  return prisma.product.findMany({
    where: { active: true, isBestseller: true },
    include: { category: true },
    take: 4,
  })
}

async function getCategories() {
  return prisma.category.findMany({
    where: { active: true, parentId: null },
    orderBy: { order: 'asc' },
    take: 8,
  })
}

async function getSaleProducts() {
  return prisma.product.findMany({
    where: { active: true, salePrice: { not: null } },
    orderBy: { updatedAt: 'desc' },
    take: 4,
  })
}

function ProductGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <Skeleton className="aspect-square" />
          <div className="p-3 space-y-2">
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      ))}
    </div>
  )
}

async function FeaturedSection() {
  const products = await getFeaturedProducts()
  if (products.length === 0) return null
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
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
          featured={p.featured}
        />
      ))}
    </div>
  )
}

async function NewProductsSection() {
  const products = await getNewProducts()
  if (products.length === 0) return null
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
  )
}

async function CategoriesSection() {
  const categories = await getCategories()
  if (categories.length === 0) return null
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {categories.map((cat) => (
        <Link
          key={cat.id}
          href={`/produtos?categoria=${cat.slug}`}
          className="bg-white rounded-xl border border-gray-200 p-4 hover:border-orange-300 hover:shadow-sm transition-all text-center group"
        >
          {cat.image && (
            <div className="w-12 h-12 mx-auto mb-2 relative">
              <Image src={cat.image} alt={cat.name} fill className="object-contain" />
            </div>
          )}
          <p className="text-sm font-medium text-gray-900 group-hover:text-orange-500 transition-colors">{cat.name}</p>
        </Link>
      ))}
    </div>
  )
}

async function SaleSection() {
  const products = await getSaleProducts()
  if (products.length === 0) return null
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
  )
}

export default function HomePage() {
  return (
    <div>
      <HeroBanner />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
        {/* Categories */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Categorias</h2>
            <Link href="/produtos" className="text-sm text-orange-500 hover:underline flex items-center gap-1">
              Ver todas <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <Suspense fallback={<ProductGridSkeleton count={8} />}>
            <CategoriesSection />
          </Suspense>
        </section>

        {/* Featured */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Produtos em Destaque</h2>
            <Link href="/produtos?destaque=true" className="text-sm text-orange-500 hover:underline flex items-center gap-1">
              Ver mais <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <Suspense fallback={<ProductGridSkeleton count={8} />}>
            <FeaturedSection />
          </Suspense>
        </section>

        {/* Promoções */}
        <section className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-2xl p-6 md:p-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">🔥 Promoções</h2>
              <p className="text-sm text-gray-500 mt-1">Aproveite os nossos melhores preços</p>
            </div>
            <Link href="/produtos?promocao=true" className="text-sm text-orange-500 hover:underline flex items-center gap-1">
              Ver todas <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <Suspense fallback={<ProductGridSkeleton count={4} />}>
            <SaleSection />
          </Suspense>
        </section>

        {/* Novidades */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">✨ Novidades</h2>
            <Link href="/produtos?novo=true" className="text-sm text-orange-500 hover:underline flex items-center gap-1">
              Ver mais <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <Suspense fallback={<ProductGridSkeleton count={4} />}>
            <NewProductsSection />
          </Suspense>
        </section>

        {/* Newsletter */}
        <section className="bg-gray-900 text-white rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-bold mb-2">Fique a par das novidades</h2>
          <p className="text-gray-400 mb-6">Receba ofertas exclusivas e lançamentos em primeira mão.</p>
          <NewsletterForm />
        </section>
      </div>
    </div>
  )
}
