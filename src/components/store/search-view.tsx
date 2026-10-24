'use client'

import { useState, useEffect } from 'react'
import { Search, Loader2, ChevronRight, PackageX } from 'lucide-react'
import { useUI } from '@/lib/ui-store'
import { Badge } from '@/components/ui/badge'
import { ProductCard } from './product-card'
import type { Product } from '@/lib/types'

interface SearchViewProps {
  query: string
}

export function SearchView({ query }: SearchViewProps) {
  const back = useUI((s) => s.back)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    fetch(`/api/products?search=${encodeURIComponent(query)}`)
      .then((r) => r.json())
      .then((data) => mounted && setProducts(data.products || []))
      .finally(() => mounted && setLoading(false))
    return () => {
      mounted = false
    }
  }, [query])

  return (
    <div className="flex-1">
      <section className="border-b border-border bg-gradient-to-b from-primary/5 to-transparent">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 text-right">
          <button
            onClick={back}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-4 transition-colors"
          >
            <ChevronRight className="h-3 w-3" />
            رجوع
          </button>
          <Badge variant="outline" className="mb-3 border-gold/30 text-gold">
            <Search className="h-3 w-3 ml-1" />
            نتائج البحث
          </Badge>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight">
            &quot;{query}&quot;
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            {loading ? 'جاري البحث...' : `${products.length} نتيجة`}
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="aspect-square bg-muted shimmer" />
                <div className="p-4 space-y-2">
                  <div className="h-3 bg-muted rounded shimmer w-1/3" />
                  <div className="h-4 bg-muted rounded shimmer w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16">
            <PackageX className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="font-semibold">لا توجد منتجات</p>
            <p className="text-sm text-muted-foreground mt-1">
              جرب كلمة بحث أخرى أو تصفح أقسامنا.
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
