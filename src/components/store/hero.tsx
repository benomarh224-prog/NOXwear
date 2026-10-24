'use client'

import { motion } from 'framer-motion'
import { ArrowLeft, Sparkles, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useUI } from '@/lib/ui-store'

interface HeroProps {
  featuredImage: string
  accentImage: string
}

export function Hero({ featuredImage, accentImage }: HeroProps) {
  const setView = useUI((s) => s.setView)

  return (
    <section className="relative overflow-hidden border-b border-border">
      {/* Background gradient + pattern */}
      <div className="absolute inset-0 pattern-arabic" />
      <div className="absolute inset-0 bg-gradient-to-bl from-background via-background to-primary/5" />

      {/* Floating decorative elements */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-primary/10 blur-3xl animate-float" />
      <div className="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full bg-primary/5 blur-3xl animate-float" style={{ animationDelay: '2s' }} />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Right side (in LTR) — but with RTL, this is now Left: copy */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center lg:text-right"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-xs font-medium mb-6">
              <Sparkles className="h-3 w-3 text-gold" />
              <span className="text-gold">مجموعة خريف / شتاء 2026</span>
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
                onClick={() => setView({ kind: 'category', slug: 'hoodies' })}
                className="gradient-gold text-primary-foreground font-semibold shadow-lg shadow-primary/20 hover:opacity-90 group"
              >
                تسوق المجموعة
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
                  دروب محدودة
                </span>
              </Button>
            </div>

            {/* Stats */}
            <div className="mt-10 grid grid-cols-3 gap-4 max-w-md mx-auto lg:mr-0 lg:ml-auto">
              <Stat value="5" label="أقسام" />
              <Stat value="7" label="منتجات حصرية" />
              <Stat value="4.9★" label="متوسط التقييم" />
            </div>
          </motion.div>

          {/* Image collage */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative h-[400px] sm:h-[500px] lg:h-[600px]"
          >
            {/* Main image */}
            <div className="absolute top-0 left-0 w-3/4 h-3/4 rounded-2xl overflow-hidden border border-border shadow-2xl shadow-primary/10">
              <img
                src={featuredImage}
                alt="المنتج المميز"
                className="w-full h-full object-cover"
                loading="eager"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/40 to-transparent" />
            </div>

            {/* Accent image */}
            <div className="absolute bottom-0 right-0 w-1/2 h-1/2 rounded-2xl overflow-hidden border border-gold/30 shadow-2xl shadow-primary/20">
              <img
                src={accentImage}
                alt="منتج إضافي"
                className="w-full h-full object-cover"
                loading="eager"
              />
              <div className="absolute inset-0 bg-gradient-to-tl from-primary/30 to-transparent" />
            </div>

            {/* Floating rating badge */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="absolute top-1/2 right-0 sm:right-4 glass border border-border rounded-xl p-3 shadow-xl"
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
            </motion.div>

            {/* Floating drops badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1 }}
              className="absolute bottom-4 left-4 glass border border-gold/30 rounded-xl p-3 shadow-xl"
            >
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                دروب محدود
              </p>
              <p className="text-sm font-bold text-gold">بقية 3 فقط</p>
            </motion.div>
          </motion.div>
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
