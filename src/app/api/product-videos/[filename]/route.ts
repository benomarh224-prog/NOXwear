import { PRODUCT_VIDEO_FILENAME, parseVideoRange } from '@/lib/product-video'
import { productVideoMetadata, productVideoStream } from '@/lib/admin/product-video-store'

export const runtime = 'nodejs'
type Context = { params: Promise<{ filename: string }> }

async function serve(request: Request, context: Context, headOnly = false) {
  const { filename } = await context.params
  if (!PRODUCT_VIDEO_FILENAME.test(filename)) return new Response(null, { status: 404 })
  try {
    const metadata = await productVideoMetadata(filename)
    if (!metadata) return new Response(null, { status: 404 })
    const headers = new Headers({
      'Content-Type': filename.endsWith('.mp4') ? 'video/mp4' : 'video/webm',
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'; sandbox",
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'public, max-age=31536000, immutable',
      'ETag': metadata.etag,
    })
    const rangeHeader = request.headers.get('if-range') && request.headers.get('if-range') !== metadata.etag ? null : request.headers.get('range')
    const range = headOnly ? null : parseVideoRange(rangeHeader, metadata.size)
    if (range === 'invalid') { headers.set('Cache-Control', 'no-store'); headers.set('Content-Range', `bytes */${metadata.size}`); return new Response(null, { status: 416, headers }) }
    if (headOnly) { headers.set('Content-Length', String(metadata.size)); return new Response(null, { headers }) }
    const result = await productVideoStream(filename, range)
    if (!result) return new Response(null, { status: 404 })
    if (range && result.partial) {
      headers.set('Content-Range', `bytes ${range.start}-${range.end}/${metadata.size}`)
      headers.set('Content-Length', String(range.end - range.start + 1))
      return new Response(result.stream, { status: 206, headers })
    }
    headers.set('Content-Length', String(metadata.size))
    return new Response(result.stream, { headers })
  } catch { return new Response(null, { status: 503 }) }
}
export const GET = (request: Request, context: Context) => serve(request, context)
export const HEAD = (request: Request, context: Context) => serve(request, context, true)
