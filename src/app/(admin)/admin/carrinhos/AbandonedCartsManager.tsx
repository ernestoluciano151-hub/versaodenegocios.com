'use client'
import { useState, useEffect, useCallback } from 'react'
import { ShoppingCart, RefreshCw, ChevronLeft, ChevronRight, User, Package, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface CartItem {
  id: string
  quantity: number
  product: {
    id: string
    name: string
    price: number
    salePrice: number | null
    images: string[]
    slug: string
  }
}

interface Cart {
  id: string
  sessionId: string | null
  updatedAt: string
  customer: { id: string; name: string; email: string; phone: string | null } | null
  items: CartItem[]
}

interface ApiResponse {
  carts: Cart[]
  total: number
  page: number
  pages: number
}

function formatAOA(value: number) {
  return new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(value)
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const h = Math.floor(diff / 3_600_000)
  const d = Math.floor(h / 24)
  if (d > 0) return `há ${d} dia${d > 1 ? 's' : ''}`
  return `há ${h}h`
}

export function AbandonedCartsManager() {
  const [data, setData] = useState<ApiResponse | null>(null)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)

  const load = useCallback(async (p: number) => {
    setLoading(true)
    const res = await fetch(`/api/admin/carts?page=${p}`)
    const json = await res.json()
    setData(json)
    setLoading(false)
  }, [])

  useEffect(() => { load(page) }, [load, page])

  const cartTotal = (items: CartItem[]) =>
    items.reduce((sum, i) => sum + (i.product.salePrice ?? i.product.price) * i.quantity, 0)

  if (!data) return (
    <div className="animate-pulse space-y-3">
      {[1, 2, 3].map(i => <div key={i} className="h-20 bg-gray-100 rounded-xl" />)}
    </div>
  )

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 text-orange-500" />
          <span className="font-medium text-gray-700">{data.total} carrinhos abandonados</span>
        </div>
        <Button variant="outline" size="sm" onClick={() => load(page)} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {data.carts.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Nenhum carrinho abandonado.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {data.carts.map((cart) => (
            <div key={cart.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {/* Summary row */}
              <button
                onClick={() => setExpanded(expanded === cart.id ? null : cart.id)}
                className="w-full flex items-center gap-4 p-4 text-left hover:bg-gray-50 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                  {cart.customer ? (
                    <User className="w-5 h-5 text-orange-500" />
                  ) : (
                    <ShoppingCart className="w-5 h-5 text-gray-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">
                    {cart.customer?.name ?? 'Visitante anónimo'}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {cart.customer?.email ?? (cart.sessionId ? `Sessão: ${cart.sessionId.slice(0, 12)}…` : 'Sem identificação')}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-semibold text-gray-900">{formatAOA(cartTotal(cart.items))}</p>
                  <p className="text-xs text-gray-400 flex items-center gap-1 justify-end">
                    <Clock className="w-3 h-3" />
                    {timeAgo(cart.updatedAt)}
                  </p>
                </div>
                <div className="ml-2">
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                    {cart.items.length} {cart.items.length === 1 ? 'item' : 'itens'}
                  </span>
                </div>
              </button>

              {/* Expanded items */}
              {expanded === cart.id && (
                <div className="border-t border-gray-100 px-4 pb-4 pt-3 space-y-3">
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Itens no carrinho</p>
                  {cart.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-50 rounded-lg overflow-hidden flex-shrink-0">
                        {item.product.images[0] ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={item.product.images[0]} alt={item.product.name} className="w-full h-full object-contain p-1" />
                        ) : (
                          <Package className="w-5 h-5 text-gray-300 m-auto" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-800 truncate">{item.product.name}</p>
                        <p className="text-xs text-gray-500">Qtd: {item.quantity}</p>
                      </div>
                      <p className="text-sm font-medium text-gray-900 flex-shrink-0">
                        {formatAOA((item.product.salePrice ?? item.product.price) * item.quantity)}
                      </p>
                    </div>
                  ))}
                  {cart.customer?.email && (
                    <a
                      href={`mailto:${cart.customer.email}?subject=O seu carrinho VN Commerce está à sua espera&body=Olá ${cart.customer.name},%0A%0AVimos que deixou alguns artigos no seu carrinho. Ainda está interessado?%0A%0AClique aqui para finalizar a compra: https://www.versaodenegocios.com/carrinho%0A%0AObrigado,%0AEquipa VN Commerce`}
                      className="inline-flex items-center gap-2 text-sm text-orange-500 hover:text-orange-600 font-medium mt-1"
                    >
                      Enviar email de recuperação →
                    </a>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {data.pages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <span className="text-sm text-gray-500">Página {data.page} de {data.pages}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" disabled={page >= data.pages} onClick={() => setPage(p => p + 1)}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
