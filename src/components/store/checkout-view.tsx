'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronRight, Loader2, Lock, Check, MessageCircle, Phone, User, MapPin } from 'lucide-react'
import { useUI } from '@/lib/ui-store'
import { useCart } from '@/lib/store'
import { trackStoreEvent } from '@/lib/analytics-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { formatPrice } from '@/lib/format'
import { calculateOrderPricing, pricingMessageLines } from '@/lib/pricing'
import { OptimizedImage } from './optimized-image'

const WHATSAPP_NUMBER = '212645900763' // +212 645-900763
const DELIVERY_COUNTRY = 'المغرب'

export function CheckoutView() {
  const back = useUI((s) => s.back)
  const setView = useUI((s) => s.setView)
  const { items, clear, setOpen } = useCart()
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    customerName: '',
    phone: '',
    address: '',
    city: '',
    notes: '',
  })

  const pricing = calculateOrderPricing(items, DELIVERY_COUNTRY)
  const { subtotal, discount, shipping, grandTotal } = pricing

  const buildWhatsAppMessage = () => {
    const lines: string[] = []
    lines.push('🛒 *طلب جديد من NOXwear*')
    lines.push('')
    lines.push('👤 *معلومات الزبون:*')
    lines.push(`الاسم: ${form.customerName}`)
    lines.push(`الهاتف: ${form.phone}`)
    lines.push(`العنوان: ${form.address}`)
    lines.push(`المدينة: ${form.city}`)
    lines.push(`الدولة: ${DELIVERY_COUNTRY}`)
    if (form.notes) lines.push(`ملاحظات: ${form.notes}`)
    lines.push('')
    lines.push('📦 *المنتجات:*')
    items.forEach((item, i) => {
      lines.push(
        `${i + 1}. ${item.name}`,
      )
      lines.push(`   • المقاس: ${item.size} | اللون: ${item.color}`)
      lines.push(`   • الكمية: ${item.quantity} × ${item.price} د.م = ${item.price * item.quantity} د.م`)
      const imageUrl = new URL(item.image, window.location.origin).href
      lines.push(`   📷 صورة المنتج: ${imageUrl}`)
    })
    lines.push('')
    lines.push(...pricingMessageLines(pricing, DELIVERY_COUNTRY))
    lines.push('')
    lines.push('🙏 شكراً لطلبكم!')

    return encodeURIComponent(lines.join('\n'))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (items.length === 0) {
      toast.error('سلتك فارغة')
      return
    }

    if (!form.customerName || !form.phone || !form.address || !form.city) {
      toast.error('يرجى ملء جميع الحقول المطلوبة')
      return
    }

    // Opening the tab in the submit gesture keeps Safari from blocking WhatsApp.
    const whatsappTab = window.open('about:blank', '_blank')
    setLoading(true)

    try {
      // Save the order in DB first
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: form.customerName,
          email: `whatsapp:${form.phone}`,
          phone: form.phone,
          address: form.address,
          city: form.city,
          country: DELIVERY_COUNTRY,
          total: grandTotal,
          items: items.map((i) => ({
            productId: i.productId,
            name: i.name,
            price: i.price,
            quantity: i.quantity,
            size: i.size,
            color: i.color,
          })),
        }),
      })

      if (!res.ok) {
        const error = await res.json().catch(() => null)
        throw new Error(error?.error || 'تعذر حفظ الطلب، حاول مجدداً')
      }
      const data = await res.json()
      const orderId = data.order?.id
      if (!orderId) throw new Error('لم يصل تأكيد حفظ الطلب')

      // Build WhatsApp link
      const message = buildWhatsAppMessage()
      const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`

      // Clear cart and keep the full message available if a popup was blocked.
      clear()
      setView({ kind: 'success', orderId, total: grandTotal, whatsappUrl: waUrl }, { replace: true })
      if (whatsappTab) {
        try {
          whatsappTab.opener = null
          whatsappTab.location.href = waUrl
          trackStoreEvent('whatsapp', '/checkout')
        } catch {
          whatsappTab.close()
        }
      }
    } catch (err: any) {
      whatsappTab?.close()
      toast.error('فشل إرسال الطلب', { description: err.message })
    } finally {
      setLoading(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 text-center">
        <p className="font-semibold text-lg">سلتك فارغة</p>
        <p className="text-sm text-muted-foreground mt-2">
          أضف بعض المنتجات قبل إتمام الطلب.
        </p>
        <Button
          onClick={() => setView({ kind: 'home' })}
          className="mt-6 gradient-gold text-primary-foreground"
        >
          تصفح المنتجات
        </Button>
      </div>
    )
  }

  return (
    <div className="flex-1">
      <div className="border-b border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-2 flex-row-reverse justify-end">
          <button
            onClick={() => {
              back()
              setOpen(true)
            }}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronRight className="h-3 w-3" />
            العودة للسلة
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* WhatsApp banner */}
        <div className="mb-8 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 flex items-center gap-3 flex-row-reverse">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-white shrink-0">
            <MessageCircle className="h-5 w-5" />
          </div>
          <div className="text-right flex-1">
            <p className="font-bold text-emerald-800 dark:text-emerald-400">إتمام الطلب عبر واتساب</p>
            <p className="text-xs text-muted-foreground">
              بعد الإرسال، نتواصل معك لتأكيد الطلب. توصيل مجاني لكل المغرب والدفع عند الاستلام.
            </p>
          </div>
        </div>

        <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-2 text-right">
          إتمام <span className="gradient-text-gold">الطلب</span>
        </h1>
        <p className="text-sm text-muted-foreground mb-8 flex items-center gap-2 justify-end flex-row-reverse">
          <Lock className="h-3 w-3" />
          معلوماتك آمنة وتُستخدم فقط لإتمام الطلب
        </p>

        <form onSubmit={handleSubmit} className="grid lg:grid-cols-[1fr_400px] gap-8">
          {/* Form fields */}
          <div className="space-y-8 order-2 lg:order-1">
            {/* Customer info */}
            <section>
              <div className="flex items-center gap-2 mb-4 flex-row-reverse justify-end">
                <h2 className="text-lg font-bold">معلومات الزبون</h2>
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gold text-primary-foreground text-xs font-bold">1</div>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <Field label="الاسم الكامل" required icon={User}>
                  <Input
                    required
                    value={form.customerName}
                    onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                    className="bg-background text-right pr-9"
                    dir="rtl"
                  />
                </Field>
                <Field label="رقم الهاتف (واتساب)" required icon={Phone}>
                  <Input
                    required
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="bg-background text-right pr-9"
                    dir="rtl"
                  />
                </Field>
              </div>
            </section>

            {/* Shipping address */}
            <section>
              <div className="flex items-center gap-2 mb-4 flex-row-reverse justify-end">
                <h2 className="text-lg font-bold">عنوان التوصيل</h2>
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gold text-primary-foreground text-xs font-bold">2</div>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <Field label="العنوان" required icon={MapPin} className="sm:col-span-2">
                  <Input
                    required
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    className="bg-background text-right pr-9"
                    dir="rtl"
                  />
                </Field>
                <Field label="المدينة" required className="sm:col-span-2">
                  <Input
                    required
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    className="bg-background text-right"
                    dir="rtl"
                  />
                </Field>
                <Field label="ملاحظات (اختياري)" className="sm:col-span-2">
                  <textarea
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    rows={3}
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-right"
                    dir="rtl"
                  />
                </Field>
              </div>
            </section>

            {/* Payment info */}
            <section>
              <div className="flex items-center gap-2 mb-4 flex-row-reverse justify-end">
                <h2 className="text-lg font-bold">طريقة الدفع</h2>
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gold text-primary-foreground text-xs font-bold">3</div>
              </div>
              <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                <div className="flex items-start gap-3 flex-row-reverse">
                  <Check className="h-5 w-5 text-emerald-700 dark:text-emerald-500 shrink-0 mt-0.5" />
                  <div className="text-right flex-1">
                    <p className="font-semibold text-sm">توصيل مجاني لكل المغرب</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      توصيل فابور لجميع مدن المملكة، بدون أي رسوم إضافية.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 flex-row-reverse">
                  <Check className="h-5 w-5 text-emerald-700 dark:text-emerald-500 shrink-0 mt-0.5" />
                  <div className="text-right flex-1">
                    <p className="font-semibold text-sm">الدفع عند الاستلام</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      المبلغ كامل يُدفع نقداً عند استلام الطلب ({grandTotal} د.م).
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 flex-row-reverse">
                  <Check className="h-5 w-5 text-emerald-700 dark:text-emerald-500 shrink-0 mt-0.5" />
                  <div className="text-right flex-1">
                    <p className="font-semibold text-sm">تواصل مباشر مع البائع</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      نتواصل معك عبر واتساب على الرقم: <span dir="ltr" className="font-mono text-gold">+212 645-900763</span>
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Order summary */}
          <div className="lg:sticky lg:top-24 h-fit space-y-4 order-1 lg:order-2">
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="font-bold mb-4 text-right">
                ملخص الطلب
              </h3>
              <div className="space-y-3 max-h-72 overflow-y-auto scrollbar-thin pr-1">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-3 flex-row-reverse">
                    <div className="relative h-16 w-16 shrink-0 rounded-md overflow-hidden bg-muted">
                      <OptimizedImage src={item.image} alt={item.name} className="object-cover" sizes="64px" />
                      <span className="absolute -top-1 -left-1 h-5 min-w-5 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center border-2 border-card">
                        {item.quantity}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0 text-right">
                      <p className="text-sm font-medium line-clamp-1">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.size} • {item.color}
                      </p>
                    </div>
                    <p className="text-sm font-semibold">
                      {formatPrice(item.price * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>

              <Separator className="my-4" />

              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between flex-row-reverse">
                  <span className="font-semibold">{formatPrice(subtotal)}</span>
                  <span className="text-muted-foreground">المجموع الفرعي</span>
                </div>
                {discount > 0 && <div className="flex justify-between text-emerald-800 dark:text-emerald-400 flex-row-reverse"><span className="font-bold">−{formatPrice(discount)}</span><span>تخفيض كل جوج هوديات</span></div>}
                <div className="flex justify-between flex-row-reverse">
                  <span className="font-semibold">
                    {shipping === 0 ? (
                      <span className="text-gold">مجاني</span>
                    ) : (
                      formatPrice(shipping)
                    )}
                  </span>
                  <span className="text-muted-foreground">رسوم التوصيل</span>
                </div>
                <div className="text-[10px] text-emerald-800 dark:text-emerald-400 pr-2 border-r-2 border-emerald-500/40 text-right">
                  ✦ توصيل مجاني لجميع مدن المغرب
                </div>
              </div>

              <Separator className="my-4" />

              <div className="flex justify-between items-baseline flex-row-reverse">
                <span className="text-2xl font-black">{formatPrice(grandTotal)}</span>
                <span className="font-semibold">الإجمالي</span>
              </div>

              <div className="mt-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-3">
                <div className="flex justify-between items-center flex-row-reverse">
                  <span className="text-emerald-800 dark:text-emerald-400 font-bold text-lg">{formatPrice(grandTotal)}</span>
                  <span className="text-xs text-muted-foreground">المبلغ عند الاستلام</span>
                </div>
              </div>

              <Button
                type="submit"
                size="lg"
                disabled={loading}
                className="w-full mt-5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold group"
              >
                {loading ? (
                  <>
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    جاري الإرسال...
                  </>
                ) : (
                  <>
                    <MessageCircle className="ml-2 h-4 w-4" />
                    إرسال الطلب عبر واتساب
                  </>
                )}
              </Button>

              <p className="text-[10px] text-center text-muted-foreground mt-3 flex items-center justify-center gap-1">
                <MessageCircle className="h-3 w-3" />
                سيتم فتح واتساب برسالة طلب جاهزة
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-4 text-xs text-right">
              <p className="font-semibold mb-2">التوصيل المتوقع</p>
              <p className="text-muted-foreground">
                <span className="text-foreground">24–48 ساعة</span> بعد تأكيد الطلب، لجميع مدن المغرب.
              </p>
              <p className="text-muted-foreground mt-2">
                إرجاع مجاني خلال 30 يوم. نتواصل معك عبر واتساب بخصوص طلبك.
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

function Field({
  label,
  required,
  children,
  className = '',
  icon: Icon,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
  className?: string
  icon?: any
}) {
  return (
    <div className={className}>
      <Label className="text-xs font-medium mb-1.5 block text-right block">
        {required && <span className="text-red-700 dark:text-red-500 ml-1">*</span>}
        {label}
      </Label>
      <div className="relative">
        {Icon && (
          <Icon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        )}
        {children}
      </div>
    </div>
  )
}
