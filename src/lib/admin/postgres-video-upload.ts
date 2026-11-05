import 'server-only'
import { randomUUID } from 'node:crypto'
import { storageDatabase } from './postgres-storage'
import { MAX_PRODUCT_VIDEO_BYTES, PRODUCT_VIDEO_FILENAME, validVideoHeader, videoExtension } from '@/lib/product-video'

export const VIDEO_CHUNK_BYTES = 2 * 1024 * 1024
export class VideoUploadError extends Error {}
export async function beginVideoUpload(size: number, contentType: string) {
  const extension = videoExtension(contentType)
  if (!extension || !Number.isSafeInteger(size) || size < 16 || size > MAX_PRODUCT_VIDEO_BYTES) throw new VideoUploadError('Invalid video')
  const db = storageDatabase()
  await db.query('DELETE FROM nox_video_uploads WHERE expires_at < now()')
  const filename = randomUUID() + '.' + extension
  await db.query('INSERT INTO nox_video_uploads (filename, size, content_type) VALUES ($1, $2, $3)', [filename, size, contentType])
  return filename
}
export async function storeVideoChunk(filename: string, part: number, bytes: Buffer) {
  if (!PRODUCT_VIDEO_FILENAME.test(filename) || !Number.isSafeInteger(part) || part < 0 || part > 24) throw new VideoUploadError('Invalid upload')
  const db = storageDatabase()
  const { rows } = await db.query<{ size: number }>('SELECT size FROM nox_video_uploads WHERE filename = $1 AND expires_at > now()', [filename])
  const size = rows[0]?.size
  if (!size || part >= Math.ceil(size / VIDEO_CHUNK_BYTES) || bytes.length !== Math.min(VIDEO_CHUNK_BYTES, size - part * VIDEO_CHUNK_BYTES)) throw new VideoUploadError('Invalid chunk size')
  if (part === 0 && !validVideoHeader(bytes, filename.split('.').pop()!)) throw new VideoUploadError('Invalid video header')
  const result = await db.query('INSERT INTO nox_video_chunks (filename, part, body) VALUES ($1, $2, $3) ON CONFLICT (filename, part) DO UPDATE SET body = EXCLUDED.body WHERE nox_video_chunks.body = EXCLUDED.body RETURNING filename', [filename, part, bytes])
  if (!result.rowCount) throw new VideoUploadError('Conflicting chunk')
}
export async function finishVideoUpload(filename: string) {
  if (!PRODUCT_VIDEO_FILENAME.test(filename)) throw new VideoUploadError('Invalid upload')
  const client = await storageDatabase().connect()
  try {
    await client.query('BEGIN')
    const { rows } = await client.query<{ size: number; content_type: string }>('SELECT size, content_type FROM nox_video_uploads WHERE filename = $1 AND expires_at > now() FOR UPDATE', [filename])
    const upload = rows[0]
    if (!upload) throw new VideoUploadError('Upload expired')
    const parts = await client.query<{ count: number; size: number }>('SELECT count(*)::integer AS count, coalesce(sum(octet_length(body)), 0)::integer AS size FROM nox_video_chunks WHERE filename = $1', [filename])
    if (parts.rows[0].count !== Math.ceil(upload.size / VIDEO_CHUNK_BYTES) || parts.rows[0].size !== upload.size) throw new VideoUploadError('Upload incomplete')
    await client.query("INSERT INTO nox_objects (path, body, content_type, revision) SELECT $2, string_agg(body, ''::bytea ORDER BY part), $3, $4 FROM nox_video_chunks WHERE filename = $1", [filename, 'catalog/videos/' + filename, upload.content_type, randomUUID()])
    await client.query('DELETE FROM nox_video_uploads WHERE filename = $1', [filename])
    await client.query('COMMIT')
    return '/api/product-videos/' + filename
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally { client.release() }
}
export async function cancelVideoUpload(filename: string) {
  if (!PRODUCT_VIDEO_FILENAME.test(filename)) throw new VideoUploadError('Invalid upload')
  await storageDatabase().query('DELETE FROM nox_video_uploads WHERE filename = $1', [filename])
}
