'use client'

import Link from 'next/link'
import Image from 'next/image'
import { X, Trash2, Plus, Minus, ShoppingBag } from 'lucide-react'
import { useCartStore } from '@/store/cart'
import { useUIStore } from '@/store/ui'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'

export function CartDrawer() {
  const { items, removeItem, updateQuantity, getTotals } = useCartStore()
  const { cartOpen, closeCart } = useUIStore()
  const totals = getTotals()
  const activeItems = items.filter((i) => !i.savedForLater)

  return (
    <>
      {/* Overlay */}
      {cartOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={closeCart}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed right-0 top-0 h-full w-full max-w-md z-50 bg-white shadow-xl flex flex-col transform transition-transform duration-300 ${
          cartOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <ShoppingBag className="w-5 h-5" />
            Carrinho ({totals.itemCount})
          </h2>
          <button onClick={closeCart} className="p-1.5 rounded-lg hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-500">
              <ShoppingBag className="w-12 h-12 text-gray-300" />
              <p className="text-sm">O seu carrinho está vazio.</p>
              <Button variant="outline" size="sm" onClick={closeCart}>
                Continuar a comprar
              </Button>
            </div>
          ) : (
            <ul className="space-y-4">
              {activeItems.map((item) => (
                <li key={item.productId} className="flex gap-3">
                  <div className="w-16 h-16 relative bg-gray-50 rounded-lg flex-shrink-0 overflow-hidden">
                    <Image src={item.image} alt={item.name} fill className="object-contain p-1" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-400">{item.brand}</p>
                    <p className="text-sm font-medium text-gray-900 line-clamp-2">{item.name}</p>
                    <p className="text-sm font-bold text-orange-500 mt-0.5">
                      {formatCurrency(item.salePrice ?? item.price)}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        className="w-6 h-6 rounded border border-gray-300 flex items-center justify-center hover:bg-gray-100"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-sm w-6 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        disabled={item.quantity >= item.stock}
                        className="w-6 h-6 rounded border border-gray-300 flex items-center justify-center hover:bg-gray-100 disabled:opacity-40"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={() => removeItem(item.productId)}
                    className="p-1 text-gray-400 hover:text-red-500 self-start"
                    aria-label="Remover"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        {activeItems.length > 0 && (
          <div className="border-t border-gray-200 p-4 space-y-3">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Subtotal</span>
              <span>{formatCurrency(totals.subtotal)}</span>
            </div>
            {totals.discount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Desconto</span>
                <span>-{formatCurrency(totals.discount)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-gray-900 text-base border-t pt-2">
              <span>Total</span>
              <span>{formatCurrency(totals.total)}</span>
            </div>
            <Link href="/checkout" onClick={closeCart}>
              <Button className="w-full" size="lg">
                Finalizar Compra
              </Button>
            </Link>
            <Link href="/carrinho" onClick={closeCart}>
              <Button variant="outline" className="w-full" size="sm">
                Ver Carrinho
              </Button>
            </Link>
          </div>
        )}
      </div>
    </>
  )
}
