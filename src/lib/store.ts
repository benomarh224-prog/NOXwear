'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Product } from './types'

export interface CartLine {
  id: string
  productId: string
  slug: string
  name: string
  price: number
  image: string
  size: string
  color: string
  quantity: number
}

interface CartState {
  items: CartLine[]
  isOpen: boolean
  addItem: (item: Omit<CartLine, 'id' | 'quantity'> & { quantity?: number }) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, qty: number) => void
  syncCatalog: (products: Product[]) => void
  clear: () => void
  setOpen: (open: boolean) => void
  total: () => number
  count: () => number
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      addItem: (item) => {
        const existing = get().items.find(
          (i) => i.productId === item.productId && i.size === item.size && i.color === item.color,
        )
        if (existing) {
          set((s) => ({
            items: s.items.map((i) =>
              i.id === existing.id
                ? { ...i, quantity: i.quantity + (item.quantity || 1) }
                : i,
            ),
            isOpen: true,
          }))
        } else {
          set((s) => ({
            items: [
              ...s.items,
              {
                id: `${item.productId}-${item.size}-${item.color}-${Date.now()}`,
                productId: item.productId,
                slug: item.slug,
                name: item.name,
                price: item.price,
                image: item.image,
                size: item.size,
                color: item.color,
                quantity: item.quantity || 1,
              },
            ],
            isOpen: true,
          }))
        }
      },
      removeItem: (id) =>
        set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
      updateQuantity: (id, qty) =>
        set((s) => ({
          items: s.items.map((i) =>
            i.id === id ? { ...i, quantity: Math.max(1, qty) } : i,
          ),
        })),
      syncCatalog: (products) => {
        const catalog = new Map(products.map((product) => [product.id, product]))
        set((state) => {
          let changed = false
          const items = state.items.flatMap((item) => {
            const product = catalog.get(item.productId)
            if (!product || product.stock <= 0 || !product.sizes.includes(item.size) || !product.colors.includes(item.color)) { changed = true; return [] }
            const quantity = Math.min(item.quantity, product.stock)
            if (item.price === product.price && item.name === product.name && item.image === product.image && item.quantity === quantity) return [item]
            changed = true
            return [{ ...item, price: product.price, name: product.name, image: product.image, quantity }]
          })
          return changed ? { items } : state
        })
      },
      clear: () => set({ items: [] }),
      setOpen: (open) => set({ isOpen: open }),
      total: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
      count: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    { name: 'noxwear-cart' },
  ),
)
