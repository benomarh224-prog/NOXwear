import assert from 'node:assert/strict'
import { readFile, writeFile, unlink } from 'node:fs/promises'
import { join } from 'node:path'
import { createRequire } from 'node:module'
import vm from 'node:vm'
import ts from 'typescript'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import * as blobClient from '@vercel/blob/client'

const base = process.env.BASE_URL || 'http://localhost:3100'
assert.ok(['localhost', '127.0.0.1'].includes(new URL(base).hostname), 'Video mutation tests are local only')
const require = createRequire(import.meta.url)
function loadTypeScript(source, dependencies = {}) {
  const exports = {}
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText
  vm.runInNewContext(code, { exports, require: (name) => dependencies[name] || require(name), Response, Request, Headers, File, Uint8Array, TextDecoder, Date, process, console })
  return exports
}
const videoRules = loadTypeScript(await readFile('src/lib/product-video.ts', 'utf8'))
const imageComponent = loadTypeScript(await readFile('src/components/store/optimized-image.tsx', 'utf8'))
const galleryComponent = loadTypeScript(await readFile('src/components/store/product-gallery.tsx', 'utf8'), { './optimized-image': imageComponent })
const markup = renderToStaticMarkup(React.createElement(galleryComponent.ProductGallery, { images: ['/products/front.jpg', '/products/back.jpg'], video: '/api/product-videos/00000000-0000-4000-8000-000000000001.mp4', name: 'اختبار الفيديو' }))
assert.match(markup, /aria-label="عرض فيديو المنتج"/)
assert.match(markup, /الصورة 1 من 3/)
assert.match(markup, /<video[^>]*preload="none"/)
assert.ok(!/<video[^>]*autoplay/i.test(markup), 'Product video must not autoplay')

let authorized = true
const tokenRoute = loadTypeScript(await readFile('src/app/api/admin/video-upload/route.ts', 'utf8'), {
  '@vercel/blob/client': { handleUpload: (options) => blobClient.handleUpload({ ...options, token: 'vercel_blob_rw_teststore_not-a-real-secret' }) },
  '@/lib/admin/auth': { isAdmin: async () => authorized, sameOrigin: (r) => r.headers.get('origin') === new URL(r.url).origin },
  '@/lib/admin/storage': { cloudStorageEnabled: () => true },
  '@/lib/admin/product-video-store': { saveLocalProductVideo: () => { throw new Error('Cloud uploads must not buffer video through server') } },
  '@/lib/product-video': videoRules,
})
const pathname = 'catalog/videos/00000000-0000-4000-8000-000000000001.mp4'
const tokenRequest = (path = pathname, origin = base) => new Request(base + '/api/admin/video-upload', { method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'blob.generate-client-token', payload: { pathname: path, multipart: true, clientPayload: null } }) })
const tokenResponse = await tokenRoute.POST(tokenRequest())
assert.equal(tokenResponse.status, 200)
const claims = blobClient.getPayloadFromClientToken((await tokenResponse.json()).clientToken)
assert.equal(claims.pathname, pathname)
assert.equal(claims.maximumSizeInBytes, 50 * 1024 * 1024)
assert.deepEqual(claims.allowedContentTypes, ['video/mp4'])
assert.equal(claims.allowOverwrite, false)
assert.equal(claims.addRandomSuffix, false)
assert.ok(claims.validUntil > Date.now() && claims.validUntil <= Date.now() + 16 * 60 * 1000)
assert.equal((await tokenRoute.POST(tokenRequest('catalog/products-v1.json'))).status, 400)
assert.equal((await tokenRoute.POST(tokenRequest(pathname, 'https://untrusted.example'))).status, 403)
authorized = false
assert.equal((await tokenRoute.POST(tokenRequest())).status, 401)

const cookies = new Map()
async function request(path, options = {}, authenticated = true) {
  const headers = new Headers(options.headers)
  if (authenticated) headers.set('cookie', [...cookies].map(([key, value]) => `${key}=${value}`).join('; '))
  const response = await fetch(new URL(path, base), { ...options, headers, redirect: 'manual' })
  if (authenticated) for (const header of response.headers.getSetCookie()) {
    const part = header.split(';')[0], separator = part.indexOf('=')
    cookies.set(part.slice(0, separator), part.slice(separator + 1))
  }
  return response
}
const catalogFile = join(process.cwd(), '.codex/store/catalog/products-v1.json')
const original = await readFile(catalogFile).catch((error) => { if (error.code === 'ENOENT') return null; throw error })
let uploadedUrl = ''
try {
  assert.equal((await request('/api/admin/video-upload', {}, false)).status, 401)
  assert.equal((await request('/api/admin/video-upload', { method: 'POST' }, false)).status, 401)
  const { password } = JSON.parse(await readFile('.codex/admin-access.json', 'utf8'))
  const csrf = await (await request('/api/auth/csrf')).json()
  const login = await (await request('/api/auth/callback/credentials', { method: 'POST', headers: { Origin: base, 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ csrfToken: csrf.csrfToken, password, json: 'true', callbackUrl: base + '/admin' }) })).json()
  assert.ok(!login.url.includes('error='), 'Owner login failed')
  assert.equal((await (await request('/api/admin/video-upload')).json()).direct, false, 'Run server with NOX_ADMIN_LOCAL_STORAGE=1')
  const upload = (bytes, origin = base) => {
    const form = new FormData(); form.append('file', new Blob([bytes], { type: 'video/mp4' }), 'test.mp4')
    return request('/api/admin/video-upload', { method: 'POST', headers: { Origin: origin }, body: form })
  }
  assert.equal((await upload(new Uint8Array([1, 2, 3]))).status, 400)
  assert.equal((await upload(new Uint8Array([1, 2, 3]), 'https://untrusted.example')).status, 403)
  const fixture = await readFile('.codex/product-video-fixture.mp4').catch(async () => {
    const response = await fetch('https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4')
    assert.ok(response.ok, 'Could not download CC0 video fixture')
    return Buffer.from(await response.arrayBuffer())
  })
  const response = await upload(fixture)
  assert.equal(response.status, 201)
  uploadedUrl = (await response.json()).url
  assert.match(uploadedUrl, videoRules.PRODUCT_VIDEO_PATH)
  const full = await request(uploadedUrl, {}, false)
  assert.equal(full.status, 200)
  assert.equal(full.headers.get('content-type'), 'video/mp4')
  assert.equal(full.headers.get('accept-ranges'), 'bytes')
  assert.deepEqual(Buffer.from(await full.arrayBuffer()), fixture)
  const info = await request(uploadedUrl, { method: 'HEAD' }, false)
  assert.equal(info.status, 200)
  assert.equal(Number(info.headers.get('content-length')), fixture.length)
  assert.equal((await info.arrayBuffer()).byteLength, 0)
  for (const [range, start, end] of [['bytes=0-15', 0, 15], ['bytes=-8', fixture.length - 8, fixture.length - 1], [`bytes=${fixture.length - 8}-`, fixture.length - 8, fixture.length - 1]]) {
    const part = await request(uploadedUrl, { headers: { Range: range } }, false)
    assert.equal(part.status, 206)
    assert.equal(part.headers.get('content-range'), `bytes ${start}-${end}/${fixture.length}`)
    assert.deepEqual(Buffer.from(await part.arrayBuffer()), fixture.subarray(start, end + 1))
  }
  for (const range of ['bytes=999999999-', 'bytes=0-1,3-4', 'bytes=-0']) assert.equal((await request(uploadedUrl, { headers: { Range: range } }, false)).status, 416)
  const ifRange = await request(uploadedUrl, { headers: { Range: 'bytes=0-15', 'If-Range': 'wrong-etag' } }, false)
  assert.equal(ifRange.status, 200); await ifRange.body.cancel()
  assert.equal((await request('/api/product-videos/not-a-video.mp4', {}, false)).status, 404)
  let snapshot = await (await request('/api/admin/products')).json()
  assert.ok(snapshot.products.every((product) => typeof product.video === 'string'), 'Legacy catalogue must get empty video defaults')
  const product = { name: 'اختبار فيديو المنتج', description: '', price: 250, productType: 'hoodie', categorySlug: 'anime', images: [snapshot.products[0].images[0]], video: uploadedUrl, sizes: ['M'], colors: ['أسود'], stock: 5, featured: false, active: true, badge: '' }
  const save = (slug, item, revision) => request('/api/admin/products' + (slug ? '/' + slug : ''), { method: slug ? 'PUT' : 'POST', headers: { Origin: base, 'Content-Type': 'application/json' }, body: JSON.stringify({ product: item, revision }) })
  assert.equal((await save('', { ...product, video: 'https://untrusted.example/video.mp4' }, snapshot.revision)).status, 400)
  const created = await save('', product, snapshot.revision)
  assert.equal(created.status, 201); snapshot = await created.json()
  const slug = snapshot.product.slug
  const publicProduct = await (await request('/api/products/' + slug, {}, false)).json()
  assert.equal(publicProduct.product.video, uploadedUrl)
  assert.equal(publicProduct.product.image, product.images[0])
  const removed = await save(slug, { ...product, video: '' }, snapshot.revision)
  assert.equal(removed.status, 200)
  assert.equal((await removed.json()).product.video, '')
  const logoutCsrf = await (await request('/api/auth/csrf')).json()
  await request('/api/auth/signout', { method: 'POST', headers: { Origin: base, 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ csrfToken: logoutCsrf.csrfToken, json: 'true' }) })
  console.log('PASS: signed cloud upload permissions/path/type/size/expiry, owner authentication, origin protection, real MP4 upload, full streaming, HEAD, byte ranges/seeking, catalogue compatibility, product video persistence/removal')
} finally {
  if (original) await writeFile(catalogFile, original)
  else await unlink(catalogFile).catch((error) => { if (error.code !== 'ENOENT') throw error })
  if (uploadedUrl) await unlink(join(process.cwd(), '.codex/store/catalog/videos', uploadedUrl.split('/').pop()))
}
