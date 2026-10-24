import { randomUUID } from 'node:crypto'
import { put } from '@vercel/blob'

export interface OrderInput {
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
}

export class OrderStorageUnavailableError extends Error {
  constructor() {
    super('Order storage is not configured for this deployment')
    this.name = 'OrderStorageUnavailableError'
  }
}

export async function saveOrder(data: OrderInput) {
  if (process.env.BLOB_STORE_ID || process.env.BLOB_READ_WRITE_TOKEN) {
    const order = {
      ...data,
      id: randomUUID(),
      status: 'pending',
      createdAt: new Date().toISOString(),
    }
    await put(`orders/${order.id}.json`, JSON.stringify(order), {
      access: 'private',
      contentType: 'application/json',
      addRandomSuffix: false,
      allowOverwrite: false,
    })
    return { id: order.id }
  }

  // A deployed function must never try to write to an ephemeral SQLite file.
  if (process.env.VERCEL || !process.env.DATABASE_URL) {
    throw new OrderStorageUnavailableError()
  }

  // Keep existing SQLite order storage available during local development.
  const { db } = await import('@/lib/db')
  const { items, ...fields } = data
  const order = await db.order.create({
    data: { ...fields, status: 'pending', itemsJson: JSON.stringify(items) },
    select: { id: true },
  })
  return order
}
