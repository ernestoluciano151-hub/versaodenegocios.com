export const dynamic = 'force-dynamic'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { formatCurrency, calculateDiscount } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { ProductCard } from '@/components/store/ProductCard'
import { AddToCartSection } from './AddToCartSection'
import { ProductGallery } from './ProductGallery'
import { Shield, Truck, Globe, Tag } from 'lucide-react'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const product = await prisma.product.findUnique({ where: { slug } })
  if (!product) return { title: 'Produto não encontrado' }
  return {
    title: product.name,
    description: product.description.slice(0, 160),
    openGraph: { images: product.images[0] ? [product.images[0]] : [] },
  }
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const product = await prisma.product.findUnique({
    where: { slug, active: true },
    include: { category: true },
  })

  if (!product) notFound()

  const related = await prisma.product.findMany({
    where: { active: true, categoryId: product.categoryId, id: { not: product.id } },
    take: 4,
  })

  const discount = product.salePrice ? calculateDiscount(Number(product.price), Number(product.salePrice)) : 0
  const specs = product.technicalSpecs as Record<string, string>

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="lg:grid lg:grid-cols-2 lg:gap-12">
        {/* Images */}
        <div className="mb-8 lg:mb-0 relative">
          {discount > 0 && (
            <div className="absolute top-4 left-4 z-10">
              <Badge variant="destructive" className="text-sm px-3 py-1">-{discount}%</Badge>
            </div>
          )}
          <ProductGallery images={product.images} name={product.name} />
        </div>

        {/* Info */}
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <Badge variant="secondary">{product.category.name}</Badge>
            {product.isNew && <Badge variant="success">Novo</Badge>}
            {product.isBestseller && <Badge variant="default">Mais Vendido</Badge>}
            {product.stock === 0 && <Badge variant="destructive">Esgotado</Badge>}
            {product.stock > 0 && product.stock <= product.minStock && (
              <Badge variant="warning">Últimas unidades</Badge>
            )}
          </div>

          <p className="text-sm text-gray-400 uppercase tracking-wide mb-1">{product.brand}</p>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">{product.name}</h1>

          {/* Price */}
          <div className="flex items-end gap-3 mb-6">
            {product.salePrice ? (
              <>
                <p className="text-3xl font-bold text-orange-500">{formatCurrency(Number(product.salePrice))}</p>
                <p className="text-lg text-gray-400 line-through">{formatCurrency(Number(product.price))}</p>
                <Badge variant="destructive">Poupa {formatCurrency(Number(product.price) - Number(product.salePrice))}</Badge>
              </>
            ) : (
              <p className="text-3xl font-bold text-gray-900">{formatCurrency(Number(product.price))}</p>
            )}
          </div>

          {/* SKU */}
          <p className="text-xs text-gray-400 mb-4">SKU: {product.sku} {product.internalCode && `· Ref: ${product.internalCode}`}</p>

          {/* Add to cart */}
          <AddToCartSection product={{
            id: product.id,
            name: product.name,
            slug: product.slug,
            brand: product.brand,
            price: Number(product.price),
            salePrice: product.salePrice ? Number(product.salePrice) : undefined,
            images: product.images,
            stock: product.stock,
          }} />

          {/* Details */}
          <div className="grid grid-cols-2 gap-3 mt-6">
            {[
              { icon: Globe, label: 'Origem', value: product.originCountry },
              { icon: Shield, label: 'Garantia', value: product.warranty ?? 'Consultar' },
              { icon: Truck, label: 'Entrega', value: 'Luanda' },
              { icon: Tag, label: 'SKU', value: product.sku },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg">
                <Icon className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-400">{label}</p>
                  <p className="text-sm font-medium text-gray-700">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Description + Specs */}
      <div className="mt-12 grid md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Descrição</h2>
          <div className="prose prose-sm text-gray-600 max-w-none whitespace-pre-wrap">{product.description}</div>
        </div>

        {Object.keys(specs).length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Especificações Técnicas</h2>
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              {Object.entries(specs).map(([key, val], i) => (
                <div key={key} className={`flex ${i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
                  <span className="w-1/2 px-4 py-2.5 text-sm font-medium text-gray-700 border-r border-gray-200">{key}</span>
                  <span className="w-1/2 px-4 py-2.5 text-sm text-gray-600">{val}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Related */}
      {related.length > 0 && (
        <div className="mt-12">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Produtos Relacionados</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {related.map((p) => (
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
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
