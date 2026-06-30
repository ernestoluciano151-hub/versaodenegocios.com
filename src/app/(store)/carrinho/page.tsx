'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Trash2, Minus, Plus, ShoppingBag, Tag } from 'lucide-react'
import { useCartStore } from '@/store/cart'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatCurrency } from '@/lib/utils'
import { useState } from 'react'

export default function CarrinhoPage() {
  const { items, removeItem, updateQuantity, getTotals, applyCoupon, removeCoupon, couponCode } = useCartStore()
  const [couponInput, setCouponInput] = useState('')
  const [couponError, setCouponError] = useState('')
  const [couponLoading, setCouponLoading] = useState(false)
  const totals = getTotals()
  const activeItems = items.filter((i) => !i.savedForLater)

  async function handleCoupon() {
    if (!couponInput.trim()) return
    setCouponLoading(true)
    setCouponError('')
    try {
      const res = await fetch(`/api/coupons/validate?code=${couponInput}&subtotal=${totals.subtotal}`)
      const data = await res.json()
      if (data.error) { setCouponError(data.error); return }
      applyCoupon(couponInput.toUpperCase(), data.discount)
      setCouponInput('')
    } catch {
      setCouponError('Erro ao validar cupão.')
    } finally {
      setCouponLoading(false)
    }
  }

  if (activeItems.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">O seu carrinho está vazio</h1>
        <p className="text-gray-500 mb-8">Adicione produtos para começar.</p>
        <Link href="/produtos">
          <Button size="lg">Ver Produtos</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Carrinho de Compras</h1>

      <div className="lg:grid lg:grid-cols-3 lg:gap-8">
        {/* Items */}
        <div className="lg:col-span-2 space-y-4 mb-8 lg:mb-0">
          {activeItems.map((item) => (
            <div key={item.productId} className="bg-white rounded-xl border border-gray-200 p-4 flex gap-4">
              <div className="w-20 h-20 relative bg-gray-50 rounded-lg flex-shrink-0 overflow-hidden">
                <Image src={item.image} alt={item.name} fill className="object-contain p-2" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-400">{item.brand}</p>
                <Link href={`/produtos/${item.slug}`} className="text-sm font-medium text-gray-900 hover:text-orange-500 line-clamp-2">
                  {item.name}
                </Link>
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                      className="w-8 h-8 flex items-center justify-center hover:bg-gray-100"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-10 text-center text-sm">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                      disabled={item.quantity >= item.stock}
                      className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 disabled:opacity-40"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="text-right">
                    {item.salePrice && (
                      <p className="text-xs text-gray-400 line-through">{formatCurrency(item.price * item.quantity)}</p>
                    )}
                    <p className="font-bold text-gray-900">{formatCurrency((item.salePrice ?? item.price) * item.quantity)}</p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => removeItem(item.productId)}
                className="text-gray-400 hover:text-red-500 self-start"
                aria-label="Remover"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="space-y-4">
          {/* Coupon */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Tag className="w-4 h-4 text-orange-500" />
              <h3 className="font-medium text-gray-900">Código Promocional</h3>
            </div>
            {couponCode ? (
              <div className="flex items-center justify-between bg-green-50 rounded-lg px-3 py-2">
                <span className="text-sm font-medium text-green-700">{couponCode}</span>
                <button onClick={removeCoupon} className="text-xs text-red-500 hover:underline">Remover</button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input
                  placeholder="Código"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                  error={couponError}
                />
                <Button onClick={handleCoupon} loading={couponLoading} variant="outline" size="md">
                  Aplicar
                </Button>
              </div>
            )}
          </div>

          {/* Order summary */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
            <h3 className="font-semibold text-gray-900">Resumo do Pedido</h3>
            <div className="flex justify-between text-sm text-gray-600">
              <span>Subtotal ({totals.itemCount} ite{totals.itemCount !== 1 ? 'ns' : 'm'})</span>
              <span>{formatCurrency(totals.subtotal)}</span>
            </div>
            {totals.discount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Desconto</span>
                <span>-{formatCurrency(totals.discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm text-gray-600">
              <span>Envio</span>
              <span>{totals.shipping > 0 ? formatCurrency(totals.shipping) : 'A calcular'}</span>
            </div>
            <div className="flex justify-between font-bold text-gray-900 text-lg border-t pt-3">
              <span>Total</span>
              <span>{formatCurrency(totals.total)}</span>
            </div>
            <Link href="/checkout">
              <Button className="w-full" size="lg">Finalizar Compra</Button>
            </Link>
            <Link href="/produtos">
              <Button variant="ghost" className="w-full" size="sm">Continuar a Comprar</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
