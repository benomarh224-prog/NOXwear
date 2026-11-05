import { unstable_cache } from 'next/cache'
import { CatalogUnavailableError, STOREFRONT_CACHE_TAG } from '@/lib/storefront-cache'
import catalog from '@/lib/catalog.json'
import { compareCollectionOrder } from '@/lib/collection-order'
import { readCatalog } from '@/lib/admin/catalog-store'
import type { Category, Product } from '@/lib/types'
import type { OrderInput } from '@/lib/orders'

const categories: Category[] = catalog.categories.filter((category) => category.slug !== 'hoodies').map((category) => ({
  ...category, id: category.slug,
}))

async function loadCatalogProducts(): Promise<Product[]> {
  const { document } = await readCatalog().catch((cause: unknown) => {
    throw new CatalogUnavailableError('The catalogue is temporarily unavailable', { cause })
  })
  return document.products.filter((product) => product.active && !product.deletedAt).map((product) => ({
    ...product,
    id: product.slug,
    image: product.images[0],
    gallery: product.images.join(','),
    categoryId: product.categorySlug,
    category: categories.find((category) => category.slug === product.categorySlug),
    badge: product.badge || null,
  }))
}

const cachedCatalogProducts = unstable_cache(loadCatalogProducts, ['storefront-products-v1'], {
  revalidate: 60, tags: [STOREFRONT_CACHE_TAG],
})

async function catalogProducts(fresh = false): Promise<Product[]> {
  return fresh || !process.env.VERCEL ? loadCatalogProducts() : cachedCatalogProducts()
}

export async function getCategories() {
  return [...categories].sort((a, b) => a.name.localeCompare(b.name, 'ar'))
}

export async function getCategoryBySlug(slug: string) {
  return categories.find((category) => category.slug === slug) || null
}

export async function getProducts(opts: {
  categorySlug?: string | null
  search?: string | null
  sort?: string | null
  featuredOnly?: boolean
  limit?: number
  fresh?: boolean
} = {}) {
  const { categorySlug, search, sort, featuredOnly, limit, fresh } = opts
  const query = search?.trim().normalize('NFKC').toLocaleLowerCase()
  let result = (await catalogProducts(fresh)).filter((product) => {
    if (categorySlug && product.categoryId !== categorySlug) return false
    if (featuredOnly && !product.featured) return false
    if (query) {
      const text = [product.name, product.description, ...product.tags].join(' ').normalize('NFKC').toLocaleLowerCase()
      if (!text.includes(query)) return false
    }
    return true
  })
  switch (sort) {
    case 'price-low': result.sort((a, b) => a.price - b.price); break
    case 'price-high': result.sort((a, b) => b.price - a.price); break
    case 'rating': result.sort((a, b) => b.rating - a.rating); break
    case 'featured': result.sort((a, b) => Number(b.featured) - Number(a.featured) || b.createdAt.localeCompare(a.createdAt) || b.rating - a.rating); break
    case 'newest': result.sort((a, b) => b.createdAt.localeCompare(a.createdAt)); break
    case 'store-order': result.sort(compareCollectionOrder); break
    default: result.sort(categorySlug ? compareCollectionOrder : (a, b) => b.createdAt.localeCompare(a.createdAt))
  }
  if (limit !== undefined && Number.isFinite(limit)) {
    result = result.slice(0, Math.max(0, Math.min(100, Math.trunc(limit))))
  }
  return result
}

export async function getProductBySlug(slug: string) {
  return (await catalogProducts()).find((product) => product.slug === slug) || null
}

export async function getRelatedProducts(slug: string, limit = 4) {
  const products = await catalogProducts()
  const product = products.find((item) => item.slug === slug)
  if (!product) return []
  return products.filter((item) => item.categoryId === product.categoryId && item.slug !== slug).slice(0, limit)
}

export async function createOrder(data: OrderInput) {
  const { saveOrder } = await import('@/lib/orders')
  return saveOrder(data)
}
