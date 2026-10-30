'use client'

import { Star, Plus, Heart, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useUI } from '@/lib/ui-store'
import { useCart } from '@/lib/store'
import { trackStoreEvent } from '@/lib/analytics-client'
import { formatPrice } from '@/lib/format'
import { toast } from 'sonner'
import type { Product } from '@/lib/types'
import { OptimizedImage } from './optimized-image'
import { Reveal } from './reveal'

interface ProductCardProps {
  product: Product
  index?: number
  eager?: boolean
}

export function ProductCard({ product, index = 0, eager = false }: ProductCardProps) {
  const setView = useUI((s) => s.setView)
  const addItem = useCart((s) => s.addItem)

  const originalPrice = product.oldPrice
  const hasDiscount = typeof originalPrice === 'number' && originalPrice > product.price
  const discount = hasDiscount ? Math.round(((originalPrice - product.price) / originalPrice) * 100) : 0

  const lowStock = product.stock <= 10 && product.stock > 0

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (product.stock <= 0) return
    addItem({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      price: product.price,
      productType: product.productType,
      image: product.image,
      size: product.sizes[0] || 'مقاس واحد',
      color: product.colors[0] || 'افتراضي',
    })
    trackStoreEvent('add_to_cart', '/product/' + product.slug)
    toast.success('أضيف للسلة', { description: product.name })
  }

  const goToProduct = () => setView({ kind: 'product', slug: product.slug })

  return (
    <Reveal delay={(index % 4) * 60} className="h-full min-w-0">
      <div
        role="link"
        tabIndex={0}
        className="store-card h-full group relative flex flex-col rounded-xl border border-border bg-card overflow-hidden hover:border-gold/40 hover:shadow-xl hover:shadow-primary/5 transition-colors cursor-pointer"
        onClick={goToProduct}
        onKeyDown={(event) => {
          if (event.target === event.currentTarget && event.key === 'Enter') goToProduct()
        }}
      >
        {/* Image */}
        <div className="relative aspect-square overflow-hidden bg-muted">
          <OptimizedImage
            src={product.image}
            alt={product.name}
            className="store-image object-cover"
            sizes="(max-width: 639px) calc(50vw - 22px), (max-width: 1023px) calc(50vw - 32px), (max-width: 1279px) calc(25vw - 28px), 284px"
            loading={eager ? 'eager' : 'lazy'}
          />

          {/* Top badges */}
          <div className="absolute top-2 right-2 flex max-w-[calc(100%_-_52px)] flex-col items-end gap-1.5 sm:top-3 sm:right-3" dir="ltr">
            {discount > 0 && (
              <Badge data-discount-badge dir="ltr" aria-label={'تخفيض ' + discount + ' بالمئة'} className="h-6 min-w-12 rounded-md border-0 bg-red-700 px-2.5 py-0 text-[11px] font-bold leading-none tabular-nums text-white">
                -{discount}%
              </Badge>
            )}
            {product.badge && (
              <Badge dir="auto" className="max-w-full bg-primary text-primary-foreground text-[10px] font-bold">
                <span className="truncate">{product.badge}</span>
              </Badge>
            )}
          </div>

          {/* Wishlist button */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              toast('أضيف للمفضلة', { description: product.name })
            }}
            className="absolute top-2 left-2 h-8 w-8 sm:top-3 sm:left-3 rounded-full glass border border-border flex items-center justify-center hover:border-gold hover:text-gold transition-colors"
            aria-label="أضف للمفضلة"
          >
            <Heart className="h-4 w-4" />
          </button>

          {/* Quick actions overlay */}
          <div className="store-quick-actions absolute inset-x-0 bottom-0 p-2 sm:p-3">
            <div className="flex gap-1.5 flex-row-reverse">
              <Button
                size="sm"
                variant="secondary"
                className="min-w-0 flex-1 gap-1 bg-background/95 px-1.5 text-[11px] backdrop-blur has-[>svg]:px-1.5 sm:text-xs"
                onClick={(e) => {
                  e.stopPropagation()
                  goToProduct()
                }}
              >
                <Eye className="h-3.5 w-3.5" />
                عرض سريع
              </Button>
              <Button
                size="sm"
                onClick={handleQuickAdd}
                disabled={product.stock <= 0}
                className="h-8 w-8 shrink-0 gradient-gold px-0 text-primary-foreground has-[>svg]:px-0 sm:w-9"
                aria-label="أضف للسلة"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Keep each text slot bounded; long descriptions must not stretch cards. */}
        <div className="flex min-w-0 flex-1 flex-col p-3 sm:p-4" dir="rtl">
          <div className="mb-2 flex h-4 shrink-0 items-center gap-1.5 overflow-hidden text-[10px] text-muted-foreground sm:text-xs">
            <div className="flex shrink-0" aria-hidden="true">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} className={'h-2.5 w-2.5 sm:h-3 sm:w-3 ' + (i <= Math.round(product.rating) ? 'fill-gold text-gold' : 'text-muted-foreground/30')} />
              ))}
            </div>
            <span className="whitespace-nowrap">{product.rating} ({product.reviewCount})</span>
          </div>

          <h3 data-card-title className="h-10 shrink-0 overflow-hidden text-right text-sm font-semibold leading-5 line-clamp-2 group-hover:text-gold transition-colors" dir="auto">
            {product.name}
          </h3>
          <p data-card-description className="mt-1 h-9 shrink-0 overflow-hidden text-right text-xs leading-[18px] text-muted-foreground line-clamp-2" dir="auto">
            {product.description}
          </p>

          <div className="mt-2 min-h-6 shrink-0">
            {lowStock && <Badge className="max-w-full whitespace-nowrap bg-amber-500/90 text-amber-950 text-[10px] font-bold">{product.stock} فقط متبقي</Badge>}
          </div>

          {/* Prices use the full card width, above the independent action row. */}
          <div data-card-footer className="mt-auto min-w-0 pt-2">
            <div data-card-price className="flex min-w-0 flex-col items-start gap-0.5 tabular-nums">
              <div className="flex h-4 items-center">
                {hasDiscount && <del data-card-old-price className="whitespace-nowrap text-xs leading-4 text-muted-foreground"><span className="sr-only">الثمن قبل التخفيض: </span><bdi>{formatPrice(originalPrice)}</bdi></del>}
              </div>
              <span className="whitespace-nowrap text-base font-black leading-6 sm:text-lg"><span className="sr-only">الثمن الحالي: </span><bdi>{formatPrice(product.price)}</bdi></span>
            </div>
            <div className="mt-2 flex min-w-0 items-center justify-between gap-2">
              <span className="min-w-0 truncate text-xs text-muted-foreground">{product.colors[0]}</span>
              <Button size="sm" variant="outline" onClick={handleQuickAdd} disabled={product.stock <= 0} className="h-9 shrink-0 px-3 text-xs hover:border-gold hover:text-gold">أضف</Button>
            </div>
          </div>
        </div>
      </div>
    </Reveal>
  )
}
