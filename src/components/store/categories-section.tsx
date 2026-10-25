'use client'

import {
  Shirt, Sparkles, Trophy, Palette, Flame, ArrowLeft,
} from 'lucide-react'
import { useUI } from '@/lib/ui-store'
import { Badge } from '@/components/ui/badge'
import type { Category } from '@/lib/types'
import { CATEGORY_IMAGES } from '@/lib/category-images'
import { OptimizedImage } from './optimized-image'

const ICONS: Record<string, any> = {
  Shirt,
  Sparkles,
  Trophy,
  Palette,
  Flame,
}

// Background image per category + accent color
const ACCENTS: Record<string, { gradient: string; text: string; border: string }> = {
  hoodies: {
    gradient: 'from-amber-950/90 via-amber-950/60 to-transparent',
    text: 'text-amber-400',
    border: 'border-amber-500/40',
  },
  anime: {
    gradient: 'from-pink-950/90 via-pink-950/60 to-transparent',
    text: 'text-pink-400',
    border: 'border-pink-500/40',
  },
  sports: {
    gradient: 'from-emerald-950/90 via-emerald-950/60 to-transparent',
    text: 'text-emerald-400',
    border: 'border-emerald-500/40',
  },
  'arabic-art': {
    gradient: 'from-yellow-950/90 via-yellow-950/60 to-transparent',
    text: 'text-yellow-400',
    border: 'border-yellow-500/40',
  },
  'limitless-drops': {
    gradient: 'from-red-950/90 via-red-950/60 to-transparent',
    text: 'text-red-400',
    border: 'border-red-500/40',
  },
}

export function CategoriesSection({ categories }: { categories: Category[] }) {
  const setView = useUI((s) => s.setView)

  return (
    <section className="py-16 sm:py-24 border-b border-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
          <div>
            <Badge variant="outline" className="mb-3 border-gold/30 text-gold">
              تصفح حسب القسم
            </Badge>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight">
              خمسة عوالم.<br />
              <span className="gradient-text-gold">هوية واحدة.</span>
            </h2>
          </div>
          <p className="text-sm text-muted-foreground max-w-sm">
            من ستريت وير ثقيل إلى فن عربي مصنوع يدوياً، كل منتج مختار لمن لا يتبعون الموضة بل يصنعونها.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat) => {
            const Icon = ICONS[cat.icon] || Shirt
            const accent = ACCENTS[cat.slug] || ACCENTS.hoodies
            const isHot = cat.slug === 'limitless-drops'

            return (
              <button
                key={cat.id}
                onClick={() => setView({ kind: 'category', slug: cat.slug })}
                className={`group relative text-right rounded-2xl border border-border overflow-hidden hover:${accent.border} transition-all hover:shadow-2xl hover:shadow-primary/10 min-h-[260px] flex flex-col justify-end p-6 sm:p-8 ${
                  cat.slug === 'limitless-drops' ? 'sm:col-span-2 lg:col-span-1' : ''
                }`}
              >
                {/* Background image */}
                <div className="absolute inset-0">
                  <OptimizedImage
                    src={CATEGORY_IMAGES[cat.slug] || CATEGORY_IMAGES.hoodies}
                    alt={cat.name}
                    className="object-cover transition-transform duration-500 md:group-hover:scale-105"
                    sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 33vw"
                    loading="lazy"
                  />
                  {/* Gradient overlay for text readability */}
                  <div className={`absolute inset-0 bg-gradient-to-t ${accent.gradient}`} />
                  {/* Pattern overlay */}
                  <div className="absolute inset-0 pattern-arabic opacity-30" />
                </div>

                {/* Content */}
                <div className="relative">
                  <div className="flex items-start justify-between mb-4 flex-row-reverse">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-black/40 backdrop-blur ${accent.text} border ${accent.border}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    {isHot ? (
                      <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-red-400 bg-black/40 backdrop-blur px-2 py-1 rounded-full">
                        <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                        دروب مباشر
                      </div>
                    ) : (
                      <ArrowLeft className="h-5 w-5 text-white/60 group-hover:text-gold group-hover:-translate-x-1 transition-all" />
                    )}
                  </div>

                  <h3 className="text-3xl font-black mb-1 text-white drop-shadow-lg">
                    {cat.name}
                  </h3>
                  <p className={`text-sm font-medium mb-3 ${accent.text}`}>
                    {cat.tagline}
                  </p>
                  <p className="text-sm text-white/80 line-clamp-2 drop-shadow">
                    {cat.description}
                  </p>
                </div>

                {/* Hover indicator */}
                <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-gold opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all relative">
                  استكشف المجموعة
                  <ArrowLeft className="h-3 w-3" />
                </div>
              </button>
            )
          })}

          {/* Bonus: brand story card (NOXwear) */}
          <div
            className="group relative rounded-2xl border border-gold/30 overflow-hidden gradient-gold min-h-[260px] flex flex-col justify-end p-6 sm:p-8"
          >
            <div className="absolute inset-0 pattern-arabic opacity-20" />
            {/* Crown decoration */}
            <div className="absolute top-6 right-6 text-4xl text-primary-foreground/30">
              ♛
            </div>
            <div className="relative text-primary-foreground">
              <h3 className="text-2xl font-black mb-2">قصتنا</h3>
              <p className="text-sm text-primary-foreground/80 mb-4">
                وُلدت NOXwear في الدار البيضاء — رسالة حب للشوارع التي ربتنا والثقافات التي شكلتنا.
              </p>
              <div className="text-3xl font-black">2018 ← 2026</div>
              <p className="text-xs text-primary-foreground/70 mt-1">
                ثماني سنوات من الثقافة المختارة
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
