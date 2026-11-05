import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import vm from 'node:vm'
import ts from 'typescript'
import sharp from 'sharp'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

const require = createRequire(import.meta.url)
async function load(path, dependencies = {}) {
  const source = await readFile(path, 'utf8')
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText
  const exports = {}
  vm.runInNewContext(code, { exports, Buffer, URL, Response, require: (name) => dependencies[name] || require(name) })
  return exports
}
const mediaImages = await load('src/lib/media-image.ts')
const sourcePath = '/api/media/00000000-0000-4000-8000-000000000001.webp'
assert.equal(mediaImages.mediaImageLoader({ src: sourcePath, width: 400 }), sourcePath + '?w=640')
assert.equal(mediaImages.mediaImageLoader({ src: sourcePath, width: 3840 }), sourcePath + '?w=1800')
const image = await load('src/components/store/optimized-image.tsx', { '@/lib/media-image': mediaImages })
for (const src of [sourcePath, '/products/noxwear-horse-hoodie.jpeg', ...Object.keys(mediaImages.STATIC_IMAGE_COPIES)]) {
  const html = renderToStaticMarkup(React.createElement(image.OptimizedImage, { src, alt: 'هودي', sizes: '50vw' }))
  assert.ok(!html.includes('/_next/image'), 'Images must load when the platform optimizer returns 402')
  if (src === sourcePath) {
    assert.match(html, /srcSet=/)
    assert.match(html, /\?w=640/)
  }
  if (mediaImages.STATIC_IMAGE_COPIES[src]) {
    assert.ok(html.includes(mediaImages.STATIC_IMAGE_COPIES[src]))
    const bytes = await readFile('public' + mediaImages.STATIC_IMAGE_COPIES[src])
    assert.equal((await sharp(bytes).metadata()).format, 'webp')
    assert.ok(bytes.length < 250_000, 'Large artwork needs a compressed copy')
  }
}
const original = await sharp({ create: { width: 1200, height: 800, channels: 3, background: '#e59c28' } }).webp().toBuffer()
let stored = original
let unavailable = false
let reads = 0
const route = await load('src/app/api/media/[filename]/route.ts', {
  '@/lib/media-image': mediaImages,
  '@/lib/admin/storage': { readMedia: async () => { reads++; if (unavailable) throw new Error('Unavailable'); return stored && new Uint8Array(stored) } },
})
const call = (query = '', filename = sourcePath.split('/').pop()) => route.GET(new Request('https://www.noxwear.site' + sourcePath + query), { params: Promise.resolve({ filename }) })
const raw = await call()
assert.equal(raw.status, 200)
assert.deepEqual(Buffer.from(await raw.arrayBuffer()), original, 'Image links shared in WhatsApp keep the original file')
for (const width of mediaImages.MEDIA_IMAGE_WIDTHS) {
  const resized = await call('?w=' + width)
  assert.equal(resized.status, 200)
  assert.equal(resized.headers.get('content-type'), 'image/webp')
  assert.match(resized.headers.get('cache-control'), /immutable/)
  assert.match(resized.headers.get('vercel-cdn-cache-control'), /max-age=31536000/)
  const bytes = Buffer.from(await resized.arrayBuffer())
  const meta = await sharp(bytes).metadata()
  assert.equal(meta.width, Math.min(width, 1200), 'Do not upscale small originals')
  assert.ok(Math.abs(meta.height / meta.width - 2 / 3) < 0.02, 'Preserve aspect ratio')
  assert.equal(Number(resized.headers.get('content-length')), bytes.length)
}
const beforeInvalid = reads
for (const query of ['?w=99999', '?w=0', '?w=-1', '?w=abc', '?w=640&w=320', '?w=0640', '?w=']) {
  const response = await call(query)
  assert.equal(response.status, 400)
  assert.equal(response.headers.get('cache-control'), 'no-store')
}
assert.equal((await call('?w=640', '../secret.webp')).status, 404)
assert.equal(reads, beforeInvalid, 'Reject bad requests before accessing storage')
stored = null
assert.equal((await call('?w=640')).status, 404)
unavailable = true
const outage = await call('?w=640')
assert.equal(outage.status, 503)
assert.equal(outage.headers.get('cache-control'), 'no-store', 'Storage failures must not poison the image cache')
console.log('PASS: optimizer-independent rendering, responsive WebP images, original links, bounded sizes, aspect ratio, CDN caching and uncached errors')
