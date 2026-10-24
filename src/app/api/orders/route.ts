import { NextResponse } from 'next/server'
import { createOrder } from '@/lib/data'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { customerName, email, phone, address, city, country, items, total } = body
    if (!customerName || !email || !address || !items?.length) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 },
      )
    }
    const order = await createOrder({
      customerName,
      email,
      phone: phone || '',
      address,
      city: city || '',
      country: country || '',
      items,
      total,
    })
    return NextResponse.json({ order })
  } catch (err: any) {
    console.error('Order creation failed:', err)
    return NextResponse.json(
      { error: err.message || 'Failed to create order' },
      { status: 500 },
    )
  }
}
