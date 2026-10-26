'use client'

import { analyticsDay, type AnalyticsEventName, type AnalyticsSource } from './analytics-model'
import type { View } from './ui-store'

let fallback: { day: string; id: string } | undefined
const recent = new Map<string, number>()

export function analyticsPage(view: View) {
  if (view.kind === 'product') return '/product/' + view.slug
  if (view.kind === 'category') return '/collection/' + view.slug
  if (view.kind === 'custom-print') return '/custom-print'
  if (view.kind === 'home') return '/'
  return '/' + view.kind
}

function visitorId() {
  const day = analyticsDay()
  const key = 'noxwear-daily-visitor'
  try {
    const stored = JSON.parse(localStorage.getItem(key) || 'null')
    if (stored?.day === day && typeof stored.id === 'string') return stored.id as string
    const value = { day, id: crypto.randomUUID() }
    localStorage.setItem(key, JSON.stringify(value))
    return value.id
  } catch {
    if (fallback?.day !== day) fallback = { day, id: crypto.randomUUID() }
    return fallback.id
  }
}

function source(): AnalyticsSource {
  try {
    const host = new URL(document.referrer).hostname
    if (host === window.location.hostname) return 'direct'
    for (const name of ['instagram', 'facebook', 'tiktok'] as const) if (host === `${name}.com` || host.endsWith(`.${name}.com`)) return name
    if (/(^|\.)google\.[a-z.]+$/.test(host)) return 'google'
    return 'other'
  } catch { return 'direct' }
}

export function trackStoreEvent(event: AnalyticsEventName, page: string) {
  if (typeof window === 'undefined' || !crypto.randomUUID || navigator.doNotTrack === '1' || (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl) return
  try {
    const key = `${event}:${page}`
    if (event === 'page_view' && Date.now() - (recent.get(key) || 0) < 750) return
    recent.set(key, Date.now())
    const device = /ipad|tablet/i.test(navigator.userAgent) ? 'tablet' : /mobile|iphone|android/i.test(navigator.userAgent) ? 'mobile' : 'desktop'
    const body = JSON.stringify({ eventId: crypto.randomUUID(), visitorId: visitorId(), event, page, device, source: source() })
    void fetch('/api/analytics', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true }).catch(() => {})
  } catch { /* Statistics must never prevent browsing or checkout. */ }
}
