import { readMedia } from '@/lib/admin/storage'

export const runtime = 'nodejs'

export async function GET(_request: Request, { params }: { params: Promise<{ filename: string }> }) {
  const { filename } = await params
  if (!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\.webp$/.test(filename)) return new Response(null, { status: 404 })
  try {
    const image = await readMedia(filename)
    if (!image) return new Response(null, { status: 404 })
    return new Response(image, { headers: {
      'Content-Type': 'image/webp', 'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'public, max-age=31536000, immutable',
    } })
  } catch {
    return new Response(null, { status: 503 })
  }
}
