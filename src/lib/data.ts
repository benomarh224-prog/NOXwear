import catalog from '@/lib/catalog.json'
import { readCatalog } from '@/lib/admin/catalog-store'
import type { Category, Product } from '@/lib/types'
import type { OrderInput } from '@/lib/orders'

const categories: Category[] = catalog.categories.filter((category) => category.slug !== 'hoodies').map((category) => ({
  ...category, id: category.slug,
}))

async function catalogProducts(): Promise<Product[]> {
  const { document } = await readCatalog()
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
} = {}) {
  const { categorySlug, search, sort, featuredOnly, limit } = opts
  const query = search?.trim().normalize('NFKC').toLocaleLowerCase()
  let result = (await catalogProducts()).filter((product) => {
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
    default: result.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
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
