import { NextResponse } from 'next/server'
import { getProducts } from '@/lib/data'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const categorySlug = url.searchParams.get('category')
  const search = url.searchParams.get('search')
  const sort = url.searchParams.get('sort')
  const featuredOnly = url.searchParams.get('featured') === 'true'
  const limitParam = url.searchParams.get('limit')
  const limit = limitParam ? parseInt(limitParam, 10) : undefined

  try {
    const products = await getProducts({
      categorySlug,
      search,
      sort,
      featuredOnly,
      limit,
    })
    return NextResponse.json({ products })
  } catch (err: any) {
    console.error('GET /api/products failed:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
