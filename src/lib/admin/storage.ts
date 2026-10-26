import 'server-only'
import { createHash, randomUUID } from 'node:crypto'
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { BlobPreconditionFailedError, get, head, put } from '@vercel/blob'

export class StorageConflictError extends Error {}

// HTTP compression can weaken a delivery ETag; writes require the original strong tag.
export function normalizeRevision(revision: string) {
  return revision.replace(/^W\//i, '')
}
const localRoot = join(process.cwd(), '.codex', 'store')
const localLocks = new Map<string, Promise<void>>()

export function cloudStorageEnabled() {
  if (!process.env.VERCEL && process.env.NOX_ADMIN_LOCAL_STORAGE === '1') return false
  return Boolean(process.env.BLOB_STORE_ID || process.env.BLOB_READ_WRITE_TOKEN)
}

function localPath(path: string) {
  if (process.env.VERCEL) throw new Error('Cloud storage is not configured')
  if (!/^[a-zA-Z0-9_./-]+$/.test(path) || path.includes('..') || path.startsWith('/')) {
    throw new Error('Invalid storage path')
  }
  return join(localRoot, path)
}

function fileRevision(contents: string) {
  return createHash('sha256').update(contents).digest('hex')
}

export async function readJson<T>(path: string): Promise<{ value: T; revision: string } | null> {
  if (cloudStorageEnabled()) {
    for (let attempt = 0; attempt < 3; attempt++) {
      const result = await get(path, { access: 'private', useCache: false, headers: { 'Accept-Encoding': 'identity' } })
      if (!result || result.statusCode !== 200) return null
      let revision = result.blob.etag
      if (/^W\//i.test(revision)) {
        const metadata = await head(path)
        if (normalizeRevision(metadata.etag) !== normalizeRevision(revision)) {
          await result.stream.cancel()
          continue
        }
        revision = metadata.etag
      }
      if (!revision) throw new Error('Storage did not return a revision')
      return { value: await new Response(result.stream).json() as T, revision: normalizeRevision(revision) }
    }
    throw new StorageConflictError('The file changed while reading')
  }
  try {
    const contents = await readFile(localPath(path), 'utf8')
    return { value: JSON.parse(contents) as T, revision: fileRevision(contents) }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null
    throw error
  }
}

export async function writeJson(path: string, value: unknown, revision: string | null) {
  const contents = JSON.stringify(value)
  if (cloudStorageEnabled()) {
    try {
      const result = await put(path, contents, {
        access: 'private', contentType: 'application/json', addRandomSuffix: false,
        ...(revision ? { ifMatch: normalizeRevision(revision) } : { allowOverwrite: false }),
      })
      return normalizeRevision(result.etag)
    } catch (error) {
      if (error instanceof BlobPreconditionFailedError || /already exists/i.test(String(error))) {
        throw new StorageConflictError('The data has changed. Reload before saving.')
      }
      throw error
    }
  }
  const previous = localLocks.get(path) || Promise.resolve()
  let release!: () => void
  const current = new Promise<void>((resolve) => { release = resolve })
  localLocks.set(path, current)
  await previous
  try {
    const existing = await readJson(path)
    if ((existing?.revision || null) !== revision) throw new StorageConflictError('Concurrent write')
    const target = localPath(path)
    await mkdir(dirname(target), { recursive: true })
    const temporary = `${target}.${randomUUID()}.tmp`
    await writeFile(temporary, contents, { mode: 0o600 })
    await rename(temporary, target)
    return fileRevision(contents)
  } finally {
    release()
    if (localLocks.get(path) === current) localLocks.delete(path)
  }
}

export async function saveMedia(id: string, bytes: Buffer) {
  const path = `catalog/media/${id}.webp`
  if (cloudStorageEnabled()) {
    await put(path, bytes, { access: 'private', contentType: 'image/webp', addRandomSuffix: false, allowOverwrite: false })
  } else {
    const target = localPath(path)
    await mkdir(dirname(target), { recursive: true })
    await writeFile(target, bytes, { flag: 'wx' })
  }
  return `/api/media/${id}.webp`
}

export async function readMedia(filename: string) {
  const path = `catalog/media/${filename}`
  if (cloudStorageEnabled()) {
    const result = await get(path, { access: 'private' })
    return result?.statusCode === 200 ? result.stream : null
  }
  try {
    return new Uint8Array(await readFile(localPath(path)))
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null
    throw error
  }
}

// Customer designs use a separate namespace from the product catalogue.
export async function saveDesignMedia(id: string, bytes: Buffer, extension: 'png' | 'jpg' | 'webp', contentType: string) {
  const path = `custom-designs/media/${id}.${extension}`
  if (cloudStorageEnabled()) {
    await put(path, bytes, { access: 'private', contentType, addRandomSuffix: false, allowOverwrite: false })
  } else {
    const target = localPath(path)
    await mkdir(dirname(target), { recursive: true })
    await writeFile(target, bytes, { flag: 'wx' })
  }
  return `/api/custom-designs/${id}.${extension}`
}

export async function readDesignMedia(filename: string) {
  const path = `custom-designs/media/${filename}`
  if (cloudStorageEnabled()) {
    const result = await get(path, { access: 'private' })
    return result?.statusCode === 200 ? result.stream : null
  }
  try { return new Uint8Array(await readFile(localPath(path))) }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null
    throw error
  }
}
