import 'server-only'
import { randomUUID } from 'node:crypto'
import { catalogDocumentSchema, initialCatalog, type AdminProduct, type ProductInput } from './product-schema'
import { readJson, writeJson, normalizeRevision, StorageConflictError } from './storage'

const CATALOG_PATH = 'catalog/products-v1.json'

export async function readCatalog() {
  const saved = await readJson(CATALOG_PATH)
  return saved
    ? { document: catalogDocumentSchema.parse(saved.value), revision: saved.revision }
    : { document: initialCatalog(), revision: 'seed' }
}

export async function saveProduct(input: ProductInput, expectedRevision: string, slug?: string) {
  const newSlug = slug || 'product-' + randomUUID()
  const now = new Date().toISOString()
  for (let attempt = 0; attempt < 3; attempt++) {
    const { document, revision } = await readCatalog()
    // Creating appends to the latest catalog; only edits can overwrite existing data.
    if (slug && normalizeRevision(revision) !== normalizeRevision(expectedRevision)) throw new StorageConflictError('Catalog changed')
    const existing = slug ? document.products.find((product) => product.slug === slug) : undefined
    if (slug && (!existing || existing.deletedAt)) return null
    if (!existing && document.products.length >= 1000) throw new Error('Catalog capacity reached')
    const product: AdminProduct = {
      ...input,
      sizes: [...new Set(input.sizes)], colors: [...new Set(input.colors)],
      images: [...new Set(input.images)],
      slug: newSlug,
      oldPrice: existing?.oldPrice ?? null,
      rating: existing?.rating ?? 0, reviewCount: existing?.reviewCount ?? 0,
      tags: existing?.tags ?? [],
      sortOrder: existing?.categorySlug === input.categorySlug ? existing.sortOrder : null,
      createdAt: existing?.createdAt ?? now, updatedAt: now, deletedAt: null,
    }
    const products = existing
      ? document.products.map((item) => item.slug === product.slug ? product : item)
      : [product, ...document.products]
    const next = catalogDocumentSchema.parse({ version: 1, products })
    try {
      const nextRevision = await writeJson(CATALOG_PATH, next, revision === 'seed' ? null : revision)
      return { products: next.products, revision: nextRevision, product }
    } catch (error) {
      if (!(error instanceof StorageConflictError) || slug || attempt === 2) throw error
    }
  }
  throw new StorageConflictError('Catalog is busy')
}


export async function setProductDeleted(slug: string, expectedRevision: string, deleted: boolean) {
  const { document, revision } = await readCatalog()
  if (normalizeRevision(revision) !== normalizeRevision(expectedRevision)) throw new StorageConflictError('Catalog changed')
  const existing = document.products.find((product) => product.slug === slug)
  if (!existing) return null
  if (Boolean(existing.deletedAt) === deleted) return { products: document.products, revision, product: existing }
  const now = new Date().toISOString()
  const product: AdminProduct = { ...existing, active: false, deletedAt: deleted ? now : null, updatedAt: now }
  const next = catalogDocumentSchema.parse({ version: 1, products: document.products.map((item) => item.slug === slug ? product : item) })
  const nextRevision = await writeJson(CATALOG_PATH, next, revision === 'seed' ? null : revision)
  return { products: next.products, revision: nextRevision, product }
}

export class InvalidProductOrderError extends Error {}

export async function reorderProducts(categorySlug: string, slugs: string[], expectedRevision: string) {
  const { document, revision } = await readCatalog()
  if (normalizeRevision(revision) !== normalizeRevision(expectedRevision)) throw new StorageConflictError('Catalog changed')
  const members = document.products.filter((product) => product.categorySlug === categorySlug && !product.deletedAt)
  const ranks = new Map(slugs.map((slug, index) => [slug, index]))
  if (slugs.length !== members.length || ranks.size !== members.length || members.some((product) => !ranks.has(product.slug))) {
    throw new InvalidProductOrderError('Invalid collection membership')
  }
  const products = document.products.map((product) => product.categorySlug === categorySlug && !product.deletedAt
    ? { ...product, sortOrder: ranks.get(product.slug)! }
    : product)
  const next = catalogDocumentSchema.parse({ version: 1, products })
  const nextRevision = await writeJson(CATALOG_PATH, next, revision === 'seed' ? null : revision)
  return { products: next.products, revision: nextRevision }
}
