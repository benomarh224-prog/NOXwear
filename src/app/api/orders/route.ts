import { NextResponse } from 'next/server'
import { createOrder } from '@/lib/data'
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
    const order = await createOrder(parsed.data)
    return NextResponse.json({ order }, { status: 201 })
  } catch (err: unknown) {
    console.error('Order creation failed:', err)
    return NextResponse.json(
      { error: 'تعذر حفظ الطلب الآن، يرجى المحاولة مجدداً' },
      { status: err instanceof OrderStorageUnavailableError ? 503 : 500 },
    )
  }
}
