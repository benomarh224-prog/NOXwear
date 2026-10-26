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
}

export function ProductCard({ product, index = 0 }: ProductCardProps) {
  const setView = useUI((s) => s.setView)
  const addItem = useCart((s) => s.addItem)

  const discount = product.oldPrice
    ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
    : 0

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
        className="store-card h-full group relative flex flex-col rounded-xl border border-border bg-card overflow-hidden hover:border-gold/40 hover:shadow-xl hover:shadow-primary/5 transition-all cursor-pointer"
        onClick={goToProduct}
        onKeyDown={(event) => {
          if (event.key === 'Enter') goToProduct()
        }}
      >
        {/* Image */}
        <div className="relative aspect-square overflow-hidden bg-muted">
          <OptimizedImage
            src={product.image}
            alt={product.name}
            className="object-cover transition-transform duration-300 md:group-hover:scale-105"
            sizes="(max-width: 1023px) 50vw, 25vw"
            loading="lazy"
          />

          {/* Top badges */}
          <div className="absolute top-3 right-3 flex flex-col gap-1.5 items-end">
            {product.badge && (
              <Badge className="bg-primary text-primary-foreground text-[10px] font-bold shadow-md">
                {product.badge}
              </Badge>
            )}
            {discount > 0 && (
              <Badge className="bg-red-500 text-white text-[10px] font-bold shadow-md">
                -{discount}%
              </Badge>
            )}
          </div>

          {/* Wishlist button */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              toast('أضيف للمفضلة', { description: product.name })
            }}
            className="absolute top-3 left-3 h-8 w-8 rounded-full glass border border-border flex items-center justify-center hover:border-gold hover:text-gold transition-colors"
            aria-label="أضف للمفضلة"
          >
            <Heart className="h-4 w-4" />
          </button>

          {/* Quick actions overlay */}
          <div className="absolute inset-x-0 bottom-0 p-3 translate-y-0 md:translate-y-full md:group-hover:translate-y-0 md:group-focus-within:translate-y-0 transition-transform duration-300">
            <div className="flex gap-2 flex-row-reverse">
              <Button
                size="sm"
                variant="secondary"
                className="flex-1 bg-background/95 backdrop-blur"
                onClick={(e) => {
                  e.stopPropagation()
                  goToProduct()
                }}
              >
                <Eye className="h-4 w-4 ml-1" />
                عرض سريع
              </Button>
              <Button
                size="sm"
                onClick={handleQuickAdd}
                disabled={product.stock <= 0}
                className="gradient-gold text-primary-foreground"
                aria-label="أضف للسلة"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col flex-1 p-4">
          <div className="flex items-center gap-1 mb-1.5 flex-row-reverse justify-end">
            <span className="text-xs text-muted-foreground">
              {product.rating} ({product.reviewCount})
            </span>
            <div className="flex">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star
                  key={i}
                  className={`h-3 w-3 ${
                    i <= Math.round(product.rating)
                      ? 'fill-gold text-gold'
                      : 'text-muted-foreground/30'
                  }`}
                />
              ))}
            </div>
          </div>

          <h3 className="font-semibold text-sm leading-tight line-clamp-2 mb-1 group-hover:text-gold transition-colors">
            {product.name}
          </h3>

          <p className="text-xs text-muted-foreground line-clamp-2 mb-3 flex-1">
            {product.description}
          </p>

          {lowStock && (
            <Badge className="mb-3 max-w-full self-start whitespace-normal bg-amber-500/90 text-amber-950 text-[10px] font-bold">
              {product.stock} فقط متبقي
            </Badge>
          )}

          <div className="flex items-end justify-between flex-row-reverse">
            <div className="text-left">
              <div className="flex items-baseline gap-2 flex-row-reverse">
                {product.oldPrice && (
                  <span className="text-xs text-muted-foreground line-through">
                    {formatPrice(product.oldPrice)}
                  </span>
                )}
                <span className="font-black text-lg">{formatPrice(product.price)}</span>
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5 text-right">
                {product.colors[0]}
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handleQuickAdd}
              className="h-8 px-3 hover:border-gold hover:text-gold text-xs"
            >
              أضف
            </Button>
          </div>
        </div>
      </div>
    </Reveal>
  )
}
