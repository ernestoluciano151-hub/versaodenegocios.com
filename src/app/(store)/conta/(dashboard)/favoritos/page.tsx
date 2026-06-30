'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Heart, ShoppingCart, Share2, Trash2, Loader2 } from 'lucide-react'
import { useCartStore } from '@/store/cart'
import { formatCurrency } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface WishlistItem {
  id: string
  productId: string
  product: {
    id: string; name: string; slug: string; brand: string
    images: string[]; price: number; salePrice: number | null; stock: number
    category: { name: string }
  }
}

export default function ContaFavoritosPage() {
  const { addItem } = useCartStore()
  const [items, setItems] = useState<WishlistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [removing, setRemoving] = useState<string | null>(null)

  async function load() {
    const res = await fetch('/api/conta/wishlist')
    if (res.ok) setItems(await res.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function removeItem(productId: string) {
    setRemoving(productId)
    await fetch(`/api/conta/wishlist/${productId}`, { method: 'DELETE' })
    setItems(prev => prev.filter(i => i.productId !== productId))
    setRemoving(null)
  }

  async function shareList() {
    try {
      await navigator.share({ title: 'Os meus favoritos — VN Commerce', url: window.location.href })
    } catch {
      await navigator.clipboard.writeText(window.location.href)
      alert('Link copiado!')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Favoritos</h1>
          <p className="text-gray-500 text-sm mt-1">{items.length} produto{items.length !== 1 ? 's' : ''}</p>
        </div>
        {items.length > 0 && (
          <Button variant="ghost" onClick={shareList} className="gap-2 text-gray-600">
            <Share2 className="w-4 h-4" /> Partilhar lista
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-orange-500" /></div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 py-16 text-center">
          <Heart className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Ainda não tem favoritos</p>
          <Link href="/produtos" className="text-orange-500 hover:underline text-sm mt-1 inline-block">Explorar produtos</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map(({ product: p, productId }) => (
            <div key={productId} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-sm transition-shadow">
              <Link href={`/produtos/${p.slug}`} className="block">
                <div className="aspect-square bg-gray-50 relative overflow-hidden">
                  {p.images[0] ? (
                    <Image src={p.images[0]} alt={p.name} fill className="object-contain p-4" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">Sem imagem</div>
                  )}
                  {p.stock === 0 && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <Badge variant="destructive">Esgotado</Badge>
                    </div>
                  )}
                </div>
              </Link>
              <div className="p-4">
                <p className="text-xs text-gray-400 mb-0.5">{p.brand} · {p.category.name}</p>
                <Link href={`/produtos/${p.slug}`}>
                  <p className="font-medium text-gray-900 text-sm line-clamp-2 hover:text-orange-500">{p.name}</p>
                </Link>
                <div className="flex items-center gap-2 mt-2">
                  <span className="font-bold text-orange-500">{formatCurrency(Number(p.salePrice ?? p.price))}</span>
                  {p.salePrice && <span className="text-xs text-gray-400 line-through">{formatCurrency(Number(p.price))}</span>}
                </div>
                <p className="text-xs mt-1 mb-3">
                  {p.stock > 0 ? <span className="text-green-600">✓ Em stock ({p.stock} un.)</span> : <span className="text-red-500">Esgotado</span>}
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => addItem({ id: p.id, productId: p.id, name: p.name, slug: p.slug, brand: p.brand, price: Number(p.price), salePrice: p.salePrice ? Number(p.salePrice) : undefined, image: p.images[0] ?? '', stock: p.stock, quantity: 1 })}
                    disabled={p.stock === 0}
                    className="flex-1 bg-orange-500 hover:bg-orange-600 text-xs"
                  >
                    <ShoppingCart className="w-3.5 h-3.5 mr-1" /> Adicionar
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeItem(productId)}
                    disabled={removing === productId}
                    className="text-red-400 hover:text-red-500 hover:bg-red-50"
                  >
                    {removing === productId ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
