'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { BarChart3, ChevronDown, Eye, Loader2, MessageCircle, RefreshCw, ShoppingBag, Users, type LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatPrice } from '@/lib/format'
import type { AnalyticsSummary } from '@/lib/analytics-model'

const number = new Intl.NumberFormat('ar-MA')
const DEVICE_NAMES: Record<string, string> = { mobile: 'الهاتف', desktop: 'الحاسوب', tablet: 'التابلت' }
const SOURCE_NAMES: Record<string, string> = { direct: 'دخول مباشر', google: 'Google', instagram: 'Instagram', facebook: 'Facebook', tiktok: 'TikTok', other: 'مصادر أخرى' }

function countryName(code: string) {
  if (code === 'unknown') return 'غير معروف'
  try { return new Intl.DisplayNames(['ar'], { type: 'region' }).of(code) || code } catch { return code }
}

export function AnalyticsPanel({ products }: { products: { slug: string; name: string }[] }) {
  const router = useRouter()
  const [days, setDays] = useState<7 | 30>(7)
  const [revision, setRevision] = useState(0)
  const [data, setData] = useState<AnalyticsSummary | null>(null)
  const [busy, setBusy] = useState(true)
  const [expanded, setExpanded] = useState(false)
  const [panelOpen, setPanelOpen] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => {
    const controller = new AbortController()
    void fetch(`/api/admin/analytics?days=${days}`, { cache: 'no-store', signal: controller.signal })
      .then(async (response) => {
        if (response.status === 401) { router.replace('/admin/login'); throw new Error('انتهت جلسة الدخول') }
        const body = await response.json()
        if (!response.ok) throw new Error(body.error || 'تعذر تحميل الإحصائيات')
        setData(body)
        setError('')
      })
      .catch((failure) => { if (!controller.signal.aborted) setError(failure instanceof Error ? failure.message : 'تعذر تحميل الإحصائيات') })
      .finally(() => { if (!controller.signal.aborted) setBusy(false) })
    return () => controller.abort()
  }, [days, revision, router])

  const maximum = Math.max(1, ...(data?.daily.map((day) => day.visits) || []))
  return (
    <section className="mb-5 overflow-hidden rounded-xl border border-border bg-card" aria-labelledby="store-analytics-title" aria-busy={busy}>
      <h2 id="store-analytics-title" className="sr-only">إحصائيات المتجر</h2>
      <button
        type="button"
        aria-expanded={panelOpen}
        aria-controls="store-analytics-content"
        aria-label={panelOpen ? 'إخفاء إحصائيات المتجر' : 'عرض إحصائيات المتجر'}
        onClick={() => setPanelOpen((open) => !open)}
        className="flex min-h-12 w-full items-center justify-between gap-3 px-4 py-3 text-right transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-amber-400"
      >
        <span className="flex min-w-0 items-center gap-2"><BarChart3 size={17} className="shrink-0 text-primary" aria-hidden="true" /><span className="truncate text-sm font-semibold">الإحصائيات</span></span>
        <span className="flex shrink-0 items-center gap-3"><span className="text-xs text-muted-foreground">{error ? 'تعذر التحميل' : <>زوار اليوم: <span className="font-bold text-primary">{data ? number.format(data.todayVisitors) : '…'}</span></>}</span><ChevronDown size={16} className={panelOpen ? 'rotate-180 text-primary' : 'text-muted-foreground'} aria-hidden="true" /></span>
      </button>
      <div id="store-analytics-content" hidden={!panelOpen} className="border-t border-border p-4 sm:p-5">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div><p className="text-sm font-bold">تفاصيل الإحصائيات</p><p className="mt-2 text-xs leading-6 text-muted-foreground">التتبع كيبدا من تفعيل الخاصية؛ الزيارات القديمة ما محسوباش. التوقيت ديال المغرب.</p></div>
        <div className="flex items-center gap-2">
          <label htmlFor="analytics-period" className="sr-only">الفترة ديال الإحصائيات</label>
          <select id="analytics-period" value={days} disabled={busy} onChange={(event) => { setBusy(true); setError(''); setData(null); setDays(Number(event.target.value) as 7 | 30) }} className="min-h-11 rounded-lg border border-input bg-muted px-3 text-sm"><option value={7}>آخر 7 أيام</option><option value={30}>آخر 30 يوم</option></select>
          <Button type="button" variant="outline" size="icon" className="h-11 w-11" disabled={busy} aria-label="تحديث الإحصائيات" onClick={() => { setBusy(true); setError(''); setRevision((value) => value + 1) }}>{busy ? <Loader2 className="animate-spin" size={17} /> : <RefreshCw size={17} />}</Button>
        </div>
      </div>
      {error ? <p role="alert" className="rounded-lg bg-red-500/10 p-4 text-sm text-red-700 dark:text-red-300">{error}</p> : (
        <>
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            <Metric icon={Users} title="زوار اليوم" value={data?.todayVisitors} hint="تقريبياً؛ كل متصفح مرة فالنهار" />
            <Metric icon={Eye} title="مشاهدات الصفحات" value={data?.views} hint={days === 7 ? 'خلال آخر 7 أيام' : 'خلال آخر 30 يوم'} />
            <Metric icon={ShoppingBag} title="إضافات للسلة" value={data?.addToCart} hint="عدد مرات الإضافة" />
            <Metric icon={MessageCircle} title="نقرات واتساب" value={data?.whatsapp} hint="فتح المحادثة، ماشي تأكيد الطلب" />
          </div>
          {data && <>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <SmallMetric title="طلبات مسجلة بالموقع" value={number.format(data.orders)} hint="بانتظار التأكيد، ماشي مبيعات مكتملة" />
              <SmallMetric title="قيمة الطلبات المسجلة" value={formatPrice(data.orderValue)} hint="ما كتعنيش مداخيل تم تحصيلها" />
              <SmallMetric title="طلبات طبعة خاصة مجهّزة" value={number.format(data.customRequests)} hint="رسائل تم تجهيزها للتواصل فواتساب" />
            </div>
            <details open={expanded} onToggle={(event) => setExpanded(event.currentTarget.open)} className="mt-5 rounded-xl border border-border p-4">
              <summary className="min-h-8 cursor-pointer text-sm font-semibold text-primary">تفاصيل الزيارات والمنتجات الأكثر مشاهدة</summary>
              <div className="mt-5">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2"><h3 className="text-sm font-bold">الزيارات اليومية</h3><p className="text-xs text-muted-foreground">{number.format(data.visits)} زيارة خلال الفترة • كل متصفح كيحسب مرة فكل نهار</p></div>
                <div className="flex h-36 items-end gap-1 border-b border-border" dir="ltr" role="img" aria-label={`رسم الزيارات اليومية: ${data.daily.map((day) => `${day.day}: ${day.visits}`).join('، ')}`}>
                  {data.daily.map((day) => <div key={day.day} className="flex h-full min-w-0 flex-1 items-end" title={`${day.day}: ${day.visits} زيارة، ${day.views} مشاهدة`}><div className={day.visits ? 'w-full rounded-t bg-amber-400/80' : 'w-full rounded-t bg-muted'} style={{ height: day.visits ? `${Math.max(3, day.visits / maximum * 100)}%` : '2px' }} /></div>)}
                </div>
                <div className="mt-2 flex justify-between text-[10px] text-muted-foreground" dir="ltr"><span>{data.daily[0]?.day}</span><span>{data.daily.at(-1)?.day}</span></div>
                <div className="mt-6 grid gap-6 lg:grid-cols-2">
                  <div><h3 className="mb-3 text-sm font-bold">المنتجات الأكثر مشاهدة</h3>{data.products.length ? <ol className="space-y-2">{data.products.map((product) => <li key={product.slug} className="flex items-center justify-between gap-3 rounded-lg bg-muted/60 p-3 text-sm"><span className="min-w-0 truncate">{products.find((item) => item.slug === product.slug)?.name || product.slug}</span><span className="shrink-0 font-bold text-primary">{number.format(product.views)}</span></li>)}</ol> : <Empty />}</div>
                  <div className="space-y-5"><Breakdown title="منين جاو الزوار" values={data.sources} label={(key) => SOURCE_NAMES[key] || key} /><Breakdown title="الأجهزة" values={data.devices} label={(key) => DEVICE_NAMES[key] || key} /><Breakdown title="البلدان" values={data.countries} label={countryName} /></div>
                </div>
                <p className="mt-5 text-xs text-muted-foreground">بداو إتمام الطلب: {number.format(data.checkoutStarts)} • الأرقام تقريبية، وممكن أدوات منع التتبع ما تخليش بعض الزيارات تتحسب.</p>
              </div>
            </details>
          </>}
        </>
      )}
      </div>
    </section>
  )
}

function Metric({ icon: Icon, title, value, hint }: { icon: LucideIcon; title: string; value?: number; hint: string }) {
  return <div className="min-w-0 rounded-xl border border-border bg-muted p-4"><Icon size={19} className="mb-3 text-primary" aria-hidden="true" /><p className="text-xs text-muted-foreground">{title}</p><p className="my-2 text-2xl font-black sm:text-3xl">{value === undefined ? '…' : number.format(value)}</p><p className="text-[10px] leading-5 text-muted-foreground">{hint}</p></div>
}
function SmallMetric({ title, value, hint }: { title: string; value: string; hint: string }) {
  return <div className="rounded-xl bg-muted/60 p-4"><p className="text-xs text-muted-foreground">{title}</p><p className="my-2 font-bold">{value}</p><p className="text-[10px] leading-5 text-muted-foreground">{hint}</p></div>
}
function Empty() { return <p className="rounded-lg border border-dashed border-border p-4 text-xs text-muted-foreground">مازال ما كايناش بيانات.</p> }
function Breakdown({ title, values, label }: { title: string; values: Record<string, number>; label: (key: string) => string }) {
  const rows = Object.entries(values).sort((a, b) => b[1] - a[1]).slice(0, 6)
  return <div><h3 className="mb-3 text-sm font-bold">{title}</h3>{rows.length ? <ul className="space-y-2">{rows.map(([key, count]) => <li key={key} className="flex justify-between gap-3 text-xs"><span>{label(key)}</span><span className="font-bold">{number.format(count)}</span></li>)}</ul> : <Empty />}</div>
}
