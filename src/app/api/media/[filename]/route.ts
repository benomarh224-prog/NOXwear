import sharp from 'sharp'
import { readMedia } from '@/lib/admin/storage'
import { MEDIA_IMAGE_WIDTHS } from '@/lib/media-image'

export const runtime = 'nodejs'

const immutableHeaders = {
  'Content-Type': 'image/webp',
  'X-Content-Type-Options': 'nosniff',
  'Cache-Control': 'public, max-age=31536000, immutable',
  'Vercel-CDN-Cache-Control': 'public, max-age=31536000, immutable',
}

function errorResponse(status: number) {
  return new Response(null, { status, headers: { 'Cache-Control': 'no-store' } })
}

export async function GET(request: Request, { params }: { params: Promise<{ filename: string }> }) {
  const { filename } = await params
  if (!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\.webp$/.test(filename)) return errorResponse(404)
  const query = new URL(request.url).searchParams
  const width = query.get('w')
  // Reject arbitrary transforms: every supported size has one CDN cache key.
  if (query.getAll('w').length > 1 || (width !== null && !MEDIA_IMAGE_WIDTHS.some((size) => String(size) === width))) return errorResponse(400)
  try {
    const image = await readMedia(filename)
    if (!image) return errorResponse(404)
    if (width === null) return new Response(image, { headers: immutableHeaders })

    const bytes = Buffer.from(await new Response(image).arrayBuffer())
    const resized = await sharp(bytes, { limitInputPixels: 40_000_000 })
      .rotate()
      .resize({ width: Number(width), withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer()
    return new Response(new Uint8Array(resized), { headers: {
      ...immutableHeaders, 'Content-Length': String(resized.length),
    } })
  } catch {
    return errorResponse(503)
  }
}
