'use client'

import { useMemo, useState } from 'react'
import { SlidersHorizontal, ChevronRight, PackageX } from 'lucide-react'
import { useUI } from '@/lib/ui-store'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { ProductCard } from './product-card'
import type { Category, Product } from '@/lib/types'
import { CATEGORY_IMAGES } from '@/lib/category-images'
import { OptimizedImage } from './optimized-image'

interface CategoryViewProps {
  category: Category
  products: Product[]
}

const SORTS = [
  { value: 'featured', label: 'المميز' },
  { value: 'price-low', label: 'السعر: من الأقل للأعلى' },
  { value: 'price-high', label: 'السعر: من الأعلى للأقل' },
  { value: 'rating', label: 'الأعلى تقييماً' },
  { value: 'newest', label: 'الأحدث' },
]

const ACCENTS: Record<string, string> = {
  hoodies: 'from-amber-500/20 to-amber-500/5 text-amber-400',
  anime: 'from-pink-500/20 to-pink-500/5 text-pink-400',
  sports: 'from-emerald-500/20 to-emerald-500/5 text-emerald-400',
  'arabic-art': 'from-yellow-500/20 to-yellow-500/5 text-yellow-400',
  'limitless-drops': 'from-red-500/20 to-red-500/5 text-red-400',
}

export function CategoryView({ category, products: catalogProducts }: CategoryViewProps) {
  const setView = useUI((s) => s.setView)
  const back = useUI((s) => s.back)
  const [sort, setSort] = useState('featured')

  const products = useMemo(() => {
    const nextProducts = catalogProducts.filter((product) => product.categoryId === category.slug)
    switch (sort) {
      case 'price-low':
        return [...nextProducts].sort((a, b) => a.price - b.price)
      case 'price-high':
        return [...nextProducts].sort((a, b) => b.price - a.price)
      case 'rating':
        return [...nextProducts].sort((a, b) => b.rating - a.rating)
      case 'newest':
        return [...nextProducts].reverse()
      default:
        return [...nextProducts].sort(
          (a, b) => Number(b.featured) - Number(a.featured) || b.rating - a.rating,
        )
    }
  }, [catalogProducts, category.slug, sort])

  const accent = ACCENTS[category.slug] || ACCENTS.hoodies

  return (
    <div className="flex-1">
      {/* Hero */}
      <section className={`relative overflow-hidden border-b border-border bg-gradient-to-b ${accent}`}>
        <OptimizedImage
          src={CATEGORY_IMAGES[category.slug] || CATEGORY_IMAGES.hoodies}
          alt=""
          aria-hidden="true"
          className="object-cover object-center"
          sizes="100vw"
          preload
        />
        <div className="absolute inset-0 bg-gradient-to-l from-background/95 via-background/80 to-background/45" />
        <div className="absolute inset-0 bg-gradient-to-t from-background/70 to-transparent" />
        <div className="absolute inset-0 pattern-arabic opacity-20" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16 text-right min-h-[300px] sm:min-h-[360px] flex flex-col items-end justify-center">
          <button
            onClick={back}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-4 transition-colors"
          >
            <ChevronRight className="h-3 w-3" />
            رجوع
          </button>
          <Badge variant="outline" className="mb-3 border-current/30">
            {category.tagline}
          </Badge>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight">
            {category.name}
          </h1>
          <p className="mt-4 text-base text-muted-foreground max-w-2xl mr-0 ml-auto">
            {category.description}
          </p>
          <div className="mt-4 flex items-center gap-3 text-sm text-muted-foreground justify-end">
            <span className="text-gold">يتم التحديث أسبوعياً</span>
            <span className="text-border">|</span>
            <span>{products.length} منتج</span>
          </div>
        </div>
      </section>

      {/* Toolbar */}
      <div className="sticky top-16 z-30 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4 flex-row-reverse">
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="w-[220px] bg-background">
              <SelectValue placeholder="ترتيب حسب" />
            </SelectTrigger>
            <SelectContent>
              {SORTS.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="hidden sm:inline">ترتيب وفلترة</span>
            <SlidersHorizontal className="h-4 w-4" />
          </div>
        </div>
      </div>

      {/* Products */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {products.length === 0 ? (
          <div className="text-center py-16">
            <PackageX className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="font-semibold">لا توجد منتجات</p>
            <p className="text-sm text-muted-foreground mt-1">
              جرب قسماً آخر أو ابحث.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {products.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
