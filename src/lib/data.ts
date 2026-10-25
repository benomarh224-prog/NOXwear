import catalog from '@/lib/catalog.json'
import type { Category, Product } from '@/lib/types'
import type { OrderInput } from '@/lib/orders'

// The storefront's curated catalog ships with every deployment.
const categories: Category[] = catalog.categories.filter((category) => category.slug !== 'hoodies').map((category) => ({
  ...category,
  id: category.slug,
}))

const products: Product[] = catalog.products.map((product) => ({
  ...product,
  id: product.slug,
  categoryId: product.categorySlug,
  category: categories.find((category) => category.slug === product.categorySlug),
  oldPrice: null,
  gallery: product.image,
  sizes: product.sizes.split(',').map((size) => size.trim()),
  colors: product.colors.split(',').map((color) => color.trim()),
  tags: product.tags.split(',').map((tag) => tag.trim()),
}))

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

  let result = products.filter((product) => {
    if (categorySlug && product.categoryId !== categorySlug) return false
    if (featuredOnly && !product.featured) return false
    if (query) {
      const text = [product.name, product.description, ...product.tags]
        .join(' ').normalize('NFKC').toLocaleLowerCase()
      if (!text.includes(query)) return false
    }
    return true
  })

  switch (sort) {
    case 'price-low':
      result.sort((a, b) => a.price - b.price)
      break
    case 'price-high':
      result.sort((a, b) => b.price - a.price)
      break
    case 'rating':
      result.sort((a, b) => b.rating - a.rating)
      break
    case 'featured':
      result.sort((a, b) => Number(b.featured) - Number(a.featured) || b.rating - a.rating)
      break
    default:
      result.reverse()
  }

  if (limit !== undefined && Number.isFinite(limit)) {
    result = result.slice(0, Math.max(0, Math.min(100, Math.trunc(limit))))
  }
  return result
}

export async function getProductBySlug(slug: string) {
  return products.find((product) => product.slug === slug) || null
}

export async function getRelatedProducts(slug: string, limit = 4) {
  const product = await getProductBySlug(slug)
  if (!product) return []
  return products.filter((item) => item.categoryId === product.categoryId && item.slug !== slug)
    .slice(0, limit)
}

export async function createOrder(data: OrderInput) {
  const { saveOrder } = await import('@/lib/orders')
  return saveOrder(data)
}
