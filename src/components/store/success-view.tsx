'use client'

import { motion } from 'framer-motion'
import { Check, Package, Truck, MessageCircle, ArrowLeft } from 'lucide-react'
import { useUI } from '@/lib/ui-store'
import { Button } from '@/components/ui/button'
import { formatPrice } from '@/lib/format'

interface SuccessViewProps {
  orderId: string
  total: number
  whatsappUrl: string
}

export function SuccessView({ orderId, total, whatsappUrl }: SuccessViewProps) {
  const setView = useUI((s) => s.setView)

  return (
    <div className="flex-1">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          {/* Success checkmark */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.4, delay: 0.2, type: 'spring' }}
            className="inline-flex h-20 w-20 items-center justify-center rounded-full gradient-gold text-primary-foreground shadow-2xl shadow-primary/30 mb-6"
          >
            <Check className="h-10 w-10" strokeWidth={3} />
          </motion.div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight">
            تم تسجيل <span className="gradient-text-gold">الطلب</span>
          </h1>

          <p className="mt-4 text-base text-muted-foreground max-w-md mx-auto">
            شكراً لطلبك. أرسل رسالة الطلب الجاهزة عبر واتساب لتأكيده. المبلغ كامل عند الاستلام.
          </p>

          {/* Order info card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-8 rounded-2xl border border-border bg-card p-6 text-right max-w-md mx-auto"
          >
            <div className="flex justify-between py-2 border-b border-border flex-row-reverse">
              <span className="text-sm font-mono font-semibold text-gold">
                #{orderId.slice(-8).toUpperCase()}
              </span>
              <span className="text-sm text-muted-foreground">رقم الطلب</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border flex-row-reverse">
              <span className="text-sm font-black">{formatPrice(total)}</span>
              <span className="text-sm text-muted-foreground">إجمالي الطلب</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border flex-row-reverse">
              <span className="text-sm font-semibold text-emerald-800 dark:text-emerald-400">بانتظار تأكيد واتساب</span>
              <span className="text-sm text-muted-foreground">الحالة</span>
            </div>
            <div className="flex justify-between py-2 flex-row-reverse">
              <span className="text-sm font-semibold">3-5 أيام عمل</span>
              <span className="text-sm text-muted-foreground">التوصيل المتوقع</span>
            </div>
          </motion.div>

          {/* Next steps */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="mt-8 grid sm:grid-cols-3 gap-4 max-w-md mx-auto"
          >
            <Step icon={MessageCircle} title="أرسل رسالة واتساب" sub="للتأكيد والدفع" />
            <Step icon={Package} title="قيد التحضير" sub="تدقيق وتعبئة يدوية" />
            <Step icon={Truck} title="التوصيل" sub="تتبع قريباً" />
          </motion.div>

          <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 h-11 px-8 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition-colors"
            >
              <MessageCircle className="h-4 w-4" />
              فتح واتساب للتأكيد
            </a>
            <Button
              size="lg"
              variant="outline"
              onClick={() => setView({ kind: 'home' })}
              className="font-semibold group"
            >
              متابعة التسوق
              <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            </Button>
          </div>

          <p className="mt-8 text-xs text-muted-foreground">
            تحتاج مساعدة؟ تواصل معنا على{' '}
            <a
              href="https://wa.me/212645900763"
              className="text-gold hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              واتساب: +212 645-900763
            </a>
          </p>
        </motion.div>
      </div>
    </div>
  )
}

function Step({ icon: Icon, title, sub }: { icon: any; title: string; sub: string }) {
  return (
    <div className="flex items-start gap-2 p-3 rounded-lg border border-border bg-card/50 flex-row-reverse">
      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-gold shrink-0">
        <Icon className="h-4 w-4" />
      </div>
      <div className="text-right">
        <p className="text-xs font-semibold">{title}</p>
        <p className="text-[10px] text-muted-foreground">{sub}</p>
      </div>
    </div>
  )
}
