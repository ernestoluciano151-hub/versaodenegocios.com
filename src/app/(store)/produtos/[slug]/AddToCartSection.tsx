'use client'

import { useState } from 'react'
import { ShoppingCart, Heart, Zap, Minus, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCartStore } from '@/store/cart'
import { useUIStore } from '@/store/ui'

interface Product {
  id: string
  name: string
  slug: string
  brand: string
  price: number
  salePrice?: number
  images: string[]
  stock: number
}

export function AddToCartSection({ product }: { product: Product }) {
  const [quantity, setQuantity] = useState(1)
  const { addItem } = useCartStore()
  const { openCart } = useUIStore()

  function handleAddToCart() {
    addItem({
      id: product.id,
      productId: product.id,
      name: product.name,
      brand: product.brand,
      slug: product.slug,
      image: product.images[0] ?? '/placeholder-product.jpg',
      price: product.price,
      salePrice: product.salePrice,
      quantity,
      stock: product.stock,
    })
    openCart()
  }

  function handleBuyNow() {
    handleAddToCart()
    window.location.href = '/checkout'
  }

  const inStock = product.stock > 0

  return (
    <div className="space-y-3">
      {/* Quantity */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-500">Quantidade:</span>
        <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
          <button
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="w-9 h-9 flex items-center justify-center hover:bg-gray-100 transition-colors"
          >
            <Minus className="w-3 h-3" />
          </button>
          <span className="w-10 text-center text-sm font-medium">{quantity}</span>
          <button
            onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
            disabled={!inStock}
            className="w-9 h-9 flex items-center justify-center hover:bg-gray-100 transition-colors disabled:opacity-40"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>
        <span className="text-xs text-gray-400">{product.stock} em stock</span>
      </div>

      {/* Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button onClick={handleBuyNow} disabled={!inStock} size="lg" className="flex-1 gap-2">
          <Zap className="w-4 h-4" /> Comprar Agora
        </Button>
        <Button onClick={handleAddToCart} disabled={!inStock} variant="outline" size="lg" className="flex-1 gap-2">
          <ShoppingCart className="w-4 h-4" /> Adicionar ao Carrinho
        </Button>
      </div>

      <Button variant="ghost" size="sm" className="gap-2 text-gray-500">
        <Heart className="w-4 h-4" /> Adicionar aos Favoritos
      </Button>
    </div>
  )
}
