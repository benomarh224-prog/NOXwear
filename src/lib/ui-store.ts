'use client'

import { create } from 'zustand'

export type View =
  | { kind: 'home' }
  | { kind: 'category'; slug: string }
  | { kind: 'product'; slug: string }
  | { kind: 'search'; query: string }
  | { kind: 'checkout' }
  | { kind: 'success'; orderId: string; total: number; whatsappUrl: string }

interface UIState {
  view: View
  setView: (v: View, options?: { replace?: boolean }) => void
  back: () => void
  searchOpen: boolean
  setSearchOpen: (b: boolean) => void
}

const VIEW_PARAMS = ['collection', 'product', 'search', 'checkout', 'success'] as const

function historyData() {
  const state = window.history.state
  return state && typeof state === 'object' ? state : {}
}

function historyDepth() {
  const depth = historyData().noxDepth
  return typeof depth === 'number' && Number.isInteger(depth) && depth >= 0 ? depth : 0
}

function viewFromUrl(): View {
  const params = new URLSearchParams(window.location.search)
  const collection = params.get('collection')
  const product = params.get('product')
  const search = params.get('search')

  if (collection) return { kind: 'category', slug: collection }
  if (product) return { kind: 'product', slug: product }
  if (params.has('search')) return { kind: 'search', query: search || '' }
  if (params.has('checkout')) return { kind: 'checkout' }
  if (params.has('success')) {
    const saved = historyData().noxView
    if (saved?.kind === 'success') return saved
  }
  return { kind: 'home' }
}

function urlForView(view: View) {
  const url = new URL(window.location.href)
  VIEW_PARAMS.forEach((param) => url.searchParams.delete(param))

  switch (view.kind) {
    case 'category':
      url.searchParams.set('collection', view.slug)
      break
    case 'product':
      url.searchParams.set('product', view.slug)
      break
    case 'search':
      url.searchParams.set('search', view.query)
      break
    case 'checkout':
      url.searchParams.set('checkout', '1')
      break
    case 'success':
      url.searchParams.set('success', '1')
      break
  }

  return `${url.pathname}${url.search}${url.hash}`
}

export function initializeNavigation() {
  const view = viewFromUrl()
  window.history.replaceState(
    { ...historyData(), noxDepth: historyDepth(), noxView: view },
    '',
    urlForView(view),
  )
  useUI.setState({ view })

  const onPopState = () => {
    useUI.setState({ view: viewFromUrl(), searchOpen: false })
  }
  window.addEventListener('popstate', onPopState)
  return () => window.removeEventListener('popstate', onPopState)
}

export const useUI = create<UIState>((set, get) => ({
  view: { kind: 'home' },
  setView: (view, options) => {
    if (JSON.stringify(view) === JSON.stringify(get().view)) return

    if (typeof window !== 'undefined') {
      const replace = options?.replace === true
      const depth = historyDepth() + (replace ? 0 : 1)
      window.history[replace ? 'replaceState' : 'pushState'](
        { ...historyData(), noxDepth: depth, noxView: view },
        '',
        urlForView(view),
      )
      window.scrollTo(0, 0)
    }
    set({ view, searchOpen: false })
  },
  back: () => {
    if (typeof window !== 'undefined' && historyDepth() > 0) {
      window.history.back()
    } else {
      get().setView({ kind: 'home' }, { replace: true })
    }
  },
  searchOpen: false,
  setSearchOpen: (b) => set({ searchOpen: b }),
}))
