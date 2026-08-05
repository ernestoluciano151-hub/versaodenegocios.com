'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CartItem, CartTotals } from '@/types'

interface CartStore {
  items: CartItem[]
  couponCode?: string
  couponDiscount: number
  shipping: number

  addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  toggleSavedForLater: (productId: string) => void
  clearCart: () => void
  applyCoupon: (code: string, discount: number) => void
  removeCoupon: () => void
  getTotals: () => CartTotals
  getItemCount: () => number
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get): CartStore => ({
      items: [],
      couponCode: undefined,
      couponDiscount: 0,
      shipping: 0,

      addItem: (item) => {
        set((state) => {
          const existing = state.items.find((i) => i.productId === item.productId)
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.productId === item.productId
                  ? { ...i, quantity: Math.min(i.quantity + (item.quantity ?? 1), i.stock) }
                  : i
              ),
            }
          }
          return { items: [...state.items, { ...item, quantity: item.quantity ?? 1 }] }
        })
      },

      removeItem: (productId) => {
        set((state) => ({ items: state.items.filter((i) => i.productId !== productId) }))
      },

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId)
          return
        }
        set((state) => ({
          items: state.items.map((i) =>
            i.productId === productId ? { ...i, quantity: Math.min(quantity, i.stock) } : i
          ),
        }))
      },

      toggleSavedForLater: (productId) => {
        set((state) => ({
          items: state.items.map((i) =>
            i.productId === productId ? { ...i, savedForLater: !i.savedForLater } : i
          ),
        }))
      },

      clearCart: () => set({ items: [], couponCode: undefined, couponDiscount: 0 }),

      applyCoupon: (code, discount) => set({ couponCode: code, couponDiscount: discount }),

      removeCoupon: () => set({ couponCode: undefined, couponDiscount: 0 }),

      getTotals: (): CartTotals => {
        const { items, couponDiscount, shipping } = get()
        const activeItems = items.filter((i) => !i.savedForLater)
        const subtotal = activeItems.reduce(
          (sum, i) => sum + (i.salePrice ?? i.price) * i.quantity,
          0
        )
        const itemCount = activeItems.reduce((sum, i) => sum + i.quantity, 0)
        return {
          subtotal,
          discount: couponDiscount,
          shipping,
          total: Math.max(0, subtotal - couponDiscount + shipping),
          itemCount,
        }
      },

      getItemCount: () => {
        return get().items.filter((i) => !i.savedForLater).reduce((sum, i) => sum + i.quantity, 0)
      },
    }),
    { name: 'vn-cart' }
  )
)

// ── Sincronização com o servidor (carrinhos abandonados no admin) ─────────────
// O carrinho vive em localStorage (Zustand persist) para performance, mas o
// admin precisa de ver os carrinhos activos/abandonados — por isso replicamos
// o estado para a base de dados (Cart/CartItem) sempre que ele muda, com
// debounce para não disparar um pedido por cada clique.
if (typeof window !== 'undefined') {
  let syncTimer: ReturnType<typeof setTimeout> | null = null
  let lastSynced = ''

  const syncCart = (items: CartItem[]) => {
    const payload = JSON.stringify(
      items.map((i) => ({ productId: i.productId, quantity: i.quantity, savedForLater: !!i.savedForLater }))
    )
    if (payload === lastSynced) return
    lastSynced = payload
    fetch('/api/cart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: JSON.parse(payload) }),
      keepalive: true,
    }).catch(() => {})
  }

  useCartStore.subscribe((state) => {
    if (syncTimer) clearTimeout(syncTimer)
    syncTimer = setTimeout(() => syncCart(state.items), 1200)
  })
}
