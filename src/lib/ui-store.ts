'use client'

import { create } from 'zustand'

import { viewFromParams, type View } from './navigation-view'
export type { View } from './navigation-view'

interface UIState {
  view: View
  setView: (v: View, options?: { replace?: boolean }) => void
  back: () => void
  searchOpen: boolean
  setSearchOpen: (b: boolean) => void
}

const VIEW_PARAMS = ['collection', 'product', 'search', 'checkout', 'success', 'custom'] as const

function historyData() {
  const state = window.history.state
  return state && typeof state === 'object' ? state : {}
}

function historyDepth() {
  const depth = historyData().noxDepth
  return typeof depth === 'number' && Number.isInteger(depth) && depth >= 0 ? depth : 0
}

function viewFromUrl(): View {
  return viewFromParams(new URLSearchParams(window.location.search), historyData().noxView)
}

interface ScrollPosition { left: number; top: number }
const positions = new Map<string, ScrollPosition>()
let currentEntry = ''
let pendingScroll: ScrollPosition | null = null

function scrollPosition(): ScrollPosition {
  return { left: Math.max(0, window.scrollX), top: Math.max(0, window.scrollY) }
}

function savedPosition(value: unknown): ScrollPosition | null {
  if (!value || typeof value !== 'object') return null
  const { left, top } = value as ScrollPosition
  return Number.isFinite(left) && Number.isFinite(top) && left >= 0 && top >= 0 ? { left, top } : null
}

function rememberScroll() {
  if (currentEntry && !pendingScroll) positions.set(currentEntry, scrollPosition())
}

function saveHistoryScroll() {
  rememberScroll()
  window.history.replaceState({ ...historyData(), noxScroll: positions.get(currentEntry) || scrollPosition() }, '')
}

// Called in a layout effect, after the destination DOM has committed and before
// paint. Never scroll the old collection while React is still replacing it.
export function restoreNavigationScroll() {
  if (!pendingScroll) return
  const target = pendingScroll
  pendingScroll = null
  window.scrollTo({ ...target, behavior: 'instant' })
  rememberScroll()
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
    case 'custom-print':
      url.searchParams.set('custom', '1')
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
  const previousRestoration = window.history.scrollRestoration
  window.history.scrollRestoration = 'manual'
  const view = viewFromUrl()
  currentEntry = historyData().noxEntry || window.crypto.randomUUID()
  pendingScroll = savedPosition(historyData().noxScroll) || scrollPosition()
  positions.set(currentEntry, pendingScroll)
  window.history.replaceState(
    { ...historyData(), noxEntry: currentEntry, noxDepth: historyDepth(), noxView: view, noxScroll: pendingScroll },
    '',
    urlForView(view),
  )
  useUI.setState({ view })

  const onPopState = () => {
    currentEntry = historyData().noxEntry || window.crypto.randomUUID()
    pendingScroll = positions.get(currentEntry) || savedPosition(historyData().noxScroll) || { left: 0, top: 0 }
    useUI.setState({ view: viewFromUrl(), searchOpen: false })
  }
  window.addEventListener('scroll', rememberScroll, { passive: true })
  window.addEventListener('pagehide', saveHistoryScroll)
  window.addEventListener('popstate', onPopState)
  return () => {
    saveHistoryScroll()
    window.history.scrollRestoration = previousRestoration
    window.removeEventListener('scroll', rememberScroll)
    window.removeEventListener('pagehide', saveHistoryScroll)
    window.removeEventListener('popstate', onPopState)
  }
}

export const useUI = create<UIState>((set, get) => ({
  view: { kind: 'home' },
  setView: (view, options) => {
    if (JSON.stringify(view) === JSON.stringify(get().view)) return

    if (typeof window !== 'undefined') {
      saveHistoryScroll()
      const replace = options?.replace === true
      const depth = historyDepth() + (replace ? 0 : 1)
      currentEntry = window.crypto.randomUUID()
      pendingScroll = { left: 0, top: 0 }
      positions.set(currentEntry, pendingScroll)
      window.history[replace ? 'replaceState' : 'pushState'](
        { ...historyData(), noxEntry: currentEntry, noxDepth: depth, noxView: view, noxScroll: pendingScroll },
        '',
        urlForView(view),
      )
    }
    set({ view, searchOpen: false })
  },
  back: () => {
    if (typeof window !== 'undefined' && historyDepth() > 0) {
      saveHistoryScroll()
      window.history.back()
    } else {
      get().setView({ kind: 'home' }, { replace: true })
    }
  },
  searchOpen: false,
  setSearchOpen: (b) => set({ searchOpen: b }),
}))
