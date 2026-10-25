import { NextResponse } from 'next/server'
import { createOrder, getProducts } from '@/lib/data'
import { calculateOrderPricing, type PricingLine } from '@/lib/pricing'
import { OrderStorageUnavailableError } from '@/lib/orders'
import { z } from 'zod'

const orderSchema = z.object({
  customerName: z.string().trim().min(1).max(120),
  email: z.string().trim().min(1).max(254),
  phone: z.string().trim().min(1).max(40),
  address: z.string().trim().min(1).max(500),
  city: z.string().trim().min(1).max(100),
  country: z.string().trim().min(1).max(100),
  total: z.number().finite().nonnegative(),
  items: z.array(z.object({
    productId: z.string().min(1).max(150),
    name: z.string().min(1).max(250),
    price: z.number().finite().nonnegative(),
    quantity: z.number().int().min(1).max(100),
    size: z.string().min(1).max(50),
    color: z.string().min(1).max(50),
  })).min(1).max(50),
})

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null)
    const parsed = orderSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'يرجى التحقق من معلومات الزبون والمنتجات المطلوبة' },
        { status: 400 },
      )
    }
    const currentProducts = new Map((await getProducts()).map((product) => [product.id, product]))
    const pricingItems: PricingLine[] = []
    const quantities = new Map<string, number>()
    for (const item of parsed.data.items) {
      const product = currentProducts.get(item.productId)
      const quantity = (quantities.get(item.productId) || 0) + item.quantity
      if (!product || quantity > product.stock || !product.sizes.includes(item.size) || !product.colors.includes(item.color) || Math.abs(product.price - item.price) > 0.001) {
        return NextResponse.json({ error: 'تبدل ثمن أو توفر واحد من المنتجات. حدّث الصفحة وراجع السلة قبل تأكيد الطلب.' }, { status: 409 })
      }
      quantities.set(item.productId, quantity)
      item.name = product.name
      pricingItems.push({ price: product.price, quantity: item.quantity, productType: product.productType })
    }
    const pricing = calculateOrderPricing(pricingItems, parsed.data.country)
    const expectedTotal = pricing.grandTotal
    if (Math.abs(expectedTotal - parsed.data.total) > 0.01) return NextResponse.json({ error: 'مجموع الطلب تبدل. حدّث الصفحة وراجع السلة.' }, { status: 409 })
    const order = await createOrder({ ...parsed.data, total: expectedTotal, pricing })
    return NextResponse.json({ order, pricing }, { status: 201 })
  } catch (err: unknown) {
    console.error('Order creation failed:', err)
    return NextResponse.json(
      { error: 'تعذر حفظ الطلب الآن، يرجى المحاولة مجدداً' },
      { status: err instanceof OrderStorageUnavailableError ? 503 : 500 },
    )
  }
}
