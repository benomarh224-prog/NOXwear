'use client'

import { useEffect } from 'react'
import { useUI } from '@/lib/ui-store'
import { analyticsPage, trackStoreEvent } from '@/lib/analytics-client'

export function StoreAnalytics() {
  const view = useUI((state) => state.view)
  const page = analyticsPage(view)
  useEffect(() => {
    // The store resolves query-string navigation after the initial hydration.
    if (page === '/' && ['collection', 'product', 'search', 'custom', 'checkout', 'success'].some((key) => new URLSearchParams(window.location.search).has(key))) return
    trackStoreEvent('page_view', page)
  }, [page])
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const link = event.target instanceof Element ? event.target.closest('a[href]') : null
      if (!link) return
      try {
        const url = new URL(link.getAttribute('href')!, window.location.origin)
        if (url.hostname === 'wa.me' || url.hostname === 'api.whatsapp.com') trackStoreEvent('whatsapp', page)
      } catch { /* Ignore non-web links. */ }
    }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [page])
  return null
}
