import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import vm from 'node:vm'
import ts from 'typescript'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

const require = createRequire(import.meta.url)
async function load(path, dependencies = {}, globals = {}) {
  const source = await readFile(path, 'utf8')
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText
  const exports = {}
  vm.runInNewContext(code, { exports, require: (name) => dependencies[name] || require(name), ...globals })
  return exports
}

// Exercise the controller with different device/viewport conditions. Any writes
// to image/card targets or opacity would reintroduce the scroll flash.
async function motionCase({ desktop = true, reduced = false, kind = 'home', top = 100, bottom = 200, focused = false } = {}) {
  const writes = [], queries = [], listeners = new Map()
  let cleanup, mediaCleanup, reverted = false, finished = false
  const heading = { contains: () => focused, getBoundingClientRect: () => ({ top, bottom }), addEventListener: (name, fn) => listeners.set(name, fn), removeEventListener: (name) => listeners.delete(name) }
  const root = { current: { querySelector: (query) => { queries.push(query); assert.equal(query, '[data-hero-copy] h1'); return heading } } }
  const animation = { progress: (value) => { assert.equal(value, 1); finished = true; return animation }, kill: () => {} }
  const motion = await load('src/components/store/store-motion.tsx', {
    gsap: { gsap: { registerPlugin() {}, matchMedia: () => ({ add: (query, fn) => { assert.match(query, /pointer: fine/); assert.match(query, /prefers-reduced-motion: no-preference/); if (desktop && !reduced) mediaCleanup = fn() }, revert: () => { reverted = true; mediaCleanup?.() } }), fromTo: (target, from, to) => { assert.equal(target, heading); writes.push({ from, to }); return animation } } },
    '@gsap/react': { useGSAP: (fn) => { cleanup = fn() } },
  }, { document: { activeElement: null }, window: { innerHeight: 800 } })
  motion.default({ root, view: { kind } })
  for (const { from, to } of writes) {
    for (const state of [from, to]) {
      assert.ok(!('opacity' in state) && !('scale' in state) && !('scrollTrigger' in state), 'Images/text must never fade or scale when scrolling')
    }
  }
  listeners.get('focusin')?.()
  if (writes.length) assert.ok(finished, 'Focus must finish the optional entrance')
  cleanup?.()
  assert.equal(listeners.size, 0, 'Navigation must remove listeners')
  if (kind === 'home') assert.ok(reverted)
  return { writes, queries }
}
assert.equal((await motionCase()).writes.length, 1)
for (const options of [{ desktop: false }, { reduced: true }, { top: -200, bottom: -100 }, { top: 900, bottom: 1000 }, { focused: true }, { kind: 'category' }, { kind: 'product' }]) {
  assert.equal((await motionCase(options)).writes.length, 0, 'No motion on touch/reduced motion, offscreen content, or product/category views')
}

// Render the real Next Image implementation: no opaque black blur layer, no
// visibility transition, responsive optimizer URLs and reserved fill layout.
const image = await load('src/components/store/optimized-image.tsx')
const markup = renderToStaticMarkup(React.createElement(image.OptimizedImage, { src: '/products/front.jpg', alt: 'هودي', sizes: '(max-width: 639px) calc(50vw - 22px), 284px', loading: 'lazy', className: 'object-cover' }))
assert.match(markup, /loading="lazy"/)
assert.match(markup, /decoding="async"/)
assert.match(markup, /srcSet=/)
assert.match(markup, /position:absolute/)
assert.match(markup, /_next\/image/)
assert.ok(!/data:image|filter:|opacity:|background-image:|visibility:hidden/.test(markup), 'A decoded image must not be covered by a fake blur placeholder')
const ui = { setView() {} }, cart = { addItem() {} }
const box = ({ children }) => React.createElement('div', null, children)
const card = await load('src/components/store/product-card.tsx', {
  '@/components/ui/button': { Button: box }, '@/components/ui/badge': { Badge: box },
  '@/lib/ui-store': { useUI: (selector) => selector(ui) }, '@/lib/store': { useCart: (selector) => selector(cart) },
  '@/lib/analytics-client': { trackStoreEvent() {} }, '@/lib/format': { formatPrice: String },
  './optimized-image': image, './reveal': { Reveal: box },
})
const product = { id: 'test', slug: 'test', name: 'هودي', image: '/products/front.jpg', price: 259, stock: 5, sizes: ['M'], colors: ['أسود'], rating: 0, reviewCount: 0, description: 'هودي للتجربة' }
for (const eager of [true, false]) {
  const html = renderToStaticMarkup(React.createElement(card.ProductCard, { product, eager }))
  assert.ok(html.includes('loading="' + (eager ? 'eager' : 'lazy') + '"'))
  assert.match(html, /5 فقط متبقي/)
  assert.match(html, /عرض سريع/)
}
console.log('PASS: stable images, responsive loading, desktop-only text motion, offscreen/reduced-motion guards and navigation cleanup')
