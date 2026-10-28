// Shared types for the store

export interface Category {
  id: string
  slug: string
  name: string
  tagline: string
  description: string
  icon: string
  accentColor: string
}

export interface Product {
  id: string
  slug: string
  name: string
  description: string
  price: number
  productType: 'hoodie' | 'other'
  createdAt: string
  oldPrice: number | null
  image: string
  gallery: string
  video?: string
  categoryId: string
  sizes: string[]
  colors: string[]
  rating: number
  reviewCount: number
  stock: number
  featured: boolean
  badge: string | null
  tags: string[]
  category?: Category
}

export interface CartLine {
  id: string
  productId: string
  name: string
  price: number
  image: string
  size: string
  color: string
  quantity: number
}

export interface ProductFilters {
  category?: string | null
  search?: string | null
  sort?: 'featured' | 'price-low' | 'price-high' | 'rating' | 'newest'
  maxPrice?: number | null
  featuredOnly?: boolean
}

export type View =
  | { kind: 'home' }
  | { kind: 'category'; slug: string }
  | { kind: 'product'; slug: string }
  | { kind: 'search'; query: string }
  | { kind: 'cart' }
  | { kind: 'checkout' }
  | { kind: 'success'; orderId: string }
