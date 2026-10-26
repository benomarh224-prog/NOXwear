import { NextResponse } from 'next/server'
import { z } from 'zod'
import { isAdmin, sameOrigin } from '@/lib/admin/auth'
import { recordVisitorEvent } from '@/lib/analytics-store'
import { ANALYTICS_EVENTS } from '@/lib/analytics-model'

export const runtime = 'nodejs'
const schema = z.object({
  eventId: z.string().uuid(), visitorId: z.string().uuid(), event: z.enum(ANALYTICS_EVENTS),
  page: z.string().max(200).regex(/^\/(?:search|checkout|success|custom-print|(?:product|collection)\/[\p{L}\p{N}_.-]{1,160})?$/u),
  device: z.enum(['mobile', 'tablet', 'desktop']), source: z.enum(['direct', 'google', 'instagram', 'facebook', 'tiktok', 'other']),
}).strict()

export async function POST(request: Request) {
  if (!sameOrigin(request)) return new Response(null, { status: 403 })
  if (!request.headers.get('content-type')?.startsWith('application/json') || Number(request.headers.get('content-length') || 0) > 2048) return new Response(null, { status: 400 })
  const text = await request.text()
  if (text.length > 2048) return new Response(null, { status: 400 })
  let body: unknown
  try { body = JSON.parse(text) } catch { return new Response(null, { status: 400 }) }
  const parsed = schema.safeParse(body)
  if (!parsed.success) return new Response(null, { status: 400 })
  if (/bot|spider|crawler|headless|lighthouse/i.test(request.headers.get('user-agent') || '')) return new Response(null, { status: 204 })
  try {
    if (!(await isAdmin())) await recordVisitorEvent(parsed.data, request)
    return new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } })
  } catch { return NextResponse.json({ error: 'Statistics unavailable' }, { status: 503 }) }
}
