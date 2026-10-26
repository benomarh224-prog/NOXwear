import { NextResponse } from 'next/server'
import { isAdmin } from '@/lib/admin/auth'
import { readAnalytics } from '@/lib/analytics-store'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export async function GET(request: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'خاصك تدخل للإدارة' }, { status: 401 })
  const days = new URL(request.url).searchParams.get('days') || '7'
  if (days !== '7' && days !== '30') return NextResponse.json({ error: 'اختار 7 أو 30 يوم' }, { status: 400 })
  try { return NextResponse.json(await readAnalytics(Number(days) as 7 | 30), { headers: { 'Cache-Control': 'private, no-store' } }) }
  catch { return NextResponse.json({ error: 'تعذر تحميل الإحصائيات. حاول من جديد.' }, { status: 503 }) }
}
