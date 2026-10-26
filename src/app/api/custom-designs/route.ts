import { createHmac, randomUUID } from 'node:crypto'
import { NextResponse } from 'next/server'
import { readJson, writeJson, saveDesignMedia, StorageConflictError } from '@/lib/admin/storage'
import { DESIGN_MAX_BYTES } from '@/lib/custom-print'
import { inspectDesignImage } from '@/lib/design-image'

export const runtime = 'nodejs'

async function allowUpload(request: Request) {
  const secret = process.env.NEXTAUTH_SECRET
  if (!secret) throw new Error('Upload configuration unavailable')
  const ip = (request.headers.get('x-vercel-forwarded-for') || request.headers.get('x-forwarded-for') || 'local').split(',')[0].trim()
  const key = createHmac('sha256', secret).update(`custom-print:${ip}`).digest('hex')
  const path = `custom-designs/security/${key}.json`
  for (let attempt = 0; attempt < 3; attempt++) {
    const saved = await readJson<{ count: number; expiresAt: number }>(path)
    const now = Date.now()
    const counter = !saved || saved.value.expiresAt <= now ? { count: 0, expiresAt: now + 3600000 } : saved.value
    if (counter.count >= 8) return false
    try {
      await writeJson(path, { ...counter, count: counter.count + 1 }, saved?.revision || null)
      return true
    } catch (error) {
      if (!(error instanceof StorageConflictError)) throw error
    }
  }
  return false
}

export async function POST(request: Request) {
  if (request.headers.get('origin') !== new URL(request.url).origin) return NextResponse.json({ error: 'طلب غير مسموح' }, { status: 403 })
  if (!request.headers.get('content-type')?.startsWith('multipart/form-data')) return NextResponse.json({ error: 'اختار صورة للتصميم' }, { status: 400 })
  if (Number(request.headers.get('content-length') || 0) > DESIGN_MAX_BYTES + 16384) return NextResponse.json({ error: 'اختار صورة أصغر من 4 ميغا' }, { status: 413 })
  try {
    if (!(await allowUpload(request))) return NextResponse.json({ error: 'وصلتي للحد ديال الرفع. جرّب من بعد ساعة، أو صيفط التصميم مباشرة فواتساب.' }, { status: 429, headers: { 'Retry-After': '3600' } })
    const data = await request.formData().catch(() => null)
    const file = data?.get('file')
    if (!(file instanceof File) || !file.size || file.size > DESIGN_MAX_BYTES) return NextResponse.json({ error: 'اختار صورة أصغر من 4 ميغا' }, { status: 400 })
    const bytes = Buffer.from(await file.arrayBuffer())
    let metadata: ReturnType<typeof inspectDesignImage>
    try { metadata = inspectDesignImage(bytes) }
    catch { return NextResponse.json({ error: 'اختار صورة صالحة بصيغة JPG أو PNG أو WebP، وبحجم لا يتجاوز 40 ميغابكسل.' }, { status: 400 }) }
    const url = await saveDesignMedia(randomUUID(), bytes, metadata.extension, metadata.contentType)
    return NextResponse.json({ url }, { status: 201, headers: { 'Cache-Control': 'no-store' } })
  } catch {
    return NextResponse.json({ error: 'تعذر رفع التصميم دابا. حاول من جديد، أو حط رابط الصورة.' }, { status: 503 })
  }
}
