import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { randomUUID } from 'node:crypto'
import vm from 'node:vm'
import ts from 'typescript'

const require = createRequire(import.meta.url)
async function load(path, dependencies = {}, globals = {}) {
  const source = await readFile(path, 'utf8')
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText
  const exports = {}
  vm.runInNewContext(code, { exports, require: (name) => dependencies[name] || require(name), URL, URLSearchParams, ...globals })
  return exports
}
const views = await load('src/lib/navigation-view.ts')
assert.equal(views.viewFromParams(new URLSearchParams('collection=anime')).kind, 'category')
assert.equal(views.viewFromParams(new URLSearchParams('product=hoodie')).slug, 'hoodie')
assert.equal(views.viewFromParams(new URLSearchParams('search=')).query, '')
assert.equal(views.viewFromParams(new URLSearchParams('custom=1')).kind, 'custom-print')
assert.equal(views.viewFromParams(new URLSearchParams('checkout=1')).kind, 'checkout')
assert.equal(views.viewFromParams(new URLSearchParams('success=1')).kind, 'home', 'A reloaded success URL cannot fabricate an order')

function fakeWindow(initial = 'https://example.test/?utm_source=test') {
  const listeners = new Map(), calls = []
  let entries = [{ state: { __NA: true, tree: { marker: 'next-router-state' } }, url: new URL(initial) }], at = 0, replaces = 0
  const win = { location: entries[0].url, scrollX: 0, scrollY: 0, crypto: { randomUUID },
    addEventListener: (name, fn, options) => { if (name === 'scroll') assert.equal(options.passive, true); listeners.set(name, fn) },
    removeEventListener: (name, fn) => { assert.equal(listeners.get(name), fn); listeners.delete(name) },
    scrollTo: (position) => { assert.equal(position.behavior, 'instant'); win.scrollX = position.left; win.scrollY = position.top; calls.push(position); listeners.get('scroll')?.() },
    history: { scrollRestoration: 'auto', get state() { return entries[at].state },
      replaceState: (state, _title, url) => { replaces++; entries[at] = { state, url: url === undefined ? win.location : new URL(url, win.location) }; win.location = entries[at].url },
      pushState: (state, _title, url) => { entries = entries.slice(0, at + 1); entries.push({ state, url: new URL(url, win.location) }); at++; win.location = entries[at].url },
      back: () => traverse(-1), forward: () => traverse(1),
    },
  }
  function traverse(delta) { const next = at + delta; if (next < 0 || next >= entries.length) return; at = next; win.location = entries[at].url; listeners.get('popstate')?.() }
  return { win, calls, listeners, setScroll: (top) => { win.scrollY = top; listeners.get('scroll')?.() }, replaceCount: () => replaces }
}
async function scenario(url) {
  const browser = fakeWindow(url)
  const navigation = await load('src/lib/ui-store.ts', { './navigation-view': views }, { window: browser.win })
  const cleanup = navigation.initializeNavigation()
  assert.equal(browser.win.history.scrollRestoration, 'manual')
  navigation.restoreNavigationScroll()
  return { ...browser, ...navigation, state: navigation.useUI.getState, cleanup }
}

const nav = await scenario()
nav.setScroll(1450)
const writes = nav.replaceCount()
for (let i = 0; i < 50; i++) nav.setScroll(1450 + i)
assert.equal(nav.replaceCount(), writes, 'Scrolling must not rerender or write browser history on every frame')
const count = nav.calls.length
nav.state().setSearchOpen(true)
nav.state().setView({ kind: 'category', slug: 'anime' })
assert.equal(nav.calls.length, count, 'Entering a collection must not scroll the old page before commit')
assert.equal(nav.win.scrollY, 1499)
assert.equal(nav.state().searchOpen, false)
assert.equal(nav.win.location.search, '?utm_source=test&collection=anime')
assert.ok(nav.win.history.state.__NA)
assert.equal(nav.win.history.state.tree.marker, 'next-router-state')
nav.restoreNavigationScroll() // Destination DOM has committed.
assert.equal(nav.win.scrollY, 0)
nav.setScroll(620)
nav.state().setView({ kind: 'product', slug: 'hoodie' })
nav.restoreNavigationScroll()
nav.setScroll(210)
nav.state().back()
assert.equal(nav.state().view.slug, 'anime')
assert.equal(nav.win.scrollY, 210, 'Back must wait for the collection DOM before restoring scroll')
nav.restoreNavigationScroll()
assert.equal(nav.win.scrollY, 620)
nav.state().back()
nav.restoreNavigationScroll()
assert.equal(nav.state().view.kind, 'home')
assert.equal(nav.win.scrollY, 1499)
nav.win.history.forward()
nav.restoreNavigationScroll()
assert.equal(nav.state().view.slug, 'anime')
assert.equal(nav.win.scrollY, 620)
// Each browser history entry owns its position, even when the URL repeats.
nav.state().setView({ kind: 'home' })
nav.restoreNavigationScroll()
assert.equal(nav.win.scrollY, 0)
nav.setScroll(80)
nav.state().back()
nav.restoreNavigationScroll()
assert.equal(nav.win.scrollY, 620)
nav.state().back()
nav.restoreNavigationScroll()
assert.equal(nav.win.scrollY, 1499)
nav.cleanup()
assert.equal(nav.win.history.scrollRestoration, 'auto')
assert.equal(nav.listeners.size, 0)

const direct = await scenario('https://example.test/?collection=anime')
assert.equal(direct.state().view.slug, 'anime')
direct.state().back()
direct.restoreNavigationScroll()
assert.equal(direct.state().view.kind, 'home', 'A direct collection link must return safely to the store')
assert.equal(direct.win.history.state.noxDepth, 0)
direct.cleanup()

const base = process.env.BASE_URL
if (base) {
  const categories = await (await fetch(new URL('/api/categories', base))).json()
  for (const category of categories.categories) {
    const response = await fetch(new URL('/?collection=' + encodeURIComponent(category.slug), base))
    assert.equal(response.status, 200)
    const html = await response.text()
    const main = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/)?.[1]
    assert.ok(main?.includes('data-store-page="category:' + category.slug + '"'))
    assert.ok(!main.includes('data-hero-section') && !main.includes('data-store-page="home"'), 'A collection URL must render the collection on the server without a home-page flash')
  }
  const { products } = await (await fetch(new URL('/api/products', base))).json()
  const response = await fetch(new URL('/?product=' + products[0].slug, base))
  const html = await response.text()
  assert.ok(html.includes('data-store-page="product:' + products[0].slug + '"'))
  assert.ok(!html.includes('data-hero-section'))
}
console.log('PASS: collection/back/forward scroll timing, separate history positions, direct links, Next history preservation and listener cleanup' + (base ? ', server-rendered collections/products' : ''))
