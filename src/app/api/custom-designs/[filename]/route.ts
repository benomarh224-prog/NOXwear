import { readDesignMedia } from '@/lib/admin/storage'

export const runtime = 'nodejs'

export async function GET(_request: Request, { params }: { params: Promise<{ filename: string }> }) {
  const { filename } = await params
  // The unguessable ID is the share capability sent to the seller via WhatsApp.
  const match = filename.match(/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\.(png|jpg|webp)$/)
  if (!match) return new Response(null, { status: 404 })
  try {
    const media = await readDesignMedia(filename)
    if (!media) return new Response(null, { status: 404 })
    return new Response(media, { headers: {
      'Content-Type': match[1] === 'jpg' ? 'image/jpeg' : `image/${match[1]}`,
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'; sandbox",
      'Content-Disposition': `inline; filename="design.${match[1]}"`,
      'Cache-Control': 'private, max-age=86400',
      'X-Robots-Tag': 'noindex, nofollow, noimageindex',
    } })
  } catch { return new Response(null, { status: 503 }) }
}
