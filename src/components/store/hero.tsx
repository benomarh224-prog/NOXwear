'use client'

import { ArrowLeft, Sparkles, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useUI } from '@/lib/ui-store'
import { OptimizedImage } from './optimized-image'
import { BrandLogo } from './brand-logo'

interface HeroProps {
  featuredImage: string
  accentImage: string
  categoryCount: number
  productCount: number
}

export function Hero({ featuredImage, accentImage, categoryCount, productCount }: HeroProps) {
  const setView = useUI((s) => s.setView)

  return (
    <section data-hero-section className="relative overflow-hidden border-b border-border">
      {/* Background gradient + pattern */}
      <div className="absolute inset-0 pattern-arabic" />
      <div className="absolute inset-0 bg-gradient-to-bl from-background via-background to-primary/5" />

      {/* Floating decorative elements */}
      <div className="hero-glow absolute top-1/4 left-1/4 w-64 h-64 rounded-full hero-glow-primary" />
      <div className="hero-glow absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full hero-glow-secondary" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Right side (in LTR) — but with RTL, this is now Left: copy */}
          <div
            data-hero-copy
            className="text-center lg:text-right"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-xs font-medium mb-6">
              <Sparkles className="h-3 w-3 text-gold" />
              <span className="text-gold">مجموعة خريف / شتاء 2026</span>
            </div>

            <div className="mb-6 flex justify-center lg:justify-start">
              <BrandLogo size="hero" />
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[0.95]">
              ارتدِ <br />
              <span className="gradient-text-gold">هويتك</span>
              <span className="text-gold">.</span>
            </h1>

            <p className="mt-6 text-base sm:text-lg text-muted-foreground max-w-lg mx-auto lg:mr-0 lg:ml-auto">
              هوديات ستريت وير، منتجات أنمي، أدوات رياضية أصيلة، وفن عربي مصنوع يدوياً —
              كلها في مكان واحد. مختار لمن يرفضون العادي.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <Button
                size="lg"
                onClick={() => setView({ kind: 'search', query: '' })}
                className="store-cta gradient-gold text-primary-foreground font-semibold shadow-lg shadow-primary/20 hover:opacity-90 group"
              >
                تسوق المنتجات
                <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => setView({ kind: 'category', slug: 'limitless-drops' })}
                className="border-gold/30 hover:border-gold hover:text-gold"
              >
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                  خارج المألوف
                </span>
              </Button>
            </div>

            {/* Stats */}
            <div className="mt-10 grid grid-cols-3 gap-4 max-w-md mx-auto lg:mr-0 lg:ml-auto">
              <Stat value={String(categoryCount)} label="أقسام" />
              <Stat value={String(productCount)} label="منتجات حصرية" />
              <Stat value="4.9★" label="متوسط التقييم" />
            </div>
          </div>

          {/* Image collage */}
          <div
            data-hero-collage
            className="relative mx-auto aspect-[9/10] w-full max-w-[540px]"
          >
            {/* Main image */}
            <div data-hero-main className="absolute top-0 left-0 w-3/4 h-3/4 rounded-2xl overflow-hidden border border-border shadow-2xl shadow-primary/10">
              <OptimizedImage
                src={featuredImage}
                alt="هودي الحصان الأسود بلوغو واسم NOXwear"
                className="object-cover"
                sizes="(max-width: 571px) calc(75vw - 24px), (max-width: 1023px) 405px, (max-width: 1279px) calc(37.5vw - 42px), 405px"
                preload
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/40 to-transparent" />
            </div>

            {/* Accent image */}
            <div data-hero-accent className="absolute bottom-0 right-0 w-1/2 h-1/2 rounded-2xl overflow-hidden border border-gold/30 shadow-2xl shadow-primary/20">
              <OptimizedImage
                src={accentImage}
                alt="هودي ساموراي أسود وأحمر بلوغو واسم NOXwear"
                className="object-cover"
                sizes="(max-width: 571px) calc(50vw - 16px), (max-width: 1023px) 270px, (max-width: 1279px) calc(25vw - 28px), 270px"
                loading="eager"
              />
              <div className="absolute inset-0 bg-gradient-to-tl from-primary/30 to-transparent" />
            </div>

            {/* Floating rating badge */}
            <div
              className="absolute bottom-4 left-0 sm:left-4 glass border border-border rounded-xl p-3 shadow-xl"
            >
              <div className="flex items-center gap-2">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star
                      key={i}
                      className="h-3 w-3 fill-gold text-gold"
                    />
                  ))}
                </div>
                <span className="text-xs font-semibold">4.9 / 5</span>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">
                بناء على +2400 تقييم
              </p>
            </div>

            {/* Floating drops badge */}
            <div
              className="absolute top-4 right-0 sm:right-4 glass border border-gold/30 rounded-xl p-3 shadow-xl"
            >
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                دروب محدود
              </p>
              <p className="text-sm font-bold text-gold">بقية 3 فقط</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="text-2xl sm:text-3xl font-black gradient-text-gold">
        {value}
      </div>
      <div className="text-xs text-muted-foreground mt-1">{label}</div>
    </div>
  )
}
