'use client'

import { ArrowLeft, Flame } from 'lucide-react'
import { useUI } from '@/lib/ui-store'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ProductCard } from './product-card'
import { Reveal } from './reveal'
import type { Product } from '@/lib/types'

export function FeaturedProducts({ products }: { products: Product[] }) {
  const setView = useUI((s) => s.setView)

  if (!products.length) return null

  return (
    <section className="py-16 sm:py-24 border-b border-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <Badge variant="outline" className="mb-3 border-gold/30 text-gold">
              <Flame className="h-3 w-3 ml-1" />
              مختار بعناية لك
            </Badge>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight">
              المنتجات <span className="gradient-text-gold">المميزة</span>
            </h2>
            <p className="text-sm text-muted-foreground mt-3 max-w-md">
              أفضل اختيارات محررينا من مختلف الأقسام — يتم تحديثها أسبوعياً.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => setView({ kind: 'search', query: '' })}
            className="group self-start sm:self-end"
          >
            عرض جميع المنتجات
            <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          </Button>
        </Reveal>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {products.slice(0, 8).map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}
