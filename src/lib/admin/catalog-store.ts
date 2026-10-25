import 'server-only'
import { randomUUID } from 'node:crypto'
import { catalogDocumentSchema, initialCatalog, type AdminProduct, type ProductInput } from './product-schema'
import { readJson, writeJson, StorageConflictError } from './storage'

const CATALOG_PATH = 'catalog/products-v1.json'

export async function readCatalog() {
  const saved = await readJson(CATALOG_PATH)
  return saved
    ? { document: catalogDocumentSchema.parse(saved.value), revision: saved.revision }
    : { document: initialCatalog(), revision: 'seed' }
}

export async function saveProduct(input: ProductInput, expectedRevision: string, slug?: string) {
  const { document, revision } = await readCatalog()
  if (revision !== expectedRevision) throw new StorageConflictError('Catalog changed')
  const existing = slug ? document.products.find((product) => product.slug === slug) : undefined
  if (slug && !existing) return null
  if (!existing && document.products.length >= 1000) throw new Error('Catalog capacity reached')
  const now = new Date().toISOString()
  const product: AdminProduct = {
    ...input,
    sizes: [...new Set(input.sizes)], colors: [...new Set(input.colors)],
    images: [...new Set(input.images)],
    slug: existing?.slug || `product-${randomUUID()}`,
    oldPrice: existing?.oldPrice ?? null,
    rating: existing?.rating ?? 0, reviewCount: existing?.reviewCount ?? 0,
    tags: existing?.tags ?? [],
    createdAt: existing?.createdAt ?? now, updatedAt: now,
  }
  const products = existing
    ? document.products.map((item) => item.slug === product.slug ? product : item)
    : [product, ...document.products]
  const next = catalogDocumentSchema.parse({ version: 1, products })
  const nextRevision = await writeJson(CATALOG_PATH, next, revision === 'seed' ? null : revision)
  return { products: next.products, revision: nextRevision, product }
}
