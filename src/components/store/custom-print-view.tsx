'use client'

import { useEffect, useRef, useState, type FormEvent } from 'react'
import { ArrowRight, Check, ImagePlus, Loader2, MessageCircle, Palette, Shirt, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useUI } from '@/lib/ui-store'
import { buildCustomPrintMessage, DESIGN_MAX_BYTES, PRINT_COLORS, PRINT_POSITIONS, PRINT_SIZES, type CustomPrintDetails } from '@/lib/custom-print'

export function CustomPrintButton() {
  const setView = useUI((state) => state.setView)
  return (
    <Button
      size="lg"
      variant="outline"
      className="min-h-14 w-full justify-between gap-3 whitespace-normal rounded-xl border-gold/30 bg-primary/10 px-5 py-3 font-bold text-gold hover:border-gold hover:bg-primary/15"
      onClick={() => setView({ kind: 'custom-print' })}
    >
      <span className="flex items-center gap-2"><ImagePlus className="h-5 w-5 shrink-0" aria-hidden="true" /> اطلب طبعة خاصة</span>
      <ArrowRight className="h-4 w-4 rotate-180 shrink-0" aria-hidden="true" />
    </Button>
  )
}

export function CustomPrintView() {
  const back = useUI((state) => state.back)
  const [details, setDetails] = useState<CustomPrintDetails>({ name: '', size: 'M', color: 'أسود', position: 'القدام', quantity: 1, idea: '', reference: '' })
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [whatsappUrl, setWhatsappUrl] = useState('')
  const fileInput = useRef<HTMLInputElement>(null)
  const savedUpload = useRef<{ file: File; path: string } | null>(null)

  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview)
  }, [preview])

  function update<K extends keyof CustomPrintDetails>(key: K, value: CustomPrintDetails[K]) {
    setDetails((previous) => ({ ...previous, [key]: value }))
    setWhatsappUrl('')
  }

  function chooseFile(selected: File | null) {
    setError(''); setWhatsappUrl('')
    if (selected && (!['image/jpeg', 'image/png', 'image/webp'].includes(selected.type) || selected.size > DESIGN_MAX_BYTES || !selected.size)) {
      setError('اختار صورة JPG أو PNG أو WebP، أصغر من 4 ميغا.')
      setFile(null); setPreview(''); savedUpload.current = null
      if (fileInput.current) fileInput.current.value = ''
      return
    }
    setFile(selected)
    setPreview(selected ? URL.createObjectURL(selected) : '')
    savedUpload.current = null
    if (!selected && fileInput.current) fileInput.current.value = ''
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return
    setError(''); setWhatsappUrl('')
    if (!file && !details.idea.trim() && !details.reference.trim()) {
      setError('زيد صورة أو رابط التصميم، أو شرح لينا الفكرة ديالك.')
      return
    }
    if (details.reference.trim()) {
      try {
        if (!['http:', 'https:'].includes(new URL(details.reference.trim()).protocol)) throw new Error('Unsupported link')
      } catch { setError('رابط التصميم خاصو يبدا بـ https:// أو http://'); return }
    }
    const tab = window.open('about:blank', '_blank')
    setBusy(true)
    try {
      let imageUrl: string | undefined
      if (file) {
        let path = savedUpload.current?.file === file ? savedUpload.current.path : undefined
        if (!path) {
          const body = new FormData()
          body.set('file', file)
          const response = await fetch('/api/custom-designs', { method: 'POST', body })
          const result = await response.json().catch(() => null)
          if (!response.ok || typeof result?.url !== 'string') throw new Error(result?.error || 'تعذر رفع التصميم. حاول من جديد.')
          path = result.url
          savedUpload.current = { file, path: path! }
        }
        imageUrl = new URL(path!, window.location.origin).href
      }
      const message = buildCustomPrintMessage(details, imageUrl)
      const url = `https://wa.me/212645900763?text=${encodeURIComponent(message)}`
      setWhatsappUrl(url)
      if (tab) {
        tab.opener = null
        tab.location.href = url
      }
    } catch (caught) {
      tab?.close()
      setError(caught instanceof Error ? caught.message : 'تعذر تجهيز الطلب. حاول من جديد.')
    } finally { setBusy(false) }
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-14" dir="rtl">
      <button type="button" onClick={back} className="mb-8 inline-flex min-h-11 items-center gap-2 text-sm text-muted-foreground hover:text-gold"><ArrowRight size={16} aria-hidden="true" /> رجوع للمتجر</button>
      <div className="mb-8 max-w-2xl">
        <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-gold/25 bg-primary/10 px-3 py-1 text-xs font-semibold text-gold"><Palette size={14} aria-hidden="true" /> طبعة على ذوقك</span>
        <h1 className="text-3xl font-black leading-tight sm:text-5xl">تصميمك. <span className="gradient-text-gold">على هوديك.</span></h1>
        <p className="mt-4 text-sm leading-7 text-muted-foreground sm:text-base">عندك تصميم فبالك؟ رفع الصورة، حط الرابط، أو كتب الفكرة. نراجعو التفاصيل معاك فواتساب ونأكدّو الثمن ومدة الإنجاز قبل تثبيت الطلب.</p>
      </div>

      <form onSubmit={submit} className="grid items-start gap-6 lg:grid-cols-[1fr_320px]">
        <fieldset disabled={busy} className="min-w-0 space-y-6 rounded-2xl border border-border bg-card p-5 sm:p-7">
          <legend className="sr-only">تصميم الطبعة الخاصة</legend>
          <div>
            <Label htmlFor="custom-design-file" className="mb-3 block font-semibold">1. التصميم ديالك</Label>
            <div className="relative rounded-xl border border-dashed border-gold/40 bg-background p-5 text-center">
              {preview ? (
                <div className="relative mx-auto max-w-xs">
                  {/* Local previews keep the selected file on this device until submit. */}
                  <img src={preview} alt="معاينة التصميم المختار" className="mx-auto max-h-64 rounded-lg object-contain" />
                  <Button type="button" size="icon" variant="secondary" onClick={() => chooseFile(null)} className="absolute top-2 left-2 h-11 w-11 rounded-full" aria-label="حذف التصميم"><X aria-hidden="true" /></Button>
                  <p className="mt-3 truncate text-xs text-muted-foreground">{file?.name}</p>
                </div>
              ) : <><ImagePlus className="mx-auto mb-3 text-gold" size={32} aria-hidden="true" /><p className="mb-2 text-sm font-medium">صورة واضحة كتعاوننا نوجدّو طبعتك</p><p id="custom-file-help" className="mb-4 text-xs text-muted-foreground">JPG، PNG أو WebP • حتى 4 ميغا</p></>}
              <Input ref={fileInput} id="custom-design-file" type="file" accept="image/jpeg,image/png,image/webp" className="mt-4 min-h-11 cursor-pointer bg-background text-xs file:mr-0 file:ml-3" onChange={(event) => chooseFile(event.target.files?.[0] || null)} aria-describedby={!preview ? 'custom-file-help' : undefined} />
            </div>
            <p className="mt-2 text-xs leading-6 text-muted-foreground">ملي تكمل، كيترفع التصميم وكيتم مشاركة رابطو مع المتجر فواتساب.</p>
          </div>
          <div className="space-y-2"><Label htmlFor="custom-reference">رابط التصميم (اختياري)</Label><Input id="custom-reference" type="url" inputMode="url" dir="ltr" maxLength={1000} value={details.reference} onChange={(event) => update('reference', event.target.value)} className="min-h-11 bg-background" /></div>
          <div className="space-y-2"><Label htmlFor="custom-idea">شرح الفكرة أو تفاصيل الطبعة (اختياري)</Label><textarea id="custom-idea" rows={4} maxLength={1400} value={details.idea} onChange={(event) => update('idea', event.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring" /><p className="text-xs text-muted-foreground">خاصنا على الأقل صورة، رابط، أو وصف للفكرة.</p></div>
          <div className="space-y-2"><Label htmlFor="custom-name">الاسم (اختياري)</Label><Input id="custom-name" autoComplete="name" maxLength={80} value={details.name} onChange={(event) => update('name', event.target.value)} className="min-h-11 bg-background" /></div>
        </fieldset>

        <fieldset disabled={busy} className="min-w-0 space-y-5 rounded-2xl border border-gold/20 bg-card p-5 sm:p-6">
          <legend className="sr-only">تفاصيل الهودي</legend>
          <h2 className="flex items-center gap-2 font-bold"><Shirt size={20} className="text-gold" aria-hidden="true" /> 2. تفاصيل الهودي</h2>
          <div><p id="custom-color-label" className="mb-2 text-sm font-medium">اللون</p><div role="group" aria-labelledby="custom-color-label" className="grid grid-cols-2 gap-2">{PRINT_COLORS.map((color) => <Button key={color} type="button" variant="outline" aria-pressed={details.color === color} onClick={() => update('color', color)} className={`min-h-11 ${details.color === color ? 'border-gold bg-primary/10 text-gold' : ''}`}><span aria-hidden="true" className={`h-4 w-4 rounded-full border border-white/30 ${color === 'أسود' ? 'bg-black' : 'bg-white'}`} />{color}{details.color === color && <Check size={14} aria-hidden="true" />}</Button>)}</div></div>
          <div><p id="custom-size-label" className="mb-2 text-sm font-medium">المقاس</p><div role="group" aria-labelledby="custom-size-label" className="grid grid-cols-5 gap-1.5" dir="ltr">{PRINT_SIZES.map((size) => <Button key={size} type="button" variant="outline" aria-pressed={details.size === size} onClick={() => update('size', size)} className={`min-h-11 px-0 ${details.size === size ? 'border-gold bg-primary/10 text-gold' : ''}`}>{size}</Button>)}</div></div>
          <div className="space-y-2"><Label htmlFor="custom-position">مكان الطبعة</Label><select id="custom-position" value={details.position} onChange={(event) => update('position', event.target.value)} className="min-h-11 w-full rounded-md border border-input bg-background px-3 text-base focus-visible:ring-2 focus-visible:ring-ring">{PRINT_POSITIONS.map((position) => <option key={position}>{position}</option>)}</select></div>
          <div className="space-y-2"><Label htmlFor="custom-quantity">الكمية</Label><Input id="custom-quantity" type="number" inputMode="numeric" min={1} max={20} required value={details.quantity} onChange={(event) => update('quantity', Number(event.target.value))} className="min-h-11 bg-background" /></div>
          <div className="rounded-xl border border-border bg-background p-4 text-xs leading-6 text-muted-foreground"><p className="mb-1 font-semibold text-foreground">الثمن حسب التصميم</p><p>كنأكدّو معاك إمكانية الطباعة والثمن ومدة الإنجاز فواتساب قبل الطلب.</p><p className="mt-2 text-gold">التوصيل مجاني لجميع مدن المغرب.</p></div>
          {error && <p role="alert" className="rounded-lg bg-red-500/10 p-3 text-sm leading-6 text-red-400">{error}</p>}
          <Button type="submit" disabled={busy} className="min-h-12 w-full whitespace-normal bg-emerald-600 font-bold text-white hover:bg-emerald-700">{busy ? <Loader2 className="animate-spin" size={18} aria-hidden="true" /> : <MessageCircle size={18} aria-hidden="true" />}{busy ? 'جاري تجهيز التصميم...' : 'كمّل الطلب فواتساب'}</Button>
          {whatsappUrl && <div role="status" className="space-y-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm"><p>رسالة الطلب واجدة. صيفطها فواتساب باش نراجعو التصميم معاك.</p><a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center font-bold text-emerald-400 underline underline-offset-4">فتح واتساب لإرسال الطلب</a></div>}
        </fieldset>
      </form>
    </div>
  )
}
