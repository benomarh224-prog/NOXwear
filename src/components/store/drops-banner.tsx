'use client'

import { ArrowLeft, Clock, Lock } from 'lucide-react'
import { useUI } from '@/lib/ui-store'
import { Button } from '@/components/ui/button'

export function DropsBanner() {
  const setView = useUI((s) => s.setView)

  return (
    <section className="relative overflow-hidden border-b border-border">
      {/* Background */}
      <div className="absolute inset-0 gradient-gold" />
      <div className="absolute inset-0 pattern-arabic opacity-20" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-black/20 backdrop-blur px-3 py-1 text-xs font-medium text-primary-foreground mb-6">
              <Clock className="h-3 w-3" />
              دروب جديد كل خميس 6 مساءً بتوقيت جرينتش
            </div>

            <h2 className="text-4xl sm:text-6xl font-black tracking-tight text-primary-foreground leading-[0.95]">
              ما إن ينفد،<br />
              <span className="italic">ينفد للأبد</span>.
            </h2>

            <p className="mt-6 text-base text-primary-foreground/80 max-w-md">
              إصدارات مرقمة. تفاصيل يدوية. كميات محدودة جداً. الدروب التي تختفي في دقائق. اشترك ليصلك إشعار قبل بدء الدروب.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Button
                size="lg"
                onClick={() => setView({ kind: 'category', slug: 'limitless-drops' })}
                className="bg-black text-white hover:bg-black/90 font-semibold group"
              >
                تسوق خارج المألوف
                <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
              >
                <Lock className="ml-2 h-4 w-4" />
                وصول مبكر
              </Button>
            </div>
          </div>

          {/* Right: stats */}
          <div className="grid grid-cols-2 gap-4">
            <DropStat number="100" label="قطعة لكل دروب" />
            <DropStat number="<60ث" label="متوسط نفاد الوقت" />
            <DropStat number="30" label="مرقمة يدوياً" />
            <DropStat number="24/7" label="عد تنازلي للدروب" />
          </div>
        </div>
      </div>
    </section>
  )
}

function DropStat({ number, label }: { number: string; label: string }) {
  return (
    <div className="rounded-2xl bg-black/20 backdrop-blur border border-primary-foreground/10 p-6">
      <div className="text-4xl sm:text-5xl font-black text-primary-foreground">
        {number}
      </div>
      <div className="text-xs text-primary-foreground/70 mt-2">
        {label}
      </div>
    </div>
  )
}
