import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import vm from 'node:vm'
import ts from 'typescript'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

const require = createRequire(import.meta.url)
const source = await readFile('src/components/store/category-view.tsx', 'utf8')
const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText
const box = ({ children }) => React.createElement('div', null, children)
const products = ['anime', 'sports', 'arabic-art', 'limitless-drops'].flatMap((categoryId) => [
  { id: categoryId + '-old', name: 'Old', categoryId, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-12-31T00:00:00.000Z', featured: true, rating: 5, price: 300 },
  { id: categoryId + '-new', name: 'New', categoryId, createdAt: '2026-10-28T10:00:00.000Z', featured: false, rating: 0, price: 250 },
  { id: categoryId + '-middle', name: 'Middle', categoryId, createdAt: '2026-10-27T10:00:00.000Z', featured: false, rating: 4, price: 200 },
])
const original = JSON.stringify(products)
function render(category, sort) {
  const exports = {}
  const dependencies = {
    react: sort ? { ...React, useState: () => [sort, () => {}] } : React,
    '@/lib/ui-store': { useUI: (select) => select({ setView() {}, back() {} }) },
    '@/components/ui/button': { Button: box }, '@/components/ui/badge': { Badge: box },
    '@/components/ui/select': { Select: ({ value, children }) => React.createElement('div', { 'data-sort': value }, children), SelectContent: box, SelectItem: box, SelectTrigger: box, SelectValue: () => null },
    './product-card': { ProductCard: ({ product }) => React.createElement('span', { 'data-product': product.id }) },
    './optimized-image': { OptimizedImage: () => null }, '@/lib/category-images': { CATEGORY_IMAGES: {} },
  }
  vm.runInNewContext(code, { exports, require: (name) => dependencies[name] || require(name) })
  return renderToStaticMarkup(React.createElement(exports.CategoryView, { category: { slug: category, name: category }, products }))
}
for (const category of ['anime', 'sports', 'arabic-art', 'limitless-drops']) {
  const markup = render(category)
  assert.match(markup, /data-sort="newest"/)
  const order = [...markup.matchAll(/data-product="([^"]+)"/g)].map((match) => match[1])
  assert.deepEqual(order, [category + '-new', category + '-middle', category + '-old'], 'New products must precede older featured/recently edited products')
}
for (const [sort, ids] of [['price-low', ['middle', 'new', 'old']], ['price-high', ['old', 'new', 'middle']], ['rating', ['old', 'middle', 'new']], ['featured', ['old', 'middle', 'new']]]) {
  const order = [...render('anime', sort).matchAll(/data-product="([^"]+)"/g)].map((match) => match[1])
  assert.deepEqual(order, ids.map((id) => 'anime-' + id))
}
assert.equal(JSON.stringify(products), original, 'Collection sorting must not mutate the shared catalogue')
console.log('PASS: newest-first default in every collection, creation-date ordering, edits do not move old products, manual sorts and catalogue immutability')
