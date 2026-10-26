import 'server-only'
import { createHmac } from 'node:crypto'
import { readJson, writeJson, StorageConflictError } from './admin/storage'
import { analyticsDay, applyVisitorEvent, emptyMetrics, summarizeAnalytics, type DayMetrics, type VisitorEvent } from './analytics-model'

async function changeDay(day: string, mutate: (metrics: DayMetrics) => boolean) {
  const path = `analytics/days/${day}.json`
  for (let attempt = 0; attempt < 8; attempt++) {
    const saved = await readJson<DayMetrics>(path)
    const metrics = saved?.value || emptyMetrics(day)
    if (!mutate(metrics)) return
    try { await writeJson(path, metrics, saved?.revision || null); return }
    catch (error) {
      if (!(error instanceof StorageConflictError) || attempt === 7) throw error
      await new Promise((resolve) => setTimeout(resolve, 15 + Math.random() * 50 * (attempt + 1)))
    }
  }
}

export async function recordVisitorEvent(event: VisitorEvent, request: Request) {
  const day = analyticsDay()
  const secret = process.env.NEXTAUTH_SECRET
  if (!secret) throw new Error('Analytics configuration unavailable')
  const hash = (value: string) => createHmac('sha256', secret).update(`${day}:${value}`).digest('hex').slice(0, 32)
  const ip = (request.headers.get('x-vercel-forwarded-for') || request.headers.get('x-forwarded-for') || 'local').split(',')[0].trim()
  const rawCountry = request.headers.get('x-vercel-ip-country') || ''
  const country = /^[A-Z]{2}$/.test(rawCountry) ? rawCountry : 'unknown'
  await changeDay(day, (metrics) => applyVisitorEvent(metrics, event, hash(event.visitorId), hash(`ip:${ip}`), country))
}

export async function recordRegisteredOrder(id: string, amount: number) {
  await changeDay(analyticsDay(), (metrics) => {
    const eventId = `order:${id}`
    if (metrics.recentEvents.includes(eventId)) return false
    metrics.recentEvents = [...metrics.recentEvents.slice(-255), eventId]
    metrics.orders++
    metrics.orderValue = Math.round((metrics.orderValue + amount) * 100) / 100
    return true
  })
}

export async function readAnalytics(days: 7 | 30) {
  const today = analyticsDay()
  const anchor = new Date(`${today}T00:00:00Z`).getTime()
  const dates = Array.from({ length: days }, (_, index) => new Date(anchor - (days - index - 1) * 86400000).toISOString().slice(0, 10))
  const records = await Promise.all(dates.map(async (day) => (await readJson<DayMetrics>(`analytics/days/${day}.json`))?.value || emptyMetrics(day)))
  return summarizeAnalytics(records, today)
}
