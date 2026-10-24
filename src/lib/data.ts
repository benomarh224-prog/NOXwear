import { db } from '@/lib/db'

export async function getCategories() {
  const cats = await db.category.findMany({ orderBy: { name: 'asc' } })
  return cats
}

export async function getCategoryBySlug(slug: string) {
  return db.category.findUnique({ where: { slug } })
}

export async function getProducts(opts: {
  categorySlug?: string | null
  search?: string | null
  sort?: string | null
  featuredOnly?: boolean
  limit?: number
} = {}) {
  const { categorySlug, search, sort, featuredOnly, limit } = opts

  const where: any = {}
  if (categorySlug) {
    where.category = { slug: categorySlug }
  }
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { description: { contains: search } },
      { tags: { contains: search } },
    ]
  }
  if (featuredOnly) {
    where.featured = true
  }

  let orderBy: any = { createdAt: 'desc' }
  switch (sort) {
    case 'price-low':
      orderBy = { price: 'asc' }
      break
    case 'price-high':
      orderBy = { price: 'desc' }
      break
    case 'rating':
      orderBy = { rating: 'desc' }
      break
    case 'featured':
      orderBy = [{ featured: 'desc' }, { rating: 'desc' }]
      break
  }

  const products = await db.product.findMany({
    where,
    orderBy,
    take: limit,
    include: { category: true },
  })

  return products.map((p) => ({
    ...p,
    sizes: p.sizes.split(',').map((s) => s.trim()),
    colors: p.colors.split(',').map((c) => c.trim()),
    tags: p.tags.split(',').map((t) => t.trim()),
    gallery: p.image,
  }))
}

export async function getProductBySlug(slug: string) {
  const p = await db.product.findUnique({
    where: { slug },
    include: { category: true },
  })
  if (!p) return null
  return {
    ...p,
    sizes: p.sizes.split(',').map((s) => s.trim()),
    colors: p.colors.split(',').map((c) => c.trim()),
    tags: p.tags.split(',').map((t) => t.trim()),
    gallery: p.image,
  }
}

export async function getRelatedProducts(slug: string, limit = 4) {
  const product = await db.product.findUnique({ where: { slug } })
  if (!product) return []
  const related = await db.product.findMany({
    where: {
      AND: [{ categoryId: product.categoryId }, { slug: { not: slug } }],
    },
    take: limit,
    include: { category: true },
  })
  return related.map((p) => ({
    ...p,
    sizes: p.sizes.split(',').map((s) => s.trim()),
    colors: p.colors.split(',').map((c) => c.trim()),
    tags: p.tags.split(',').map((t) => t.trim()),
    gallery: p.image,
  }))
}

export async function createOrder(data: {
  customerName: string
  email: string
  phone: string
  address: string
  city: string
  country: string
  items: Array<{
    productId: string
    name: string
    price: number
    quantity: number
    size: string
    color: string
  }>
  total: number
}) {
  const order = await db.order.create({
    data: {
      customerName: data.customerName,
      email: data.email,
      phone: data.phone,
      address: data.address,
      city: data.city,
      country: data.country,
      total: data.total,
      status: 'pending',
      itemsJson: JSON.stringify(data.items),
    },
  })
  return order
}
