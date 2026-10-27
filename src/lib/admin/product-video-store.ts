import 'server-only'
import { createReadStream } from 'node:fs'
import { mkdir, stat, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { BlobNotFoundError, get, head } from '@vercel/blob'
import { cloudStorageEnabled } from './storage'
import { PRODUCT_VIDEO_FILENAME } from '@/lib/product-video'

function videoPath(filename: string) {
  if (!PRODUCT_VIDEO_FILENAME.test(filename)) throw new Error('Invalid video filename')
  return `catalog/videos/${filename}`
}
function localVideoPath(filename: string) {
  if (process.env.VERCEL) throw new Error('Video storage is not configured')
  return join(process.cwd(), '.codex', 'store', videoPath(filename))
}

export async function saveLocalProductVideo(filename: string, bytes: Uint8Array) {
  if (cloudStorageEnabled()) throw new Error('Use direct video uploads')
  const target = localVideoPath(filename)
  await mkdir(dirname(target), { recursive: true })
  await writeFile(target, bytes, { flag: 'wx' })
}

export async function productVideoMetadata(filename: string) {
  const path = videoPath(filename)
  try {
    if (cloudStorageEnabled()) {
      const info = await head(path)
      return { size: info.size, etag: info.etag }
    }
    const info = await stat(localVideoPath(filename))
    return { size: info.size, etag: `"${info.size}-${info.mtimeMs}"` }
  } catch (error) {
    if (error instanceof BlobNotFoundError || (error as NodeJS.ErrnoException).code === 'ENOENT') return null
    throw error
  }
}

export async function productVideoStream(filename: string, range: { start: number; end: number } | null) {
  const path = videoPath(filename)
  if (cloudStorageEnabled()) {
    const result = await get(path, { access: 'private', headers: { 'Accept-Encoding': 'identity', ...(range ? { Range: `bytes=${range.start}-${range.end}` } : {}) } })
    if (!result || result.statusCode !== 200) return null
    // The SDK normalizes statusCode to 200; Content-Range identifies a partial response.
    const partial = Boolean(range && result.headers.get('content-range'))
    return { stream: result.stream, partial }
  }
  const source = createReadStream(localVideoPath(filename), range || {})
  const iterator = source[Symbol.asyncIterator]()
  let ended = false
  const stream = new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        const chunk = await iterator.next()
        if (ended) return
        if (chunk.done) { ended = true; controller.close() }
        else controller.enqueue(chunk.value)
      } catch (error) {
        if (!ended) { ended = true; controller.error(error) }
      }
    },
    async cancel() {
      ended = true
      source.destroy()
      await iterator.return?.().catch(() => undefined)
    },
  })
  return { stream, partial: Boolean(range) }
}
