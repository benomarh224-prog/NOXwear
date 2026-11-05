import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import vm from 'node:vm'
import ts from 'typescript'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

const require = createRequire(import.meta.url)
async function load(path, dependencies = {}, globals = {}) {
  const code = ts.transpileModule(await readFile(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText
  const exports = {}
  vm.runInNewContext(code, { exports, URL, URLSearchParams, process: { env: { VERCEL: '1' } }, console: { warn() {} }, require: (name) => dependencies[name] || require(name), ...globals })
  return exports
}
const cachePolicy = await load('src/lib/storefront-cache.ts')
let reads = 0, offline = false, cached
let record = { slug: 'hoodie', name: 'هودي', images: ['/products/front.jpg'], categorySlug: 'anime', active: true, deletedAt: null, price: 250, tags: [], createdAt: '2026-10-01T00:00:00.000Z' }
const data = await load('src/lib/data.ts', {
  '@/lib/storefront-cache': cachePolicy,
  '@/lib/catalog.json': { categories: [{ slug: 'anime', name: 'أنمي' }] },
  '@/lib/collection-order': { compareCollectionOrder: () => 0 },
  '@/lib/admin/catalog-store': { readCatalog: async () => { reads++; if (offline) throw new Error('403 private storage credentials'); return { document: { products: [structuredClone(record)] } } } },
  'next/cache': { unstable_cache: (fn, keys, options) => { assert.equal(options.revalidate, 60); assert.equal(options.tags[0], cachePolicy.STOREFRONT_CACHE_TAG); return async () => cached ?? (cached = await fn()) } },
})
assert.equal((await data.getProducts())[0].price, 250)
record = { ...record, price: 275 }
assert.equal((await data.getProducts())[0].price, 250)
assert.equal(reads, 1, 'Public page loads share one successful catalogue read')
assert.equal((await data.getProducts({ fresh: true }))[0].price, 275, 'Checkout must bypass the public cache')
offline = true
assert.equal((await data.getProducts())[0].price, 250, 'A warm cache still serves the last successful catalogue')
await assert.rejects(data.getProducts({ fresh: true }), cachePolicy.CatalogUnavailableError, 'Checkout must not accept stale data during storage failure')
cached = undefined
await assert.rejects(data.getProducts(), cachePolicy.CatalogUnavailableError)
offline = false
assert.equal((await data.getProducts())[0].price, 275, 'A failed read must not cache an empty catalogue')
const unavailable = await load('src/components/store/store-unavailable.tsx', { './brand-logo': { BrandLogo: () => React.createElement('span', null, 'NOXwear') } })
const nav = await load('src/lib/navigation-view.ts')
const page = await load('src/app/page.tsx', {
  '@/lib/data': { getCategories: async () => [], getProducts: async () => { throw new Error('403 private storage credentials') } },
  '@/components/store/store-app': { StoreApp: () => React.createElement('div', null, 'store') },
  '@/components/store/store-unavailable': unavailable,
  '@/lib/navigation-view': nav,
})
const html = renderToStaticMarkup(await page.default({ searchParams: Promise.resolve({ collection: 'anime' }) }))
assert.match(html, /المتجر غير متاح مؤقتاً/)
assert.match(html, /href="\/\?collection=anime"/)
assert.match(html, /wa.me\/212645900763/)
assert.match(html, /noindex, nofollow/)
assert.ok(!html.includes('credentials') && !html.includes('403'), 'Do not expose storage internals to visitors')
const api = await load('src/app/api/products/route.ts', { '@/lib/data': { getProducts: async () => { throw new Error('secret failure') } } })
const response = await api.GET(new Request('https://www.noxwear.site/api/products'))
assert.equal(response.status, 503)
assert.equal(response.headers.get('cache-control'), 'no-store')
assert.ok(!(await response.text()).includes('secret'))
console.log('PASS: shared public cache, fresh checkout, failed-read recovery, outage page, retry/contact links and private API errors')
