import assert from 'node:assert/strict'
import { readFile, writeFile, unlink } from 'node:fs/promises'
import { join } from 'node:path'

const base = process.env.BASE_URL || 'http://localhost:3100'
assert.ok(['localhost', '127.0.0.1'].includes(new URL(base).hostname), 'Mutation tests run against local storage only')
const catalogFile = join(process.cwd(), '.codex/store/catalog/products-v1.json')
const original = await readFile(catalogFile).catch((error) => { if (error.code === 'ENOENT') return null; throw error })
const { password } = JSON.parse(await readFile('.codex/admin-access.json', 'utf8'))
const cookies = new Map()
const createdOrders = []
function remember(response) {
  for (const header of response.headers.getSetCookie()) {
    const [part] = header.split(';'); const equals = part.indexOf('=')
    cookies.set(part.slice(0, equals), part.slice(equals + 1))
  }
}
async function request(path, options = {}, authenticated = true) {
  const headers = new Headers(options.headers)
  if (authenticated) headers.set('cookie', [...cookies].map(([key, value]) => `${key}=${value}`).join('; '))
  const response = await fetch(new URL(path, base), { ...options, headers, redirect: 'manual' })
  if (authenticated) remember(response)
  return response
}
async function login(value) {
  const csrf = await (await request('/api/auth/csrf')).json()
  return request('/api/auth/callback/credentials', {
    method: 'POST', headers: { Origin: base, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ csrfToken: csrf.csrfToken, password: value, json: 'true', callbackUrl: `${base}/admin` }),
  })
}
async function save(slug, product, revision, origin = base) {
  return request(`/api/admin/products${slug ? '/' + slug : ''}`, {
    method: slug ? 'PUT' : 'POST', headers: { Origin: origin, 'Content-Type': 'application/json' }, body: JSON.stringify({ product, revision }),
  })
}
try {
  const unauthenticated = await request('/api/admin/products', {}, false)
  assert.equal(unauthenticated.status, 401)
  assert.equal((await request('/admin', {}, false)).status, 307)
  assert.equal((await request('/api/admin/upload', { method: 'POST' }, false)).status, 401)
  assert.equal((await request('/api/admin/products/reorder', { method: 'POST' }, false)).status, 401)
  assert.equal((await request('/api/admin/products/unknown', { method: 'DELETE' }, false)).status, 401)
  assert.equal((await request('/api/admin/products/unknown', { method: 'PATCH' }, false)).status, 401)
  const wrong = await (await login('incorrect-password')).json()
  assert.match(wrong.url, /error=/)
  const signedIn = await (await login(password)).json()
  assert.ok(!signedIn.url.includes('error='), 'Owner login failed')
  assert.equal((await request('/admin')).status, 200)
  const snapshot = await (await request('/api/admin/products')).json()
  assert.equal(snapshot.products.length, 7)
  const members = snapshot.products.filter((product) => product.categorySlug === 'anime' && !product.deletedAt)
  const orderedSlugs = members.map((product) => product.slug).reverse()
  const reorder = (slugs, revision = snapshot.revision, origin = base) => request('/api/admin/products/reorder', { method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json' }, body: JSON.stringify({ categorySlug: 'anime', slugs, revision }) })
  assert.equal((await reorder(orderedSlugs, snapshot.revision, 'https://untrusted.example')).status, 403)
  assert.equal((await reorder([orderedSlugs[0], orderedSlugs[0]])).status, 400)
  assert.equal((await reorder(orderedSlugs.slice(1))).status, 400)
  assert.equal((await reorder(orderedSlugs.map((slug, index) => index ? slug : snapshot.products.find((product) => product.categorySlug !== 'anime').slug))).status, 400)
  const reordered = await reorder(orderedSlugs)
  assert.equal(reordered.status, 200)
  let ranked = await reordered.json()
  assert.equal((await reorder(orderedSlugs)).status, 409, 'Stale reorder must not overwrite newer data')
  const storefrontOrder = (await (await request('/api/products?category=anime', {}, false)).json()).products
  assert.deepEqual(storefrontOrder.map((product) => product.slug), orderedSlugs)
  assert.deepEqual(ranked.products.filter((product) => product.categorySlug !== 'anime'), snapshot.products.filter((product) => product.categorySlug !== 'anime'), 'Reordering must leave other collections untouched')
  for (const product of members) {
    const after = ranked.products.find((item) => item.slug === product.slug)
    assert.deepEqual({ ...after, sortOrder: product.sortOrder }, product, 'Ordering must not rewrite product information or timestamps')
  }
  const existing = members[0]
  const editAfterRank = await save(existing.slug, { ...existing, price: existing.price + 1 }, ranked.revision)
  assert.equal(editAfterRank.status, 200)
  ranked = await editAfterRank.json()
  assert.equal(ranked.product.sortOrder, orderedSlugs.indexOf(existing.slug), 'Editing a product must preserve its manual rank')
  const newProduct = {
    name: 'منتج تجربة الإدارة', description: 'اختبار حفظ منتج وصور وأثمنة', price: 250, categorySlug: 'anime',
    images: [snapshot.products[0].images[0]], sizes: ['L'], colors: ['أسود', 'أبيض'], stock: 8,
    featured: true, active: false, badge: '',
  }
  assert.equal((await save(null, newProduct, snapshot.revision, 'https://untrusted.example')).status, 403)
  assert.equal((await save(null, { ...newProduct, price: -1 }, snapshot.revision)).status, 400)
  assert.equal((await save(null, { ...newProduct, images: [] }, snapshot.revision)).status, 400)
  const invalidImage = new FormData(); invalidImage.append('file', new Blob(['<svg/>'], { type: 'image/png' }), 'fake.png')
  assert.equal((await request('/api/admin/upload', { method: 'POST', headers: { Origin: base }, body: invalidImage })).status, 400)
  const imageBytes = await readFile(join(process.cwd(), 'public', snapshot.products[0].images[0]))
  const form = new FormData(); form.append('file', new Blob([imageBytes], { type: 'image/jpeg' }), 'hoodie.jpg')
  const upload = await request('/api/admin/upload', { method: 'POST', headers: { Origin: base }, body: form })
  assert.equal(upload.status, 201)
  const { url } = await upload.json()
  const media = await request(url, {}, false)
  assert.equal(media.status, 200); assert.equal(media.headers.get('content-type'), 'image/webp')
  newProduct.images = [url, newProduct.images[0]]
  const created = await save(null, newProduct, snapshot.revision)
  assert.equal(created.status, 201)
  let latest = await created.json()
  const slug = latest.product.slug
  assert.equal((await request('/api/products/' + slug, {}, false)).status, 404, 'Hidden product leaked')
  assert.equal((await save(slug, newProduct, snapshot.revision)).status, 409, 'Stale edit accepted')
  const staleCreate = await save(null, { ...newProduct, name: 'تجربة إضافة من لائحة قديمة' }, snapshot.revision)
  assert.equal(staleCreate.status, 201, 'New products should merge with the latest catalog')
  latest = await staleCreate.json()
  assert.ok(latest.products.some((item) => item.slug === slug), 'Appending lost a prior product')
  const changed = { ...newProduct, active: true, price: 275.5 }
  const updated = await save(slug, changed, latest.revision)
  assert.equal(updated.status, 200); latest = await updated.json()
  const publicProduct = (await (await request('/api/products/' + slug, {}, false)).json()).product
  assert.equal(publicProduct.price, 275.5); assert.equal(publicProduct.gallery.split(',').length, 2)
  assert.match(await (await request('/', {}, false)).text(), /منتج تجربة الإدارة/)
  const orderPayload = { customerName: 'Pricing integration test', email: 'test@example.invalid', phone: '0000000000', address: 'Test', city: 'Test', country: 'المغرب', total: 501,
    items: [{ productId: slug, name: changed.name, price: 275.5, quantity: 2, size: 'L', color: 'أسود' }] }
  const orderResponse = await request('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(orderPayload) }, false)
  assert.equal(orderResponse.status, 201)
  const savedOrder = await orderResponse.json(); createdOrders.push(savedOrder.order.id)
  assert.equal(savedOrder.pricing.subtotal, 551); assert.equal(savedOrder.pricing.discount, 50); assert.equal(savedOrder.pricing.grandTotal, 501)
  assert.equal(savedOrder.pricing.advance, 0); assert.equal(savedOrder.pricing.remainingToPay, 501)
  const storedOrder = JSON.parse(await readFile(join(process.cwd(), '.codex/store/orders', savedOrder.order.id + '.json'), 'utf8'))
  assert.equal(storedOrder.total, 501); assert.deepEqual(storedOrder.pricing, savedOrder.pricing)
  const undiscounted = await request('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...orderPayload, total: 551 }) }, false)
  assert.equal(undiscounted.status, 409, 'The server must enforce the automatic promotion')

  const stalePriceOrder = await request('/api/orders', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
      customerName: 'Integration test', email: 'test@example.invalid', phone: '0000000000', address: 'Test', city: 'Test', country: 'المغرب', total: 1,
      items: [{ productId: slug, name: changed.name, price: 1, quantity: 1, size: 'L', color: 'أسود' }],
    }),
  }, false)
  assert.equal(stalePriceOrder.status, 409, 'An outdated price was accepted at checkout')
  const concurrent = await Promise.all([save(slug, { ...changed, price: 280 }, latest.revision), save(slug, { ...changed, price: 290 }, latest.revision)])
  assert.deepEqual(concurrent.map((response) => response.status).sort(), [200, 409], 'Concurrent update lost data')
  latest = await (await request('/api/admin/products')).json()
  const trashRequest = (method, revision, origin = base) => request('/api/admin/products/' + slug, {
    method, headers: { Origin: origin, 'Content-Type': 'application/json' }, body: JSON.stringify({ revision }),
  })
  assert.equal((await trashRequest('DELETE', latest.revision, 'https://untrusted.example')).status, 403)
  assert.equal((await trashRequest('DELETE', snapshot.revision)).status, 409, 'A stale delete should not remove an edited product')
  const removed = await trashRequest('DELETE', latest.revision)
  assert.equal(removed.status, 200); latest = await removed.json()
  assert.ok(latest.product.deletedAt, 'Deletion was not persisted')
  assert.equal(latest.product.active, false)
  assert.equal((await request('/api/products/' + slug, {}, false)).status, 404)
  const listing = await (await request('/api/products', {}, false)).json()
  assert.ok(!listing.products.some((product) => product.slug === slug), 'Deleted product leaked into storefront')
  assert.equal((await save(slug, changed, latest.revision)).status, 404, 'Editing should not resurrect a deleted product')
  const restored = await trashRequest('PATCH', latest.revision)
  assert.equal(restored.status, 200); latest = await restored.json()
  assert.equal(latest.product.deletedAt, null)
  assert.equal(latest.product.active, false, 'Restoring should require publishing explicitly')
  assert.deepEqual(latest.product.images, newProduct.images)
  assert.equal((await request('/api/products/' + slug, {}, false)).status, 404)
  const republished = await save(slug, changed, latest.revision)
  assert.equal(republished.status, 200)
  assert.equal((await request('/api/products/' + slug, {}, false)).status, 200)
  const csrf = await (await request('/api/auth/csrf')).json()
  await request('/api/auth/signout', { method: 'POST', headers: { Origin: base, 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ csrfToken: csrf.csrfToken, json: 'true' }) })
  assert.equal((await request('/api/admin/products')).status, 401, 'Logout did not revoke browser session')
  console.log('PASS: authentication, logout, origin protection, validation, image upload, create/edit, gallery, storefront publication, hide, delete/restore/republish, discounted order persistence, concurrent saves')
} finally {
  for (const id of createdOrders) await unlink(join(process.cwd(), '.codex/store/orders', id + '.json'))
  if (original) await writeFile(catalogFile, original)
  else await unlink(catalogFile).catch((error) => { if (error.code !== 'ENOENT') throw error })
}
