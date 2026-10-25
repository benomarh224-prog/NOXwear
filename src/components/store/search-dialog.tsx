'use client'

import { useMemo, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Search, X } from 'lucide-react'
import { useUI } from '@/lib/ui-store'
import { formatPrice } from '@/lib/format'
import type { Product } from '@/lib/types'
import { OptimizedImage } from './optimized-image'

export function SearchDialog({ products }: { products: Product[] }) {
  const { searchOpen, setSearchOpen, setView } = useUI()
  const [query, setQuery] = useState('')
  const results = useMemo(() => {
    const normalizedQuery = query.trim().normalize('NFKC').toLocaleLowerCase()
    if (!normalizedQuery) return []
    return products.filter((product) =>
      [product.name, product.description, ...product.tags]
        .join(' ')
        .normalize('NFKC')
        .toLocaleLowerCase()
        .includes(normalizedQuery),
    ).slice(0, 8)
  }, [products, query])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return
    setSearchOpen(false)
    setView({ kind: 'search', query: query.trim() })
  }

  const pickProduct = (slug: string) => {
    setSearchOpen(false)
    setQuery('')
    setView({ kind: 'product', slug })
  }

  return (
    <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
      <DialogContent className="sm:max-w-2xl p-0 gap-0">
        <DialogHeader className="px-5 py-4 border-b border-border">
          <DialogTitle className="text-sm font-semibold flex items-center gap-2">
            <Search className="h-4 w-4 text-gold" />
            ابحث عن منتج
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="p-4 border-b border-border">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              autoFocus
              type="text"
              placeholder="جرب: هودي، خط، قميص..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pr-10 pl-10 bg-background text-right"
              dir="rtl"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </form>

        <div className="max-h-80 overflow-y-auto scrollbar-thin">
          {query && results.length === 0 && (
            <div className="p-8 text-center text-sm text-muted-foreground">
              لا توجد منتجات لـ &quot;{query}&quot;
            </div>
          )}
          {results.length > 0 && (
            <ul className="divide-y divide-border">
              {results.map((p) => (
                <li key={p.id}>
                  <button
                    onClick={() => pickProduct(p.slug)}
                    className="w-full flex items-center gap-3 p-3 hover:bg-accent/30 transition-colors text-right flex-row-reverse"
                  >
                    <div className="relative h-14 w-14 rounded-md overflow-hidden bg-muted shrink-0">
                      <OptimizedImage src={p.image} alt={p.name} className="object-cover" sizes="56px" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{p.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {p.description}
                      </p>
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-black">{formatPrice(p.price)}</p>
                      {p.badge && (
                        <p className="text-[10px] text-gold font-bold">
                          {p.badge}
                        </p>
                      )}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {!query && (
            <div className="p-8 text-center">
              <p className="text-xs text-muted-foreground mb-3">عمليات بحث شائعة</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {['هودي', 'خط', 'قميص', 'figure', 'محدود', 'فسيفساء'].map((q) => (
                  <button
                    key={q}
                    onClick={() => setQuery(q)}
                    className="px-3 py-1.5 text-xs rounded-full border border-border hover:border-gold hover:text-gold transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="px-4 py-3 border-t border-border flex justify-between items-center">
          <button
            type="submit"
            disabled={!query.trim()}
            className="text-xs font-semibold text-gold hover:underline disabled:opacity-50"
          >
            ← عرض كل النتائج
          </button>
          <p className="text-[10px] text-muted-foreground">
            اضغط <kbd className="px-1.5 py-0.5 rounded border border-border text-[10px]">Enter</kbd> لعرض كل النتائج
          </p>
        </form>
      </DialogContent>
    </Dialog>
  )
}
