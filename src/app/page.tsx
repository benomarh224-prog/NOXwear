import { getCategories, getProducts } from '@/lib/data'
import { StoreApp } from '@/components/store/store-app'
import type { Product } from '@/lib/types'

export const revalidate = 3600

export default async function Home() {
  const [categories, products] = await Promise.all([
    getCategories(),
    getProducts({ sort: 'featured' }),
  ])
  const featured = products.filter((product) => product.featured).slice(0, 12)

  // Build a highlights map: pick the featured product of each category
  // Each category has exactly 1 product, so highlights = the products themselves
  const prioritySlugs = [
    'palestine-keffiyeh-hoodie',   // arabic-art
    'zenin-toji-hoodie',            // anime
    'bmw-m4-motorsport-hoodie',     // sports
    'noxwear-horse-hoodie',         // hoodies
    'noxwear-horse-premium-hoodie', // limitless-drops
  ]

  const highlights: Record<string, Product> = {}

  // First pass: explicit priorities
  for (const slug of prioritySlugs) {
    const p = featured.find((x) => x.slug === slug)
    if (p && p.category) {
      highlights[p.category.slug] = p
    }
  }

  // Second pass: fill any remaining categories with first featured product
  for (const p of featured) {
    if (p.category && !highlights[p.category.slug]) {
      highlights[p.category.slug] = p
    }
  }

  const heroImage = '/products/noxwear-samurai-feature.jpg'
  const accentImage = '/products/noxwear-couple-hoodies.jpg'

  return (
    <StoreApp
      categories={categories}
      products={products}
      featured={featured}
      highlights={highlights}
      heroImage={heroImage}
      accentImage={accentImage}
    />
  )
}
