import { randomUUID } from 'node:crypto'
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import { isAdmin, sameOrigin } from '@/lib/admin/auth'
import { cloudStorageEnabled } from '@/lib/admin/storage'
import { saveLocalProductVideo } from '@/lib/admin/product-video-store'
import { MAX_PRODUCT_VIDEO_BYTES, PRODUCT_VIDEO_FILENAME, validVideoHeader, videoExtension } from '@/lib/product-video'

export const runtime = 'nodejs'

export async function GET() {
  if (!(await isAdmin())) return Response.json({ error: 'خاصك تدخل لحساب الإدارة' }, { status: 401 })
  return Response.json({ direct: cloudStorageEnabled() }, { headers: { 'Cache-Control': 'private, no-store' } })
}

export async function POST(request: Request) {
  if (!(await isAdmin())) return Response.json({ error: 'خاصك تدخل لحساب الإدارة' }, { status: 401 })
  if (!sameOrigin(request)) return Response.json({ error: 'طلب غير مسموح' }, { status: 403 })
  if (!cloudStorageEnabled()) {
    if (process.env.VERCEL) return Response.json({ error: 'تخزين الفيديو ما مفعّلش' }, { status: 503 })
    if (Number(request.headers.get('content-length') || 0) > MAX_PRODUCT_VIDEO_BYTES + 10000) return Response.json({ error: 'الفيديو خاصو يكون أقل من 50 ميغا' }, { status: 413 })
    const form = await request.formData().catch(() => null)
    const file = form?.get('file')
    if (!(file instanceof File) || !file.size || file.size > MAX_PRODUCT_VIDEO_BYTES) return Response.json({ error: 'اختار فيديو أصغر من 50 ميغا' }, { status: 400 })
    const extension = videoExtension(file.type)
    const bytes = new Uint8Array(await file.arrayBuffer())
    if (!extension || !validVideoHeader(bytes, extension)) return Response.json({ error: 'اختار فيديو MP4 أو WebM صالح' }, { status: 400 })
    try {
      const filename = `${randomUUID()}.${extension}`
      await saveLocalProductVideo(filename, bytes)
      return Response.json({ url: `/api/product-videos/${filename}` }, { status: 201 })
    } catch { return Response.json({ error: 'تعذر رفع الفيديو. حاول من جديد.' }, { status: 503 }) }
  }
  if (Number(request.headers.get('content-length') || 0) > 8192) return Response.json({ error: 'طلب الرفع غير صالح' }, { status: 413 })
  const body = await request.json().catch(() => null) as HandleUploadBody | null
  if (!body || body.type !== 'blob.generate-client-token') return Response.json({ error: 'طلب الرفع غير صالح' }, { status: 400 })
  try {
    const result = await handleUpload({
      request, body,
      onBeforeGenerateToken: async (pathname) => {
        const filename = pathname.replace(/^catalog\/videos\//, '')
        if (pathname !== `catalog/videos/${filename}` || !PRODUCT_VIDEO_FILENAME.test(filename)) throw new Error('Invalid video path')
        return {
          allowedContentTypes: [filename.endsWith('.mp4') ? 'video/mp4' : 'video/webm'],
          maximumSizeInBytes: MAX_PRODUCT_VIDEO_BYTES,
          addRandomSuffix: false,
          allowOverwrite: false,
          validUntil: Date.now() + 15 * 60 * 1000,
        }
      },
    })
    return Response.json(result, { headers: { 'Cache-Control': 'private, no-store' } })
  } catch { return Response.json({ error: 'تعذر بدء رفع الفيديو. حاول من جديد.' }, { status: 400 }) }
}
