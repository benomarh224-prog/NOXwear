'use client'

import { ArrowLeft, Crown } from 'lucide-react'
import { useUI } from '@/lib/ui-store'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatPrice } from '@/lib/format'
import type { Category, Product } from '@/lib/types'
import { OptimizedImage } from './optimized-image'

interface CategoryHighlightProps {
  categories: Category[]
  // Map of category slug → featured product
  highlights: Record<string, Product>
}

const ACCENTS: Record<string, { gradient: string; text: string; border: string; glow: string }> = {
  hoodies: {
    gradient: 'from-amber-500/20 via-amber-500/5 to-transparent',
    text: 'text-amber-900 dark:text-amber-400',
    border: 'border-amber-500/30',
    glow: 'shadow-amber-500/20',
  },
  anime: {
    gradient: 'from-red-500/20 via-red-500/5 to-transparent',
    text: 'text-red-800 dark:text-red-400',
    border: 'border-red-500/30',
    glow: 'shadow-red-500/20',
  },
  sports: {
    gradient: 'from-emerald-500/20 via-emerald-500/5 to-transparent',
    text: 'text-emerald-800 dark:text-emerald-400',
    border: 'border-emerald-500/30',
    glow: 'shadow-emerald-500/20',
  },
  'arabic-art': {
    gradient: 'from-yellow-500/20 via-yellow-500/5 to-transparent',
    text: 'text-yellow-900 dark:text-yellow-400',
    border: 'border-yellow-500/30',
    glow: 'shadow-yellow-500/20',
  },
  'limitless-drops': {
    gradient: 'from-red-500/20 via-red-500/5 to-transparent',
    text: 'text-red-800 dark:text-red-400',
    border: 'border-red-500/30',
    glow: 'shadow-red-500/20',
  },
}

export function CategoryHighlight({ categories, highlights }: CategoryHighlightProps) {
  const setView = useUI((s) => s.setView)

  // Only categories that have a highlight product
  const items = categories
    .map((cat) => ({ cat, product: highlights[cat.slug] }))
    .filter((x) => x.product)

  if (items.length === 0) return null

  return (
    <section className="py-16 sm:py-24 border-b border-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-3 border-gold/30 text-gold">
            <Crown className="h-3 w-3 ml-1" />
            كارت لكل قسم
          </Badge>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight">
            مختارات من <span className="gradient-text-gold">كل قسم</span>
          </h2>
          <p className="mt-3 text-sm text-muted-foreground max-w-lg mx-auto">
            قطعة مميزة من كل قسم — اختيارنا للأفضل في كل فئة. اضغط للانتقال للمنتج.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map(({ cat, product }) => {
            const accent = ACCENTS[cat.slug] || ACCENTS.hoodies
            const p = product!

            return (
              <div
                key={cat.id}
                role="link"
                tabIndex={0}
                className={`group relative rounded-2xl border border-border overflow-hidden hover:border-gold/40 hover:shadow-2xl ${accent.glow} transition-all cursor-pointer bg-gradient-to-bl ${accent.gradient}`}
                onClick={() => setView({ kind: 'product', slug: p.slug })}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') setView({ kind: 'product', slug: p.slug })
                }}
              >
                <div className="grid grid-cols-[120px_1fr] sm:grid-cols-[140px_1fr] h-44 sm:h-52">
                  {/* Image */}
                  <div className="relative overflow-hidden bg-muted">
                    <OptimizedImage
                      src={p.image}
                      alt={p.name}
                      className="store-image object-cover"
                      sizes="(max-width: 639px) 120px, 140px"
                      loading="lazy"
                    />
                    {p.badge && (
                      <div className="absolute top-2 right-2">
                        <Badge className="bg-primary text-primary-foreground text-[9px] font-bold shadow-md">
                          {p.badge}
                        </Badge>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-4 flex flex-col justify-between text-right">
                    <div>
                      <p className={`text-[10px] uppercase tracking-wider font-bold ${accent.text} mb-1`}>
                        {cat.name}
                      </p>
                      <h3 className="font-bold text-sm sm:text-base leading-tight line-clamp-2 mb-1.5 group-hover:text-gold transition-colors">
                        {p.name}
                      </h3>
                      <p className="text-[11px] text-muted-foreground line-clamp-2 leading-snug">
                        {p.description}
                      </p>
                    </div>

                    <div className="mt-3 flex items-center justify-between flex-row-reverse">
                      <div className="flex items-baseline gap-1.5 flex-row-reverse">
                        {p.oldPrice && (
                          <span className="text-[10px] text-muted-foreground line-through">
                            {formatPrice(p.oldPrice)}
                          </span>
                        )}
                        <span className="font-black text-base gradient-text-gold">
                          {formatPrice(p.price)}
                        </span>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-2 text-[10px] group-hover:border-gold group-hover:text-gold"
                        onClick={(e) => {
                          e.stopPropagation()
                          setView({ kind: 'product', slug: p.slug })
                        }}
                      >
                        التفاصيل
                        <ArrowLeft className="mr-1 h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}

          {/* Bonus CTA card */}
          <div
            role="link"
            tabIndex={0}
            onClick={() => setView({ kind: 'category', slug: 'limitless-drops' })}
            onKeyDown={(event) => {
              if (event.key === 'Enter') setView({ kind: 'category', slug: 'limitless-drops' })
            }}
            className="group relative rounded-2xl border border-gold/30 overflow-hidden gradient-gold cursor-pointer hover:shadow-2xl hover:shadow-primary/30 transition-all"
          >
            <div className="absolute inset-0 pattern-arabic opacity-20" />
            <div className="relative h-44 sm:h-52 p-6 flex flex-col justify-between text-primary-foreground">
              <div>
                <p className="text-[10px] uppercase tracking-wider font-bold opacity-80 mb-1">
                  إصدار محدود
                </p>
                <h3 className="font-black text-xl leading-tight">
                  اكتشف خارج المألوف
                </h3>
                <p className="text-xs opacity-80 mt-2">
                  تصفح كل الإصدارات المحدودة قبل ما تنفد.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs font-bold">
                تسوق الآن
                <ArrowLeft className="h-3 w-3 group-hover:-translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
