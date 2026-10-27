export type View =
  | { kind: 'home' }
  | { kind: 'category'; slug: string }
  | { kind: 'product'; slug: string }
  | { kind: 'search'; query: string }
  | { kind: 'checkout' }
  | { kind: 'custom-print' }
  | { kind: 'success'; orderId: string; total: number; whatsappUrl: string }

export type BrowsingView = Extract<View, { kind: 'home' | 'category' }>

export function viewFromParams(params: URLSearchParams, saved?: View): View {
  const collection = params.get('collection')
  const product = params.get('product')
  if (collection) return { kind: 'category', slug: collection }
  if (product) return { kind: 'product', slug: product }
  if (params.has('search')) return { kind: 'search', query: params.get('search') || '' }
  if (params.has('custom')) return { kind: 'custom-print' }
  if (params.has('checkout')) return { kind: 'checkout' }
  if (params.has('success') && saved?.kind === 'success') return saved
  return { kind: 'home' }
}

export function viewKey(view: View) {
  if (view.kind === 'category' || view.kind === 'product') return view.kind + ':' + view.slug
  if (view.kind === 'search') return 'search:' + view.query
  return view.kind
}

export function isBrowsingView(view: View): view is BrowsingView {
  return view.kind === 'home' || view.kind === 'category'
}
