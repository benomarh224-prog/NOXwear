import { NextResponse } from 'next/server'
import { getProductBySlug, getRelatedProducts } from '@/lib/data'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params
    const product = await getProductBySlug(slug)
    if (!product) return NextResponse.json({ error: 'المنتج غير موجود' }, { status: 404 })
    const related = await getRelatedProducts(slug, 4)
    return NextResponse.json({ product, related })
  } catch {
    console.warn('Product details are temporarily unavailable')
    return NextResponse.json({ error: 'المنتج غير متاح مؤقتاً. عاود المحاولة من بعد.' }, { status: 503, headers: { 'Cache-Control': 'no-store' } })
  }
}
