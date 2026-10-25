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

  // Pick hero images: prefer the Noxwear Horse hoodie as the main hero image
  const heroProduct = featured.find((p) => p.slug === 'noxwear-horse-hoodie') || featured[0]
  const accentProduct = featured.find((p) => p.slug === 'palestine-keffiyeh-hoodie') || featured[1]

  const heroImage = heroProduct?.image || 'https://picsum.photos/seed/hero/800/800'
  const accentImage = accentProduct?.image || 'https://picsum.photos/seed/accent/800/800'

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
