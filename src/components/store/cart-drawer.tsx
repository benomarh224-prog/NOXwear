'use client'

import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { useCart } from '@/lib/store'
import { useUI } from '@/lib/ui-store'
import { Button } from '@/components/ui/button'
import { Minus, Plus, ShoppingBag, ArrowLeft, Trash2, MessageCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { formatPrice } from '@/lib/format'
import { calculateOrderPricing } from '@/lib/pricing'
import { OptimizedImage } from './optimized-image'

export function CartDrawer() {
  const { items, isOpen, setOpen, updateQuantity, removeItem } = useCart()
  const setView = useUI((s) => s.setView)

  const pricing = calculateOrderPricing(items)
  const { subtotal, discount, grandTotal } = pricing

  const handleCheckout = () => {
    setOpen(false)
    setView({ kind: 'checkout' })
  }

  return (
    <Sheet open={isOpen} onOpenChange={setOpen}>
      <SheetContent className="w-full sm:max-w-md flex flex-col p-0 gap-0" side="left">
        <SheetHeader className="px-5 py-4 border-b border-border">
          <SheetTitle className="flex items-center gap-2 text-base">
            <ShoppingBag className="h-5 w-5 text-gold" />
            سلتك
            <span className="text-sm font-normal text-muted-foreground">
              ({items.length})
            </span>
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
              <ShoppingBag className="h-10 w-10 text-muted-foreground" />
            </div>
            <div>
              <p className="font-semibold">سلتك فارغة</p>
              <p className="text-sm text-muted-foreground mt-1">
                أضف بعض القطع للبدء.
              </p>
            </div>
            <Button
              onClick={() => setOpen(false)}
              className="gradient-gold text-primary-foreground"
            >
              تصفح المنتجات
              <ArrowLeft className="mr-2 h-4 w-4" />
            </Button>
          </div>
        ) : (
          <>
            {/* Items */}
            <div className="flex-1 overflow-y-auto scrollbar-thin px-3 py-3">
              <AnimatePresence>
                {items.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex gap-3 p-2 rounded-lg hover:bg-accent/30 transition-colors flex-row-reverse"
                  >
                    <div className="relative h-20 w-20 shrink-0 rounded-md overflow-hidden bg-muted">
                      <OptimizedImage
                        src={item.image}
                        alt={item.name}
                        className="object-cover"
                        sizes="80px"
                      />
                    </div>

                    <div className="flex-1 min-w-0 text-right">
                      <div className="flex items-start justify-between gap-2 flex-row-reverse">
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
                          aria-label="حذف"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        <p className="text-sm font-semibold line-clamp-2 leading-tight">
                          {item.name}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {item.size} • {item.color}
                      </p>
                      <div className="flex items-center justify-between mt-2 flex-row-reverse">
                        <p className="text-sm font-black">
                          {formatPrice(item.price * item.quantity)}
                        </p>
                        <div className="flex items-center gap-1 border border-border rounded-md">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="h-7 w-7 flex items-center justify-center hover:bg-accent transition-colors"
                            aria-label="زيادة"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                          <span className="text-xs font-semibold w-6 text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="h-7 w-7 flex items-center justify-center hover:bg-accent transition-colors"
                            aria-label="إنقاص"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="border-t border-border p-4 space-y-3 bg-card">
              <div className="flex justify-between text-sm flex-row-reverse">
                <span className="font-semibold">{formatPrice(subtotal)}</span>
                <span className="text-muted-foreground">المجموع الفرعي</span>
              </div>
              {discount > 0 && <div className="flex justify-between text-sm text-emerald-400 flex-row-reverse"><span className="font-bold">−{formatPrice(discount)}</span><span>تخفيض كل جوج هوديات</span></div>}
              {pricing.hoodieCount % 2 === 1 && <p className="rounded-lg border border-amber-400/20 bg-amber-400/10 p-2 text-right text-xs text-amber-300">زيد هودي آخر واستافد من عرض جوج هوديات.</p>}
              <div className="flex justify-between text-sm flex-row-reverse">
                <span className="font-semibold">
                  <span className="text-gold">مجاني</span>
                </span>
                <span className="text-muted-foreground">رسوم التوصيل</span>
              </div>
              <div className="text-xs bg-emerald-500/10 border border-emerald-500/30 rounded-md p-2 text-emerald-400 text-right">
                ✦ توصيل مجاني لجميع مدن المغرب
              </div>
              <div className="border-t border-border pt-3 flex justify-between items-baseline flex-row-reverse">
                <span className="font-black text-xl">{formatPrice(grandTotal)}</span>
                <span className="font-semibold">الإجمالي</span>
              </div>
              <Button
                onClick={handleCheckout}
                size="lg"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold group"
              >
                <MessageCircle className="ml-2 h-4 w-4" />
                إتمام الطلب عبر واتساب
                <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
              </Button>
              <p className="text-[10px] text-center text-muted-foreground">
                تسبيق 50 د.م فقط • توصيل لكل المغرب • إرجاع خلال 30 يوم
              </p>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
