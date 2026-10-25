import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { createRequire } from 'node:module'
import ts from 'typescript'

// Exercise the actual shared TypeScript modules without a second implementation.
const loaded = new Map()
function load(path) {
  const filename = resolve(path)
  if (loaded.has(filename)) return loaded.get(filename).exports
  const module = { exports: {} }; loaded.set(filename, module)
  const compiled = ts.transpileModule(readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
  const require = (name) => name.startsWith('.') ? load(resolve(dirname(filename), name + '.ts')) : createRequire(filename)(name)
  new Function('require', 'module', 'exports', compiled)(require, module, module.exports)
  return module.exports
}

const { calculateOrderPricing: price, pricingMessageLines } = load('src/lib/pricing.ts')
const hoodie = (quantity, amount = 250) => ({ quantity, price: amount, productType: 'hoodie' })
const expected = [[0, 0, 0], [1, 0, 250], [2, 50, 450], [3, 50, 700], [4, 100, 900], [5, 100, 1150]]
for (const [quantity, discount, total] of expected) {
  const actual = price([hoodie(quantity)])
  assert.equal(actual.discount, discount); assert.equal(actual.grandTotal, total)
  assert.equal(actual.shipping, 0); assert.equal(actual.advance + actual.remainingToPay, total)
}
assert.equal(price([hoodie(1), hoodie(1)]).grandTotal, 450, 'Different hoodie designs/variants should combine')
assert.equal(price([hoodie(1), { quantity: 1, price: 250, productType: 'other' }]).discount, 0)
assert.equal(price([{ quantity: 2, price: 250, productType: 'other' }]).grandTotal, 500)
assert.equal(price([hoodie(2, 250.25)]).grandTotal, 450.5, 'Money must retain cents')
assert.equal(price([hoodie(2, 10)]).grandTotal, 0, 'Discount must not produce a negative total')
assert.equal(price([hoodie(1, 25)]).remainingToPay, 0, 'Advance cannot exceed total')
assert.equal(price([{ quantity: 2, price: 250 }]).discount, 50, 'Existing hoodie carts must retain eligibility')
const pair = price([hoodie(2)])
assert.equal(pair.advance, 50); assert.equal(pair.remainingToPay, 400)
const message = pricingMessageLines(pair, 'المغرب').join('\n')
assert.match(message, /-50 د.م/); assert.match(message, /الإجمالي: 450 د.م/); assert.match(message, /المتبقي عند التوصيل: 400 د.م/)
assert.ok(!pricingMessageLines(price([hoodie(1)]), 'المغرب').some((line) => line.includes('تخفيض')))

const persisted = new Map()
globalThis.localStorage = { getItem: (key) => persisted.get(key) ?? null, setItem: (key, value) => persisted.set(key, value), removeItem: (key) => persisted.delete(key) }
globalThis.window = { localStorage: globalThis.localStorage }
const { useCart } = load('src/lib/store.ts')
const cart = () => useCart.getState()
cart().addItem({ productId: 'a', slug: 'a', name: 'Hoodie', price: 250, image: '/a.jpg', size: 'L', color: 'أسود', productType: 'hoodie' })
assert.equal(price(cart().items).discount, 0)
cart().updateQuantity(cart().items[0].id, 2)
assert.equal(price(cart().items).discount, 50)
cart().updateQuantity(cart().items[0].id, 1)
assert.equal(price(cart().items).discount, 0)
cart().addItem({ productId: 'b', slug: 'b', name: 'Second hoodie', price: 250, image: '/b.jpg', size: 'M', color: 'أبيض', productType: 'hoodie' })
assert.equal(price(cart().items).grandTotal, 450)
cart().removeItem(cart().items[1].id)
assert.equal(price(cart().items).grandTotal, 250)
cart().clear()
console.log('PASS: hoodie pairs, mixed products, quantities, money, deposit, WhatsApp summary, cart add/remove/update')
