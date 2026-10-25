'use client'

import { Search, ShoppingBag, Menu, Flame, X } from 'lucide-react'
import { useCart } from '@/lib/store'
import { useUI } from '@/lib/ui-store'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useState } from 'react'
import { BrandLogo } from './brand-logo'

const NAV = [
  { slug: 'anime', label: 'أنمي' },
  { slug: 'sports', label: 'عالم الشغف' },
  { slug: 'arabic-art', label: 'حبر ومعنى' },
  { slug: 'limitless-drops', label: 'خارج المألوف', hot: true },
]

export function Header() {
  const count = useCart((s) => s.count())
  const setOpen = useCart((s) => s.setOpen)
  const setView = useUI((s) => s.setView)
  const setSearchOpen = useUI((s) => s.setSearchOpen)
  const [mobileOpen, setMobileOpen] = useState(false)
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/40 glass">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-2 sm:gap-4 px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <button
          onClick={() => setView({ kind: 'home' })}
          className="flex min-h-11 items-center group shrink-0"
          aria-label="العودة إلى الصفحة الرئيسية"
        >
          <BrandLogo showTagline className="transition-opacity group-hover:opacity-80" />
        </button>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV.map((item) => (
            <button
              key={item.slug}
              onClick={() => setView({ kind: 'category', slug: item.slug })}
              className="relative px-3 py-2 text-sm font-medium hover:text-primary transition-colors group"
            >
              <span className="flex items-center gap-1.5">
                {item.label}
                {item.hot && (
                  <Flame className="h-3 w-3 text-red-500 animate-pulse" />
                )}
              </span>
              <span className="absolute bottom-0 left-3 right-3 h-px bg-gold scale-x-0 group-hover:scale-x-100 transition-transform" />
            </button>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSearchOpen(true)}
            aria-label="بحث"
          >
            <Search className="h-5 w-5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setOpen(true)}
            aria-label="السلة"
            className="relative"
          >
            <ShoppingBag className="h-5 w-5" />
            {count > 0 && (
              <Badge className="absolute -top-1 -left-1 h-5 min-w-5 px-1 rounded-full gradient-gold text-primary-foreground text-[10px] font-bold border-2 border-background">
                {count}
              </Badge>
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="القائمة"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Nav */}
      {mobileOpen && (
        <nav className="md:hidden border-t border-border/40 bg-card">
          <div className="flex flex-col p-2">
            {NAV.map((item) => (
              <button
                key={item.slug}
                onClick={() => {
                  setView({ kind: 'category', slug: item.slug })
                  setMobileOpen(false)
                }}
                className="flex items-center justify-between px-3 py-3 text-sm font-medium rounded-md hover:bg-accent transition-colors"
              >
                <span className="flex items-center gap-2">
                  {item.label}
                  {item.hot && <Flame className="h-3 w-3 text-red-500" />}
                </span>
              </button>
            ))}
          </div>
        </nav>
      )}
    </header>
  )
}
