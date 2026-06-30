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
    (set, get) => ({
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
