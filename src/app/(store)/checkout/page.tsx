'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Truck, CheckCircle, ChevronRight } from 'lucide-react'
import { useCartStore } from '@/store/cart'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { formatCurrency } from '@/lib/utils'
import { checkoutFormSchema, type CheckoutFormData } from '@/lib/validations'
import Image from 'next/image'

export default function CheckoutPage() {
  const router = useRouter()
  const { items, getTotals, clearCart, couponCode } = useCartStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const totals = getTotals()
  const activeItems = items.filter((i) => !i.savedForLater)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { register, handleSubmit, watch, formState: { errors } } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutFormSchema) as any,
    defaultValues: { paymentMethod: 'cash_on_delivery', country: 'Angola' },
  })

  const paymentMethod = watch('paymentMethod')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async function onSubmit(data: any) {
    if (activeItems.length === 0) return
    setLoading(true)
    setError('')
    try {
      // Generate a UUID idempotency key to prevent duplicate orders on double-submit
      const idempotencyKey = crypto.randomUUID()
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          items: activeItems,
          couponCode,
          idempotencyKey,
        }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error ?? 'Erro ao processar pedido.')
      clearCart()
      router.push(`/conta/pedidos/${result.orderId}?novo=1`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado.')
    } finally {
      setLoading(false)
    }
  }

  if (activeItems.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-4 py-24 text-center">
        <p className="text-gray-500">O seu carrinho está vazio.</p>
        <Button onClick={() => router.push('/produtos')} className="mt-4">Ver Produtos</Button>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Finalizar Compra</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="lg:grid lg:grid-cols-3 lg:gap-8">
        {/* Form */}
        <div className="lg:col-span-2 space-y-6 mb-8 lg:mb-0">
          {/* Customer */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">1. Dados do Cliente</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Label htmlFor="name">Nome completo *</Label>
                <Input id="name" {...register('name')} error={errors.name?.message} className="mt-1" placeholder="João Silva" />
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input id="email" type="email" {...register('email')} error={errors.email?.message} className="mt-1" placeholder="joao@email.com" />
              </div>
              <div>
                <Label htmlFor="phone">Telefone *</Label>
                <Input id="phone" {...register('phone')} error={errors.phone?.message} className="mt-1" placeholder="+244 923 000 000" />
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">2. Morada de Entrega</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Label htmlFor="street">Rua / Endereço *</Label>
                <Input id="street" {...register('street')} error={errors.street?.message} className="mt-1" placeholder="Rua dos Coqueiros, 123" />
              </div>
              <div>
                <Label htmlFor="city">Cidade *</Label>
                <Input id="city" {...register('city')} error={errors.city?.message} className="mt-1" placeholder="Luanda" />
              </div>
              <div>
                <Label htmlFor="province">Província *</Label>
                <Input id="province" {...register('province')} error={errors.province?.message} className="mt-1" placeholder="Luanda" />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="notes">Observações</Label>
                <Textarea id="notes" {...register('notes')} className="mt-1" placeholder="Ponto de referência, instruções de entrega..." />
              </div>
            </div>
          </div>

          {/* Payment */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">3. Forma de Pagamento</h2>
            <div className="space-y-3">
              {/* COD */}
              <label className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors ${paymentMethod === 'cash_on_delivery' ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-gray-300'}`}>
                <input type="radio" value="cash_on_delivery" {...register('paymentMethod')} className="mt-0.5 accent-orange-500" />
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Truck className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Pagamento na Entrega</p>
                    <p className="text-sm text-gray-500">Pague em dinheiro quando receber a encomenda.</p>
                  </div>
                </div>
              </label>

              {/* Multicaixa */}
              <label className="flex items-start gap-3 p-4 rounded-xl border-2 border-gray-200 opacity-50 cursor-not-allowed">
                <input type="radio" value="multicaixa_express" disabled className="mt-0.5" />
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-gray-500">MX</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">Multicaixa Express</p>
                    <p className="text-sm text-gray-400">Disponível em breve.</p>
                  </div>
                </div>
              </label>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Order summary */}
        <div>
          <div className="bg-white rounded-xl border border-gray-200 p-6 sticky top-24">
            <h2 className="font-semibold text-gray-900 mb-4">Resumo do Pedido</h2>

            <ul className="space-y-3 mb-4">
              {activeItems.map((item) => (
                <li key={item.productId} className="flex gap-3">
                  <div className="w-12 h-12 relative bg-gray-50 rounded-lg flex-shrink-0 overflow-hidden">
                    <Image src={item.image} alt={item.name} fill className="object-contain p-1" />
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-gray-500 text-white text-xs rounded-full flex items-center justify-center">{item.quantity}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-600 truncate">{item.name}</p>
                    <p className="text-sm font-medium">{formatCurrency((item.salePrice ?? item.price) * item.quantity)}</p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="border-t border-gray-200 pt-3 space-y-2">
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
              <div className="flex justify-between font-bold text-gray-900 text-base pt-2 border-t">
                <span>Total</span>
                <span>{formatCurrency(totals.total)}</span>
              </div>
            </div>

            <Button type="submit" loading={loading} className="w-full mt-4" size="lg">
              <CheckCircle className="w-4 h-4" />
              Confirmar Pedido
            </Button>

            <p className="text-xs text-gray-400 text-center mt-3">
              Ao confirmar, aceita os nossos termos de serviço.
            </p>
          </div>
        </div>
      </form>
    </div>
  )
}
