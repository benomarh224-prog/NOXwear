export const ANALYTICS_EVENTS = ['page_view', 'add_to_cart', 'whatsapp', 'custom_request'] as const
export type AnalyticsEventName = typeof ANALYTICS_EVENTS[number]
export type AnalyticsDevice = 'mobile' | 'tablet' | 'desktop'
export type AnalyticsSource = 'direct' | 'google' | 'instagram' | 'facebook' | 'tiktok' | 'other'
export interface VisitorEvent { eventId: string; visitorId: string; event: AnalyticsEventName; page: string; device: AnalyticsDevice; source: AnalyticsSource }
export interface DayMetrics {
  day: string
  visitors: Record<string, true>
  ipCounts: Record<string, number>
  recentEvents: string[]
  views: number
  addToCart: number
  whatsapp: number
  customRequests: number
  checkoutStarts: number
  orders: number
  orderValue: number
  pages: Record<string, number>
  devices: Record<string, number>
  sources: Record<string, number>
  countries: Record<string, number>
}
export interface AnalyticsSummary {
  days: number
  todayVisitors: number
  visits: number
  views: number
  addToCart: number
  whatsapp: number
  customRequests: number
  checkoutStarts: number
  orders: number
  orderValue: number
  daily: { day: string; visits: number; views: number }[]
  products: { slug: string; views: number }[]
  devices: Record<string, number>
  sources: Record<string, number>
  countries: Record<string, number>
}

export function analyticsDay(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Casablanca', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now)
  return ['year', 'month', 'day'].map((key) => parts.find((part) => part.type === key)!.value).join('-')
}

export function emptyMetrics(day: string): DayMetrics {
  return { day, visitors: {}, ipCounts: {}, recentEvents: [], views: 0, addToCart: 0, whatsapp: 0, customRequests: 0, checkoutStarts: 0, orders: 0, orderValue: 0, pages: {}, devices: {}, sources: {}, countries: {} }
}

export function applyVisitorEvent(metrics: DayMetrics, event: VisitorEvent, visitorHash: string, ipHash: string, country: string) {
  if (metrics.recentEvents.includes(event.eventId) || (metrics.ipCounts[ipHash] || 0) >= 1000) return false
  metrics.recentEvents = [...metrics.recentEvents.slice(-255), event.eventId]
  metrics.ipCounts[ipHash] = (metrics.ipCounts[ipHash] || 0) + 1
  if (!metrics.visitors[visitorHash]) {
    metrics.visitors[visitorHash] = true
    metrics.devices[event.device] = (metrics.devices[event.device] || 0) + 1
    metrics.sources[event.source] = (metrics.sources[event.source] || 0) + 1
    metrics.countries[country] = (metrics.countries[country] || 0) + 1
  }
  if (event.event === 'page_view') {
    metrics.views++
    if (metrics.pages[event.page] !== undefined || Object.keys(metrics.pages).length < 1000) metrics.pages[event.page] = (metrics.pages[event.page] || 0) + 1
    if (event.page === '/checkout') metrics.checkoutStarts++
  } else if (event.event === 'add_to_cart') metrics.addToCart++
  else if (event.event === 'whatsapp') metrics.whatsapp++
  else if (event.event === 'custom_request') metrics.customRequests++
  return true
}

export function summarizeAnalytics(records: DayMetrics[], today: string): AnalyticsSummary {
  const summary: AnalyticsSummary = { days: records.length, todayVisitors: 0, visits: 0, views: 0, addToCart: 0, whatsapp: 0, customRequests: 0, checkoutStarts: 0, orders: 0, orderValue: 0, daily: [], products: [], devices: {}, sources: {}, countries: {} }
  const products: Record<string, number> = {}
  for (const record of records) {
    const visits = Object.keys(record.visitors).length
    if (record.day === today) summary.todayVisitors = visits
    summary.visits += visits
    for (const key of ['views', 'addToCart', 'whatsapp', 'customRequests', 'checkoutStarts', 'orders', 'orderValue'] as const) summary[key] += record[key]
    summary.daily.push({ day: record.day, visits, views: record.views })
    for (const key of ['devices', 'sources', 'countries'] as const) for (const [label, count] of Object.entries(record[key])) summary[key][label] = (summary[key][label] || 0) + count
    for (const [page, count] of Object.entries(record.pages)) if (page.startsWith('/product/')) products[page.slice(9)] = (products[page.slice(9)] || 0) + count
  }
  summary.orderValue = Math.round(summary.orderValue * 100) / 100
  summary.products = Object.entries(products).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([slug, views]) => ({ slug, views }))
  return summary
}
