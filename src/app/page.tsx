import { getCategories, getProducts } from '@/lib/data'
import { StoreApp } from '@/components/store/store-app'
import { StoreUnavailable } from '@/components/store/store-unavailable'
import type { Category, Product } from '@/lib/types'
import { viewFromParams } from '@/lib/navigation-view'

export const dynamic = 'force-dynamic'

export default async function Home({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(await searchParams)) {
    const first = Array.isArray(value) ? value[0] : value
    if (first !== undefined) params.set(key, first)
  }
  const initialView = viewFromParams(params)
  let categories: Category[]
  let products: Product[]
  try {
    [categories, products] = await Promise.all([
      getCategories(),
      getProducts({ sort: 'featured' }),
    ])
  } catch {
    console.warn('Storefront data is temporarily unavailable')
    return <StoreUnavailable retryHref={params.size ? '/?' + params.toString() : '/'} />
  }
  const featured = products.filter((product) => product.featured).slice(0, 4)

  const heroImage = '/hero/noxwear-horse-card-v2.png'
  const accentImage = '/hero/noxwear-samurai-card-v2.png'

  return (
    <StoreApp
      initialView={initialView}
      categories={categories}
      products={products}
      featured={featured}
      heroImage={heroImage}
      accentImage={accentImage}
    />
  )
}
