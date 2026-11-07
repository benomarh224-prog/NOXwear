'use client'

import { ArrowLeft } from 'lucide-react'
import { useUI } from '@/lib/ui-store'
import { Button } from '@/components/ui/button'

export function DropsBanner() {
  const setView = useUI((s) => s.setView)

  return (
    <section id="drops-banner" className="border-b border-border gradient-gold">
      <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-10 lg:px-8">
        <div className="text-primary-foreground">
          <h2 className="text-2xl font-black sm:text-3xl">خارج المألوف. على طريقتك.</h2>
          <p className="mt-2 text-sm leading-relaxed">تصاميم مختلفة كتكمل الستايل ديالك.</p>
        </div>
        <Button
          size="lg"
          onClick={() => setView({ kind: 'category', slug: 'limitless-drops' })}
          className="shrink-0 bg-black text-white hover:bg-black/90 font-semibold"
        >
          تسوق خارج المألوف <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    </section>
  )
}
