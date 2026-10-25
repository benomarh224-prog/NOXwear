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
assert.equal(categories.length, 4)
assert.ok(categories.every((category) => category.slug !== 'hoodies'))
assert.ok(Array.isArray(products))

await Promise.all(categories.map(async (category) => {
  const response = await get(`/api/products?category=${category.slug}`)
  const { products: items } = await response.json()
  assert.ok(items.every((product) => product.category.slug === category.slug))
}))

await Promise.all(products.map(async (product) => {
  const detail = await (await get(`/api/products/${product.slug}`)).json()
  assert.equal(detail.product.id, product.id)
  await get(product.image)
}))

if (products.length) {
  const search = await (await get('/api/products?search=' + encodeURIComponent(products[0].name))).json()
  assert.ok(search.products.some((product) => product.slug === products[0].slug))
}
await get('/api/admin/products', 401)
await get('/admin/login')
await get('/api/products/does-not-exist', 404)

const invalidOrder = await fetch(new URL('/api/orders', baseUrl), {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: '{}',
})
assert.equal(invalidOrder.status, 400)

console.log('PASS: home, collections, ' + products.length + ' products, images, search, admin protection, order validation')
