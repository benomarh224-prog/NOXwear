import { ADVANCE_DEPOSIT, computeShipping } from './format'

export const HOODIE_PAIR_DISCOUNT = 50

export interface PricingLine {
  price: number
  quantity: number
  productType?: 'hoodie' | 'other'
}

export function calculateOrderPricing(items: PricingLine[], country = 'المغرب') {
  let subtotalCents = 0
  let hoodieSubtotalCents = 0
  let hoodieCount = 0
  for (const item of items) {
    const quantity = Math.max(0, Math.trunc(item.quantity))
    const lineCents = Math.max(0, Math.round(item.price * 100)) * quantity
    subtotalCents += lineCents
    // Existing saved carts predate product types and contain hoodies only.
    if ((item.productType ?? 'hoodie') === 'hoodie') {
      hoodieCount += quantity
      hoodieSubtotalCents += lineCents
    }
  }
  const pairs = Math.floor(hoodieCount / 2)
  const discountCents = Math.min(pairs * HOODIE_PAIR_DISCOUNT * 100, hoodieSubtotalCents)
  const discountedSubtotal = (subtotalCents - discountCents) / 100
  const shipping = computeShipping(country, discountedSubtotal)
  const grandTotalCents = subtotalCents - discountCents + Math.round(shipping * 100)
  const advanceCents = Math.min(ADVANCE_DEPOSIT * 100, grandTotalCents)
  return {
    subtotal: subtotalCents / 100,
    hoodieCount,
    pairs,
    discount: discountCents / 100,
    discountedSubtotal,
    shipping,
    grandTotal: grandTotalCents / 100,
    advance: advanceCents / 100,
    remainingToPay: (grandTotalCents - advanceCents) / 100,
  }
}

export type OrderPricing = ReturnType<typeof calculateOrderPricing>

export function pricingMessageLines(pricing: OrderPricing, country: string) {
  const lines = ['💰 *ملخص الطلب:*', `المجموع الفرعي: ${pricing.subtotal} د.م`]
  if (pricing.discount > 0) lines.push(`تخفيض جوج هوديات (${pricing.pairs}): -${pricing.discount} د.م`)
  lines.push(country === 'المغرب' || country === 'Morocco'
    ? 'رسوم التوصيل: مجاني (جميع مدن المغرب)'
    : `رسوم التوصيل: ${pricing.shipping === 0 ? 'مجاني' : pricing.shipping + ' د.م'}`)
  lines.push(`الإجمالي: ${pricing.grandTotal} د.م`, '', `✅ تسبيق احتياطي: ${pricing.advance} د.م`, `⏳ المتبقي عند التوصيل: ${pricing.remainingToPay} د.م`)
  return lines
}
