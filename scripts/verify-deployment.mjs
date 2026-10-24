import assert from 'node:assert/strict'

const baseUrl = process.env.BASE_URL || 'http://localhost:3000'
async function get(path, expectedStatus = 200) {
  const response = await fetch(new URL(path, baseUrl))
  assert.equal(response.status, expectedStatus, `${path}: unexpected status`)
  return response
}

const home = await get('/')
assert.match(await home.text(), /NOXwear/)

const { categories } = await (await get('/api/categories')).json()
const { products } = await (await get('/api/products')).json()
assert.equal(categories.length, 5)
assert.equal(products.length, 7)

await Promise.all(categories.map(async (category) => {
  const response = await get(`/api/products?category=${category.slug}`)
  const { products: items } = await response.json()
  assert.ok(items.length > 0, `Empty collection: ${category.slug}`)
  assert.ok(items.every((product) => product.category.slug === category.slug))
}))

await Promise.all(products.map(async (product) => {
  const detail = await (await get(`/api/products/${product.slug}`)).json()
  assert.equal(detail.product.id, product.id)
  await get(product.image)
}))

const search = await (await get('/api/products?search=BMW')).json()
assert.equal(search.products.length, 1)
assert.equal(search.products[0].slug, 'bmw-m4-motorsport-hoodie')
await get('/api/products/does-not-exist', 404)

const invalidOrder = await fetch(new URL('/api/orders', baseUrl), {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: '{}',
})
assert.equal(invalidOrder.status, 400)

console.log('PASS: home, 5 collections, 7 products, images, search, 404, order validation')
