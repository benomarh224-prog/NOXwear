import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import vm from 'node:vm'
import ts from 'typescript'

if (!process.env.NOX_DATABASE_URL && !process.env.NOX_DATABASE_URL_POOLED) process.loadEnvFile('.codex/free-storage-production.env')
const require = createRequire(import.meta.url)
async function load(path, dependencies = {}) {
  const code = ts.transpileModule(await readFile(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText
  const exports = {}
  vm.runInNewContext(code, { exports, require: (name) => name === 'server-only' ? {} : dependencies[name] || require(name), Buffer, URL, process, console, ReadableStream, Uint8Array, TextDecoder, Response })
  return exports
}
const db = await load('src/lib/admin/postgres-storage.ts')
const storage = await load('src/lib/admin/storage.ts', { './postgres-storage': db })
const rules = await load('src/lib/product-video.ts')
const videos = await load('src/lib/admin/postgres-video-upload.ts', { './postgres-storage': db, '@/lib/product-video': rules })
const videoStore = await load('src/lib/admin/product-video-store.ts', { './postgres-storage': db, './storage': storage, '@/lib/product-video': rules })
assert.ok(db.postgresStorageEnabled(), 'Use the dedicated free storage database')
const paths = [], uploads = []
const id = randomUUID(), path = 'verification/' + id + '.json'
paths.push(path)
try {
  assert.equal(await storage.readJson(path), null)
  const revision = await storage.writeJson(path, { count: 1 }, null)
  assert.equal((await storage.readJson(path)).value.count, 1)
  await assert.rejects(storage.writeJson(path, { count: 2 }, null), storage.StorageConflictError)
  const race = await Promise.allSettled([storage.writeJson(path, { count: 2 }, revision), storage.writeJson(path, { count: 3 }, revision)])
  assert.equal(race.filter((result) => result.status === 'fulfilled').length, 1, 'Exactly one concurrent update may win')
  assert.equal(race.filter((result) => result.status === 'rejected').length, 1)
  await assert.rejects(storage.readJson('../secret'), /Invalid storage path/)
  const image = Buffer.from([82, 73, 70, 70, 1, 2, 3])
  const imageId = randomUUID()
  paths.push('catalog/media/' + imageId + '.webp')
  await storage.saveMedia(imageId, image)
  assert.deepEqual(Buffer.from(await storage.readMedia(imageId + '.webp')), image)
  const bytes = Buffer.alloc(videos.VIDEO_CHUNK_BYTES + 4096, 0x42)
  bytes.write('ftyp', 4); bytes.write('isom', 8)
  const filename = await videos.beginVideoUpload(bytes.length, 'video/mp4')
  uploads.push(filename); paths.push('catalog/videos/' + filename)
  await assert.rejects(videos.finishVideoUpload(filename), videos.VideoUploadError)
  await assert.rejects(videos.storeVideoChunk(filename, 0, bytes.subarray(0, 10)), videos.VideoUploadError)
  await videos.storeVideoChunk(filename, 0, bytes.subarray(0, videos.VIDEO_CHUNK_BYTES))
  await videos.storeVideoChunk(filename, 0, bytes.subarray(0, videos.VIDEO_CHUNK_BYTES))
  const different = Buffer.from(bytes.subarray(0, videos.VIDEO_CHUNK_BYTES)); different[50] = 0
  await assert.rejects(videos.storeVideoChunk(filename, 0, different), videos.VideoUploadError)
  await videos.storeVideoChunk(filename, 1, bytes.subarray(videos.VIDEO_CHUNK_BYTES))
  assert.equal(await videos.finishVideoUpload(filename), '/api/product-videos/' + filename)
  const metadata = await videoStore.productVideoMetadata(filename)
  assert.equal(metadata.size, bytes.length)
  const partial = await videoStore.productVideoStream(filename, { start: 3, end: 20 })
  assert.equal(partial.partial, true)
  assert.deepEqual(Buffer.from(await new Response(partial.stream).arrayBuffer()), bytes.subarray(3, 21))
  const full = await videoStore.productVideoStream(filename, null)
  assert.deepEqual(Buffer.from(await new Response(full.stream).arrayBuffer()), bytes)
  const cancel = await videos.beginVideoUpload(100, 'video/mp4'); uploads.push(cancel)
  await videos.cancelVideoUpload(cancel)
  await assert.rejects(videos.finishVideoUpload(cancel), videos.VideoUploadError)
  console.log('PASS: real free database, JSON persistence, concurrent writes, private media, chunk validation, retry safety, video assembly, seeking and cancellation')
} finally {
  await db.storageDatabase().query('DELETE FROM nox_objects WHERE path = ANY($1::text[])', [paths])
  await db.storageDatabase().query('DELETE FROM nox_video_uploads WHERE filename = ANY($1::text[])', [uploads])
  await db.storageDatabase().end()
}
