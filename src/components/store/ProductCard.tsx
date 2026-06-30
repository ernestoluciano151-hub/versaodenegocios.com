'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Heart, ShoppingCart, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useCartStore } from '@/store/cart'
import { useUIStore } from '@/store/ui'
import { formatCurrency, calculateDiscount } from '@/lib/utils'

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

export function ProductCard({ id, name, slug, brand, price, salePrice, images, stock, isNew, isBestseller }: ProductCardProps) {
  const { addItem } = useCartStore()
  const { openCart } = useUIStore()

  const effectivePrice = salePrice ?? price
  const discountPercent = salePrice ? calculateDiscount(price, salePrice) : 0
  const image = images[0] ?? '/placeholder-product.jpg'

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault()
    addItem({ id, productId: id, name, brand, slug, image, price, salePrice: salePrice ?? undefined, quantity: 1, stock })
    openCart()
  }

  return (
    <Link href={`/produtos/${slug}`} className="group">
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
        {/* Image */}
        <div className="relative aspect-square bg-gray-50 overflow-hidden">
          <Image
            src={image}
            alt={name}
            fill
            className="object-contain p-4 group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />

          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {discountPercent > 0 && (
              <Badge variant="destructive" className="text-xs">-{discountPercent}%</Badge>
            )}
            {isNew && <Badge variant="success" className="text-xs">Novo</Badge>}
            {isBestseller && <Badge variant="default" className="text-xs">Mais Vendido</Badge>}
            {stock === 0 && <Badge variant="secondary" className="text-xs">Esgotado</Badge>}
          </div>

          {/* Wishlist */}
          <button
            onClick={(e) => e.preventDefault()}
            className="absolute top-2 right-2 p-1.5 bg-white rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-500"
            aria-label="Adicionar aos favoritos"
          >
            <Heart className="w-4 h-4" />
          </button>
        </div>

        {/* Info */}
        <div className="p-3">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">{brand}</p>
          <h3 className="text-sm font-medium text-gray-900 line-clamp-2 leading-snug mb-2">{name}</h3>

          <div className="flex items-center justify-between">
            <div>
              {salePrice ? (
                <div>
                  <p className="text-xs text-gray-400 line-through">{formatCurrency(price)}</p>
                  <p className="text-base font-bold text-orange-500">{formatCurrency(salePrice)}</p>
                </div>
              ) : (
                <p className="text-base font-bold text-gray-900">{formatCurrency(price)}</p>
              )}
            </div>

            <button
              onClick={handleAddToCart}
              disabled={stock === 0}
              className="p-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="Adicionar ao carrinho"
            >
              <ShoppingCart className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </Link>
  )
}
