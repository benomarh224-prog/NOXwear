import assert from 'node:assert/strict'
import { readFile, writeFile, unlink, mkdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { randomUUID } from 'node:crypto'
import vm from 'node:vm'
import ts from 'typescript'

const base = process.env.BASE_URL || 'http://localhost:3100'
assert.ok(['localhost', '127.0.0.1'].includes(new URL(base).hostname), 'Analytics mutation checks are local only')
const exports = {}
vm.runInNewContext(ts.transpileModule(await readFile('src/lib/analytics-model.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, { exports, Intl, Date })
const { analyticsDay, emptyMetrics, applyVisitorEvent, summarizeAnalytics } = exports
assert.equal(analyticsDay(new Date('2026-10-26T23:30:00Z')), '2026-10-27')
const day = analyticsDay()
const rollupFile = join(process.cwd(), '.codex/store/analytics/days', day + '.json')
const original = await readFile(rollupFile).catch(error => { if (error.code === 'ENOENT') return null; throw error })
const cookies = new Map()
let orderId
const visitorId = randomUUID()
const event = (name, page = '/', visitor = visitorId) => ({ eventId: randomUUID(), visitorId: visitor, event: name, page, device: 'mobile', source: 'instagram' })
async function request(path, options = {}, authenticated = true) {
  const headers = new Headers(options.headers)
  if (authenticated) headers.set('Cookie', [...cookies].map(([key, value]) => `${key}=${value}`).join('; '))
  const response = await fetch(new URL(path, base), { ...options, headers, redirect: 'manual' })
  if (authenticated) for (const header of response.headers.getSetCookie()) { const entry = header.split(';')[0], index = entry.indexOf('='); cookies.set(entry.slice(0, index), entry.slice(index + 1)) }
  return response
}
async function track(body, options = {}) {
  return request('/api/analytics', { method: 'POST', headers: { Origin: base, 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0', 'x-forwarded-for': 'analytics-local-test', 'x-vercel-ip-country': 'MA', ...options.headers }, body: JSON.stringify(body) }, options.authenticated || false)
}
async function stats() { return (await request('/api/admin/analytics?days=7')).json() }

try {
  await mkdir(dirname(rollupFile), { recursive: true })
  await writeFile(rollupFile, JSON.stringify(emptyMetrics(day)))
  assert.equal((await request('/api/admin/analytics', {}, false)).status, 401)
  assert.equal((await track(event('page_view'), { headers: { Origin: 'https://other.example' } })).status, 403)
  assert.equal((await track(event('order'))).status, 400)
  assert.equal((await track({ ...event('page_view'), page: '/search?phone=private' })).status, 400)
  assert.equal((await track({ ...event('page_view'), customerName: 'Not allowed' })).status, 400)
  const { password } = JSON.parse(await readFile('.codex/admin-access.json', 'utf8'))
  const providers = await (await request('/api/auth/providers')).json()
  assert.ok(providers.credentials.callbackUrl.startsWith(base), 'Local auth must stay local')
  const { csrfToken } = await (await request('/api/auth/csrf')).json()
  const login = await request('/api/auth/callback/credentials', { method: 'POST', headers: { Origin: base, 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ csrfToken, password, json: 'true', callbackUrl: base + '/admin' }) })
  assert.equal((await login.json()).url, base + '/admin')
  assert.equal((await request('/api/admin/analytics?days=2')).status, 400)

  const first = event('page_view')
  assert.equal((await track(first)).status, 204)
  assert.equal((await track(first)).status, 204)
  const concurrent = [event('page_view', '/product/analytics-fixture'), event('add_to_cart', '/product/analytics-fixture'), event('whatsapp'), event('custom_request', '/custom-print'), event('page_view', '/checkout')]
  for (const response of await Promise.all(concurrent.map(value => track(value)))) assert.equal(response.status, 204)
  assert.equal((await track({ ...event('page_view', '/', randomUUID()), source: 'google', device: 'desktop' })).status, 204)
  const beforeExcluded = await stats()
  await track(event('page_view'), { authenticated: true })
  await track(event('page_view'), { headers: { 'User-Agent': 'Googlebot' } })
  const summary = await stats()
  assert.equal(summary.views, 4)
  assert.equal(summary.todayVisitors, 2)
  assert.equal(summary.visits, 2)
  assert.equal(summary.addToCart, 1)
  assert.equal(summary.whatsapp, 1)
  assert.equal(summary.customRequests, 1)
  assert.equal(summary.checkoutStarts, 1)
  assert.equal(summary.views, beforeExcluded.views)
  assert.equal(summary.products[0].slug, 'analytics-fixture')
  assert.equal(summary.countries.MA, 2)
  assert.equal(summary.sources.instagram, 1)
  assert.equal(summary.sources.google, 1)
  const exposed = JSON.stringify(summary)
  assert.ok(!exposed.includes(visitorId) && !exposed.includes('analytics-local-test') && !exposed.includes('recentEvents') && !exposed.includes('ipCounts'))
  const privateMetrics = await readFile(rollupFile, 'utf8')
  assert.ok(!privateMetrics.includes(visitorId) && !privateMetrics.includes('analytics-local-test'))

  const product = (await (await request('/api/products', {}, false)).json()).products.find(value => value.stock > 0 && value.sizes.length && value.colors.length)
  const saved = await request('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ customerName: 'Analytics local test', email: 'test@example.invalid', phone: '0600000000', address: 'Local test only', city: 'Test', country: 'المغرب', total: product.price, items: [{ productId: product.id, name: product.name, price: product.price, quantity: 1, size: product.sizes[0], color: product.colors[0] }] }) }, false)
  assert.equal(saved.status, 201)
  orderId = (await saved.json()).order.id
  for (let attempt = 0; attempt < 20; attempt++) { if ((await stats()).orders === 1) break; await new Promise(resolve => setTimeout(resolve, 100)) }
  const withOrder = await stats()
  assert.equal(withOrder.orders, 1)
  assert.equal(withOrder.orderValue, product.price)
  const invalid = await request('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' }, false)
  assert.equal(invalid.status, 400)
  assert.equal((await stats()).orders, 1)

  const capped = emptyMetrics(day)
  capped.ipCounts.ip = 1000
  assert.equal(applyVisitorEvent(capped, first, 'visitor', 'ip', 'MA'), false)
  const period = summarizeAnalytics([emptyMetrics('2026-10-25'), emptyMetrics('2026-10-26')], '2026-10-26')
  assert.equal(period.visits, 0)
  assert.equal(period.daily.length, 2)
  console.log('PASS: anonymous visits, daily deduplication, concurrent events, actions, sources/devices/countries, admin and bot exclusion, privacy, protected reporting, registered orders and rejected order exclusion. No WhatsApp message sent.')
} finally {
  if (orderId && /^[a-f0-9-]+$/.test(orderId)) await unlink(join(process.cwd(), '.codex/store/orders', orderId + '.json')).catch(() => {})
  if (original) await writeFile(rollupFile, original)
  else await unlink(rollupFile).catch(() => {})
}
