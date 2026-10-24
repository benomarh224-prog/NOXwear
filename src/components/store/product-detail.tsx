'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Star, Heart, ShoppingBag, Minus, Plus, ChevronLeft, ChevronRight,
  Truck, Shield, RefreshCw, Loader2,
} from 'lucide-react'
import { useUI } from '@/lib/ui-store'
import { useCart } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { formatPrice } from '@/lib/format'
import { ProductCard } from './product-card'
import type { Product } from '@/lib/types'

interface ProductDetailProps {
  slug: string
}

export function ProductDetail({ slug }: ProductDetailProps) {
  const back = useUI((s) => s.back)
  const setView = useUI((s) => s.setView)
  const addItem = useCart((s) => s.addItem)
  const [product, setProduct] = useState<Product | null>(null)
  const [related, setRelated] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSize, setSelectedSize] = useState<string>('')
  const [selectedColor, setSelectedColor] = useState<string>('')
  const [quantity, setQuantity] = useState(1)
  const [wishlist, setWishlist] = useState(false)

  useEffect(() => {
    let mounted = true
    fetch(`/api/products/${slug}`)
      .then((r) => r.json())
      .then((data) => {
        if (!mounted) return
        if (data.product) {
          setProduct(data.product)
          setSelectedSize(data.product.sizes[0] || '')
          setSelectedColor(data.product.colors[0] || '')
          setRelated(data.related || [])
        }
      })
      .finally(() => mounted && setLoading(false))
    return () => {
      mounted = false
    }
  }, [slug])

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid lg:grid-cols-2 gap-12">
          <div className="aspect-square rounded-2xl bg-muted shimmer" />
          <div className="space-y-4">
            <div className="h-4 bg-muted rounded shimmer w-1/3" />
            <div className="h-8 bg-muted rounded shimmer w-2/3" />
            <div className="h-6 bg-muted rounded shimmer w-1/4" />
            <div className="h-20 bg-muted rounded shimmer w-full" />
            <div className="h-12 bg-muted rounded shimmer w-1/2" />
          </div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 text-center">
        <p className="font-semibold">المنتج غير موجود</p>
        <Button onClick={back} className="mt-4">رجوع</Button>
      </div>
    )
  }

  const discount = product.oldPrice
    ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
    : 0

  const handleAddToCart = () => {
    addItem({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      price: product.price,
      image: product.image,
      size: selectedSize,
      color: selectedColor,
      quantity,
    })
    toast.success('أضيف للسلة', {
      description: `${quantity} × ${product.name} (${selectedSize}، ${selectedColor})`,
    })
  }

  return (
    <div className="flex-1">
      {/* Breadcrumb */}
      <div className="border-b border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-2 text-xs flex-row-reverse justify-end">
          <span className="text-foreground font-medium truncate">{product.name}</span>
          <ChevronLeft className="h-3 w-3 text-muted-foreground" />
          <button
            onClick={() => product.category && setView({ kind: 'category', slug: product.category.slug })}
            className="text-muted-foreground hover:text-foreground"
          >
            {product.category?.name}
          </button>
          <ChevronLeft className="h-3 w-3 text-muted-foreground" />
          <button onClick={() => setView({ kind: 'home' })} className="text-muted-foreground hover:text-foreground">
            الرئيسية
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <button
          onClick={back}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ChevronRight className="h-3 w-3" />
          رجوع
        </button>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="relative"
          >
            <div className="relative aspect-square rounded-2xl overflow-hidden border border-border bg-muted">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover"
              />
              {/* Badges */}
              <div className="absolute top-4 right-4 flex flex-col gap-2 items-end">
                {product.badge && (
                  <Badge className="bg-primary text-primary-foreground font-bold">
                    {product.badge}
                  </Badge>
                )}
                {discount > 0 && (
                  <Badge className="bg-red-500 text-white font-bold">
                    -{discount}%
                  </Badge>
                )}
              </div>
              <button
                onClick={() => setWishlist(!wishlist)}
                className="absolute top-4 left-4 h-10 w-10 rounded-full glass border border-border flex items-center justify-center hover:border-gold transition-colors"
                aria-label="المفضلة"
              >
                <Heart className={`h-5 w-5 ${wishlist ? 'fill-red-500 text-red-500' : ''}`} />
              </button>
            </div>

            {/* Perks */}
            <div className="mt-4 grid grid-cols-3 gap-2">
              <Perk icon={Truck} label="توصيل مجاني لكل المغرب" />
              <Perk icon={Shield} label="أصلي مضمون" />
              <Perk icon={RefreshCw} label="إرجاع 30 يوم" />
            </div>
          </motion.div>

          {/* Info */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="flex flex-col text-right"
          >
            {/* Rating */}
            <div className="flex items-center gap-2 mb-2 flex-row-reverse justify-end">
              <span className="text-xs text-muted-foreground">
                ({product.reviewCount} تقييم)
              </span>
              <span className="text-sm font-semibold">{product.rating}</span>
              <div className="flex">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i <= Math.round(product.rating)
                        ? 'fill-gold text-gold'
                        : 'text-muted-foreground/30'
                    }`}
                  />
                ))}
              </div>
            </div>

            <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
              {product.name}
            </h1>

            <div className="mt-4 flex items-baseline gap-3 flex-row-reverse justify-end">
              {discount > 0 && (
                <Badge className="bg-red-500/20 text-red-400 border border-red-500/30">
                  وفّر {formatPrice(product.oldPrice! - product.price)}
                </Badge>
              )}
              {product.oldPrice && (
                <span className="text-lg text-muted-foreground line-through">
                  {formatPrice(product.oldPrice)}
                </span>
              )}
              <span className="text-3xl font-black">{formatPrice(product.price)}</span>
            </div>

            <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
              {product.description}
            </p>

            <Separator className="my-6" />

            {/* Color */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-2 flex-row-reverse">
                <span className="text-xs text-muted-foreground">{selectedColor}</span>
                <label className="text-sm font-semibold">اللون</label>
              </div>
              <div className="flex flex-wrap gap-2 flex-row-reverse justify-end">
                {product.colors.map((c) => (
                  <button
                    key={c}
                    onClick={() => setSelectedColor(c)}
                    className={`px-3 py-2 text-xs rounded-md border transition-all ${
                      selectedColor === c
                        ? 'border-gold bg-gold/10 text-gold'
                        : 'border-border hover:border-foreground/50'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Size */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-2 flex-row-reverse">
                <button className="text-xs text-muted-foreground hover:text-gold transition-colors">
                  ← دليل المقاسات
                </button>
                <label className="text-sm font-semibold">المقاس</label>
              </div>
              <div className="flex flex-wrap gap-2 flex-row-reverse justify-end">
                {product.sizes.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSelectedSize(s)}
                    className={`min-w-12 px-3 py-2 text-xs font-semibold rounded-md border transition-all ${
                      selectedSize === s
                        ? 'border-gold bg-gold/10 text-gold'
                        : 'border-border hover:border-foreground/50'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity + Add to cart */}
            <div className="flex items-center gap-3 mb-4 flex-row-reverse justify-end">
              <Button
                onClick={handleAddToCart}
                size="lg"
                className="flex-1 gradient-gold text-primary-foreground font-semibold group"
              >
                <ShoppingBag className="ml-2 h-5 w-5" />
                أضف للسلة — {formatPrice(product.price * quantity)}
              </Button>
              <div className="flex items-center border border-border rounded-md">
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="h-11 w-11 flex items-center justify-center hover:bg-accent transition-colors"
                  aria-label="زيادة"
                >
                  <Plus className="h-4 w-4" />
                </button>
                <span className="text-sm font-semibold w-12 text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="h-11 w-11 flex items-center justify-center hover:bg-accent transition-colors"
                  aria-label="إنقاص"
                >
                  <Minus className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Stock indicator */}
            <div className="flex items-center gap-2 text-xs mb-6 flex-row-reverse justify-end">
              <span className="text-muted-foreground mr-2">• يُشحن خلال 1-2 يوم عمل</span>
              <span className={product.stock > 10 ? 'text-emerald-400' : 'text-amber-400'}>
                {product.stock > 10 ? 'متوفر' : `${product.stock} فقط متبقي`}
              </span>
              <span className={`h-2 w-2 rounded-full ${product.stock > 10 ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            </div>

            {/* Tags */}
            {product.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 flex-row-reverse justify-end">
                {product.tags.slice(0, 5).map((t) => (
                  <Badge key={t} variant="outline" className="text-xs text-muted-foreground">
                    #{t}
                  </Badge>
                ))}
              </div>
            )}
          </motion.div>
        </div>

        {/* Related products */}
        {related.length > 0 && (
          <div className="mt-20">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight mb-8 text-right">
              قد <span className="gradient-text-gold">يعجبك أيضاً</span>
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {related.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function Perk({ icon: Icon, label }: { icon: any; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1 p-3 rounded-lg border border-border bg-card/50">
      <Icon className="h-4 w-4 text-gold" />
      <span className="text-[10px] text-muted-foreground text-center font-medium">
        {label}
      </span>
    </div>
  )
}
