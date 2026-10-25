import { randomUUID } from 'node:crypto'
import sharp from 'sharp'
import { NextResponse } from 'next/server'
import { isAdmin, sameOrigin } from '@/lib/admin/auth'
import { saveMedia } from '@/lib/admin/storage'

export const runtime = 'nodejs'
const MAX_BYTES = 4 * 1024 * 1024

export async function POST(request: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'خاصك تدخل لحساب الإدارة' }, { status: 401 })
  if (!sameOrigin(request)) return NextResponse.json({ error: 'طلب غير مسموح' }, { status: 403 })
  if (Number(request.headers.get('content-length') || 0) > MAX_BYTES + 10000) {
    return NextResponse.json({ error: 'الصورة كبيرة بزاف. اختار صورة أصغر من 4 ميغا.' }, { status: 413 })
  }
  const data = await request.formData().catch(() => null)
  const file = data?.get('file')
  if (!(file instanceof File) || file.size === 0 || file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'اختار صورة أصغر من 4 ميغا' }, { status: 400 })
  }
  let output: Buffer
  try {
    const bytes = Buffer.from(await file.arrayBuffer())
    const image = sharp(bytes, { limitInputPixels: 40_000_000 })
    const metadata = await image.metadata()
    if (!['jpeg', 'png', 'webp', 'avif', 'heif'].includes(metadata.format || '') || !metadata.width || !metadata.height) throw new Error('Invalid image')
    output = await image.rotate().resize({ width: 1800, height: 1800, fit: 'inside', withoutEnlargement: true }).webp({ quality: 86 }).toBuffer()
  } catch {
    return NextResponse.json({ error: 'هاد الملف ماشي صورة صالحة. جرّب JPG أو PNG أو WebP.' }, { status: 400 })
  }
  try {
    const url = await saveMedia(randomUUID(), output)
    return NextResponse.json({ url }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'تعذر رفع الصورة. حاول من جديد.' }, { status: 503 })
  }
}
