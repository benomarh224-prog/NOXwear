'use client'

import { useMemo } from 'react'
import { Search, ChevronRight, PackageX } from 'lucide-react'
import { useUI } from '@/lib/ui-store'
import { Badge } from '@/components/ui/badge'
import { ProductCard } from './product-card'
import type { Product } from '@/lib/types'

interface SearchViewProps {
  query: string
  products: Product[]
}

export function SearchView({ query, products: catalogProducts }: SearchViewProps) {
  const back = useUI((s) => s.back)
  const products = useMemo(() => {
    const normalizedQuery = query.trim().normalize('NFKC').toLocaleLowerCase()
    return catalogProducts.filter((product) =>
      [product.name, product.description, ...product.tags]
        .join(' ')
        .normalize('NFKC')
        .toLocaleLowerCase()
        .includes(normalizedQuery),
    )
  }, [catalogProducts, query])

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
            {query.trim() ? 'نتائج البحث' : 'المتجر'}
          </Badge>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight">
            {query.trim() ? <> &quot;{query}&quot; </> : 'جميع المنتجات'}
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            {products.length} نتيجة
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {products.length === 0 ? (
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
              <ProductCard key={p.id} product={p} index={i} eager={i < 4} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
