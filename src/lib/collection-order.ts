interface OrderedProduct { createdAt: string; sortOrder?: number | null }

// Unarranged arrivals start at the top; saving the collection gives every
// existing item an explicit position. Editing an item never changes its rank.
export function compareCollectionOrder(a: OrderedProduct, b: OrderedProduct) {
  return (a.sortOrder ?? -1) - (b.sortOrder ?? -1) || b.createdAt.localeCompare(a.createdAt)
}
