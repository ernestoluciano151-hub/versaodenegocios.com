'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Heart, ShoppingCart } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useCartStore } from '@/store/cart'
import { useUIStore } from '@/store/ui'
import { formatCurrency, calculateDiscount } from '@/lib/utils'
import { memo, useCallback } from 'react'
import { trackEvent } from '@/components/store/AnalyticsTracker'

interface ProductCardProps {
  id: string
  name: string
  slug: string
  brand: string
  price: number
  salePrice?: number | null
  images: string[]
  stock: number
  isNew?: boolean
  isBestseller?: boolean
  featured?: boolean
}

export const ProductCard = memo(function ProductCard({
  id, name, slug, brand, price, salePrice, images, stock, isNew, isBestseller,
}: ProductCardProps) {
  const { addItem } = useCartStore()
  const { openCart } = useUIStore()

  const effectivePrice = salePrice ?? price
  void effectivePrice
  const discountPercent = salePrice ? calculateDiscount(price, salePrice) : 0
  const image = images[0] ?? '/placeholder-product.jpg'

  const handleAddToCart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    addItem({ id, productId: id, name, brand, slug, image, price, salePrice: salePrice ?? undefined, quantity: 1, stock })
    openCart()
    trackEvent('add_to_cart', { productId: id })
  }, [id, name, brand, slug, image, price, salePrice, stock, addItem, openCart])

  return (
    <Link
      href={`/produtos/${slug}`}
      className="group block"
      onClick={() => trackEvent('product_view', { productId: id })}
    >
      {/* Fixed aspect-ratio container prevents CLS */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-200 will-change-transform hover:-translate-y-0.5">
        {/* Image — fixed aspect ratio via padding trick prevents CLS */}
        <div className="relative bg-gray-50 overflow-hidden" style={{ paddingBottom: '100%' }}>
          <Image
            src={image}
            alt={name}
            fill
            className="object-contain p-4 group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            loading="lazy"
            placeholder="blur"
            blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjMyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PC9zdmc+"
          />

          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1 pointer-events-none">
            {discountPercent > 0 && (
              <Badge variant="destructive" className="text-xs">-{discountPercent}%</Badge>
            )}
            {isNew && <Badge className="text-xs bg-green-500 hover:bg-green-500">Novo</Badge>}
            {isBestseller && <Badge className="text-xs">Mais Vendido</Badge>}
            {stock === 0 && <Badge variant="secondary" className="text-xs">Esgotado</Badge>}
          </div>

          {/* Wishlist */}
          <button
            onClick={(e) => e.preventDefault()}
            className="absolute top-2 right-2 p-1.5 bg-white rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-500 focus:opacity-100"
            aria-label="Adicionar aos favoritos"
          >
            <Heart className="w-4 h-4" />
          </button>
        </div>

        {/* Info — fixed min-height prevents CLS */}
        <div className="p-3" style={{ minHeight: '100px' }}>
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5 truncate">{brand}</p>
          <h3 className="text-sm font-medium text-gray-900 line-clamp-2 leading-snug mb-2 h-9">{name}</h3>

          <div className="flex items-center justify-between">
            <div className="min-w-0">
              {salePrice ? (
                <>
                  <p className="text-xs text-gray-400 line-through leading-tight">{formatCurrency(price)}</p>
                  <p className="text-base font-bold text-orange-500 leading-tight">{formatCurrency(salePrice)}</p>
                </>
              ) : (
                <p className="text-base font-bold text-gray-900">{formatCurrency(price)}</p>
              )}
            </div>

            <button
              onClick={handleAddToCart}
              disabled={stock === 0}
              className="flex-shrink-0 p-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors active:scale-95"
              aria-label="Adicionar ao carrinho"
            >
              <ShoppingCart className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </Link>
  )
})

// Skeleton for CLS prevention during loading
export function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="relative bg-gray-100 animate-pulse" style={{ paddingBottom: '100%' }} />
      <div className="p-3" style={{ minHeight: '100px' }}>
        <div className="h-3 bg-gray-100 rounded animate-pulse w-16 mb-2" />
        <div className="h-4 bg-gray-100 rounded animate-pulse mb-1" />
        <div className="h-4 bg-gray-100 rounded animate-pulse w-3/4 mb-3" />
        <div className="flex items-center justify-between">
          <div className="h-5 bg-gray-100 rounded animate-pulse w-24" />
          <div className="w-8 h-8 bg-gray-100 rounded-lg animate-pulse" />
        </div>
      </div>
    </div>
  )
}
