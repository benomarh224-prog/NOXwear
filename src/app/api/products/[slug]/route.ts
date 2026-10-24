import { NextResponse } from 'next/server'
import { getProductBySlug, getRelatedProducts } from '@/lib/data'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params
  const product = await getProductBySlug(slug)
  if (!product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  }
  const related = await getRelatedProducts(slug, 4)
  return NextResponse.json({ product, related })
}
