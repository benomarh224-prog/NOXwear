// Currency formatting in Moroccan Dirham (DH / درهم)

export function formatPrice(amount: number): string {
  // Round to nearest integer for display, add DH suffix
  const rounded = Math.round(amount)
  return `${rounded.toLocaleString('ar-MA')} د.م`
}

export function formatPriceShort(amount: number): string {
  // Short version without the suffix, for compact UI
  return Math.round(amount).toLocaleString('ar-MA')
}

// Shipping policy:
// - Morocco: FREE for ALL cities, ALL order amounts (no minimum, no fee)
// - International: FREE if order >= 250 DH (minimum cart to checkout), else 30 DH
// - Advance deposit (تسبيق): 50 DH flat, paid via WhatsApp at confirmation
export const SHIPPING_FEE_INTERNATIONAL = 30
export const FREE_SHIPPING_THRESHOLD_INTL = 250
export const ADVANCE_DEPOSIT = 50

// Compute shipping based on country and subtotal
export function computeShipping(country: string, subtotal: number): number {
  if (country === 'المغرب' || country === 'Morocco') {
    // Free shipping for ALL Moroccan cities, no minimum
    return 0
  }
  // International: free if order >= 250 DH
  return subtotal >= FREE_SHIPPING_THRESHOLD_INTL ? 0 : SHIPPING_FEE_INTERNATIONAL
}

// Check if order qualifies for international shipping (min 250 DH cart)
export function meetsMinimumOrder(country: string, subtotal: number): boolean {
  if (country === 'المغرب' || country === 'Morocco') {
    return true // no minimum for Morocco
  }
  return subtotal >= FREE_SHIPPING_THRESHOLD_INTL
}
