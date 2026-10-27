'use client'

import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import Image from 'next/image'
import { signOut } from 'next-auth/react'
import { ExternalLink, Eye, EyeOff, ImagePlus, Video, Loader2, LogOut, Package, Pencil, Plus, RefreshCw, Search, Trash2, X } from 'lucide-react'
import { BrandLogo } from '@/components/store/brand-logo'
import { AnalyticsPanel } from './analytics-panel'
import { MAX_PRODUCT_VIDEO_BYTES, validVideoHeader, videoExtension } from '@/lib/product-video'
import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { formatPrice } from '@/lib/format'
import type { AdminProduct, ProductInput } from '@/lib/admin/product-schema'

type CategoryOption = { slug: string; name: string }
type Snapshot = { products: AdminProduct[]; revision: string }
type Props = { initialProducts: AdminProduct[]; initialRevision: string; categories: CategoryOption[] }

async function requestJson(url: string, options?: RequestInit) {
  const response = await fetch(url, { ...options, cache: 'no-store' })
  const body = await response.json().catch(() => ({}))
  if (response.status === 401) { window.location.assign(new URL('/admin/login', window.location.origin).toString()); throw new Error('انتهت جلسة الدخول') }
  if (!response.ok) throw new Error(body.error || 'وقع مشكل. حاول من جديد.')
  return body
}

export function ProductDashboard({ initialProducts, initialRevision, categories }: Props) {
  const [snapshot, setSnapshot] = useState<Snapshot>({ products: initialProducts, revision: initialRevision })
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [editing, setEditing] = useState<AdminProduct | null | undefined>(undefined)
  const [refreshing, setRefreshing] = useState(false)
  const [showTrash, setShowTrash] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<AdminProduct | null>(null)
  const [mutating, setMutating] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const filtered = useMemo(() => snapshot.products.filter((product) =>
    Boolean(product.deletedAt) === showTrash && (category === 'all' || product.categorySlug === category) && product.name.toLocaleLowerCase().includes(query.toLocaleLowerCase().trim()),
  ), [snapshot.products, category, query, showTrash])
  const currentProducts = snapshot.products.filter((product) => !product.deletedAt)
  const active = currentProducts.filter((product) => product.active).length
  const trashCount = snapshot.products.length - currentProducts.length

  async function refresh() {
    setRefreshing(true); setError('')
    try { setSnapshot(await requestJson('/api/admin/products')); setNotice('تحدّثات لائحة المنتجات') }
    catch (failure) { setError((failure as Error).message) }
    finally { setRefreshing(false) }
  }

  async function changeTrash(product: AdminProduct, deleted: boolean) {
    setMutating(true); setError('')
    try {
      const result: Snapshot = await requestJson('/api/admin/products/' + product.slug, {
        method: deleted ? 'DELETE' : 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ revision: snapshot.revision }),
      })
      setSnapshot(result); setDeleteTarget(null)
      setNotice(deleted ? 'تحذف المنتج. تقدر ترجعو من المحذوفة.' : 'ترجع المنتج كمخفي. تقدر تعدلو وتنشرو من جديد.')
    } catch (failure) { setError((failure as Error).message) }
    finally { setMutating(false) }
  }

  async function save(product: ProductInput) {
    const result: Snapshot = await requestJson(editing ? `/api/admin/products/${editing.slug}` : '/api/admin/products', {
      method: editing ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ revision: snapshot.revision, product }),
    })
    setSnapshot(result)
    setNotice(editing ? 'تحفظات التغييرات وكتبان فالمتجر.' : 'تزاد المنتج وتحفظ بنجاح.')
    setEditing(undefined)
  }

  return (
    <main className="min-h-dvh bg-background text-foreground">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-5 sm:px-8">
          <div className="flex items-center gap-5"><BrandLogo /><span className="hidden border-r border-border pr-5 text-sm text-muted-foreground sm:block">لوحة الإدارة</span></div>
          <div className="flex items-center gap-2"><ThemeToggle /><a href="/" target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm text-muted-foreground hover:bg-accent"><ExternalLink size={16} /> المتجر</a><Button variant="ghost" size="icon" onClick={() => signOut({ callbackUrl: '/admin/login' })} aria-label="تسجيل الخروج"><LogOut size={18} /></Button></div>
        </div>
      </header>
      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-12">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-5">
          <div><p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary" dir="ltr">YOUR STORE, YOUR WAY</p><h1 className="text-3xl font-black sm:text-4xl">المنتجات ديالك</h1><p className="mt-3 text-sm leading-7 text-muted-foreground">زيد منتجاتك وعدّل التصاور والأثمنة. كلشي كيتحفظ وكيبان فالمتجر.</p></div>
          <Button onClick={() => { setError(''); setEditing(null) }} className="h-12 gap-2 bg-amber-400 px-5 font-bold text-black hover:bg-amber-300"><Plus size={18} /> إضافة منتج</Button>
        </div>
        <AnalyticsPanel products={snapshot.products} />
        <div className="mb-8 grid grid-cols-3 gap-3 sm:gap-5">
          <Summary label="جميع المنتجات" value={currentProducts.length} />
          <Summary label="ظاهرة فالمتجر" value={active} />
          <Summary label="مخفية" value={currentProducts.length - active} />
        </div>
        {notice && <div role="status" className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-800 dark:text-emerald-300">{notice}<button type="button" onClick={() => setNotice('')} aria-label="إغلاق الإشعار"><X size={16} /></button></div>}
        {error && <p role="alert" className="mb-5 rounded-xl bg-red-500/10 p-4 text-sm text-red-700 dark:text-red-300">{error}</p>}
        <div className="mb-4 flex flex-wrap gap-2" aria-label="عرض المنتجات أو المحذوفة">
          <Button variant={showTrash ? 'outline' : 'secondary'} aria-pressed={!showTrash} onClick={() => setShowTrash(false)}>المنتجات ({currentProducts.length})</Button>
          <Button variant={showTrash ? 'secondary' : 'outline'} aria-pressed={showTrash} onClick={() => setShowTrash(true)}><Trash2 size={15} /> المحذوفة ({trashCount})</Button>
        </div>
        <div className="mb-6 flex flex-wrap gap-3">
          <div className="relative min-w-48 flex-1"><Search className="absolute right-3 top-3.5 text-muted-foreground" size={17} /><Input aria-label="البحث فالمنتجات" placeholder="قلّب على منتج..." value={query} onChange={(event) => setQuery(event.target.value)} className="h-11 bg-card pr-10" /></div>
          <select aria-label="تصفية حسب القسم" value={category} onChange={(event) => setCategory(event.target.value)} className="h-11 max-w-full rounded-lg border border-input bg-card px-3 text-sm"><option value="all">جميع الأقسام</option>{categories.map((item) => <option key={item.slug} value={item.slug}>{item.name}</option>)}</select>
          <Button variant="outline" disabled={refreshing} onClick={refresh} aria-label="تحديث اللائحة" className="h-11"><RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} /></Button>
        </div>
        {filtered.length === 0 ? <div className="rounded-2xl border border-dashed border-border py-20 text-center"><Package className="mx-auto mb-4 text-muted-foreground" size={36} /><p>ما كاين حتى منتج بهاد البحث</p></div> : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((product) => (
              <article key={product.slug} className="overflow-hidden rounded-2xl border border-border bg-card">
                <div className="flex gap-4 p-4">
                  <div className="relative h-28 w-24 shrink-0 overflow-hidden rounded-xl bg-muted"><Image src={product.images[0]} alt={product.name} fill unoptimized className="object-cover" /></div>
                  <div className="min-w-0 flex-1"><p className="mb-2 truncate text-xs text-primary">{categories.find((item) => item.slug === product.categorySlug)?.name}</p><h2 className="line-clamp-2 text-sm font-semibold leading-6">{product.name}</h2><p className="mt-2 font-bold">{formatPrice(product.price)}</p><p className="mt-1 text-xs text-muted-foreground">المخزون: {product.stock}</p></div>
                </div>
                <div className="flex items-center justify-between gap-2 border-t border-border px-4 py-3">
                  <span className={'inline-flex items-center gap-1.5 text-xs ' + (product.active && !product.deletedAt ? 'text-emerald-700 dark:text-emerald-400' : 'text-muted-foreground')}>
                    {product.deletedAt ? <Trash2 size={14} /> : product.active ? <Eye size={14} /> : <EyeOff size={14} />}
                    {product.deletedAt ? 'فالمحذوفة' : product.active ? 'ظاهر فالمتجر' : 'مخفي'}
                  </span>
                  {product.deletedAt ? <Button variant="outline" size="sm" disabled={mutating} onClick={() => changeTrash(product, false)}><RefreshCw size={14} /> استرجاع</Button> : (
                    <div className="flex items-center gap-1.5">
                      <Button variant="outline" size="sm" disabled={mutating} onClick={() => setEditing(product)}><Pencil size={14} /> تعديل</Button>
                      <Button variant="ghost" size="sm" disabled={mutating} className="text-red-700 dark:text-red-400 hover:bg-red-500/10 hover:text-red-700 dark:hover:text-red-300" onClick={() => { setError(''); setDeleteTarget(product) }}><Trash2 size={14} /> حذف</Button>
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
      <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => { if (!open && !mutating) setDeleteTarget(null) }}>
        <AlertDialogContent dir="rtl" className="rounded-2xl border-border bg-card">
          <AlertDialogHeader className="text-right sm:text-right"><AlertDialogTitle>حذف المنتج؟</AlertDialogTitle><AlertDialogDescription className="leading-7">غادي يتحيد «{deleteTarget?.name}» من المتجر واللائحة الرئيسية. تقدر ترجعو من «المحذوفة».</AlertDialogDescription></AlertDialogHeader>
          {error && <p role="alert" className="text-sm leading-6 text-red-700 dark:text-red-300">{error}</p>}
          <AlertDialogFooter><AlertDialogCancel disabled={mutating}>إلغاء</AlertDialogCancel><AlertDialogAction disabled={mutating} className="bg-red-600 text-white hover:bg-red-500" onClick={(event) => { event.preventDefault(); if (deleteTarget) void changeTrash(deleteTarget, true) }}>{mutating ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}{mutating ? 'كيتم الحذف...' : 'حذف المنتج'}</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Dialog open={editing !== undefined} onOpenChange={(open) => { if (!open) setEditing(undefined) }}>
        <DialogContent className="max-h-[94dvh] w-[calc(100%_-_1.5rem)] overflow-y-auto rounded-2xl border-border bg-card p-5 sm:max-w-3xl sm:p-7 [&>button]:left-4 [&>button]:right-auto" dir="rtl">
          <DialogHeader className="text-right sm:text-right"><DialogTitle className="text-2xl">{editing ? 'تعديل المنتج' : 'منتج جديد'}</DialogTitle><DialogDescription>دخل المعلومات وزيد التصاور، ومن بعد اضغط على حفظ.</DialogDescription></DialogHeader>
          {editing !== undefined && <ProductEditor key={editing?.slug || 'new'} product={editing} categories={categories} onSave={save} onCancel={() => setEditing(undefined)} onRefresh={refresh} />}
        </DialogContent>
      </Dialog>
    </main>
  )
}

function Summary({ label, value }: { label: string; value: number }) {
  return <div className="rounded-2xl border border-border bg-card p-4 sm:p-5"><p className="text-2xl font-bold sm:text-3xl">{value}</p><p className="mt-2 text-xs leading-5 text-muted-foreground sm:text-sm">{label}</p></div>
}

async function prepareImage(file: File) {
  if (file.size > 20 * 1024 * 1024) throw new Error('الصورة كبيرة بزاف. اختار صورة أصغر من 20 ميغا.')
  try {
    const bitmap = await createImageBitmap(file)
    try {
      const ratio = Math.min(1, 1800 / Math.max(bitmap.width, bitmap.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(bitmap.width * ratio); canvas.height = Math.round(bitmap.height * ratio)
      const context = canvas.getContext('2d')
      if (!context) throw new Error('Image conversion unavailable')
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', 0.86))
      if (blob) return new File([blob], 'product.webp', { type: 'image/webp' })
    } finally { bitmap.close() }
  } catch { /* The server can also decode supported original files. */ }
  if (file.size > 4 * 1024 * 1024) throw new Error('تعذر تصغير الصورة. جرّب صورة JPG أصغر من 4 ميغا.')
  return file
}

function ProductEditor({ product, categories, onSave, onCancel, onRefresh }: {
  product: AdminProduct | null; categories: CategoryOption[]; onSave: (product: ProductInput) => Promise<void>; onCancel: () => void; onRefresh: () => Promise<void>
}) {
  const [images, setImages] = useState(product?.images || [])
  const [video, setVideo] = useState(product?.video || '')
  const [videoProgress, setVideoProgress] = useState<number | null>(null)
  const [sizes, setSizes] = useState(product?.sizes || ['S', 'M', 'L', 'XL', 'XXL'])
  const [colors, setColors] = useState(product?.colors || ['أسود', 'أبيض'])
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [conflict, setConflict] = useState(false)
  const uploadInput = useRef<HTMLInputElement>(null)
  const videoInput = useRef<HTMLInputElement>(null)
  const videoAbort = useRef<AbortController | null>(null)
  useEffect(() => () => videoAbort.current?.abort(), [])

  async function uploadVideo(file: File | undefined) {
    if (!file) return
    const extension = videoExtension(file.type)
    if (!extension || !file.size || file.size > MAX_PRODUCT_VIDEO_BYTES) { setError('اختار فيديو MP4 أو WebM أصغر من 50 ميغا.'); return }
    setUploading(true); setError(''); setVideoProgress(0)
    const controller = new AbortController()
    videoAbort.current = controller
    try {
      const header = new Uint8Array(await file.slice(0, 4096).arrayBuffer())
      if (!validVideoHeader(header, extension)) throw new Error('هاد الملف ماشي فيديو MP4 أو WebM صالح.')
      const configuration = await requestJson('/api/admin/video-upload', { signal: controller.signal })
      if (configuration.direct) {
        const { upload } = await import('@vercel/blob/client')
        const filename = crypto.randomUUID() + '.' + extension
        await upload('catalog/videos/' + filename, file, {
          access: 'private', handleUploadUrl: '/api/admin/video-upload', multipart: true,
          contentType: file.type, abortSignal: controller.signal,
          onUploadProgress: ({ percentage }) => setVideoProgress(Math.round(percentage)),
        })
        setVideo('/api/product-videos/' + filename)
      } else {
        const body = new FormData(); body.append('file', file)
        const result = await requestJson('/api/admin/video-upload', { method: 'POST', body, signal: controller.signal })
        setVideo(result.url)
      }
    } catch (failure) {
      if (!controller.signal.aborted) setError((failure as Error).message || 'تعذر رفع الفيديو. حاول من جديد.')
    } finally {
      setUploading(false); setVideoProgress(null); videoAbort.current = null
      if (videoInput.current) videoInput.current.value = ''
    }
  }

  async function upload(files: FileList | null) {
    if (!files?.length) return
    if (files.length + images.length > 6) { setError('تقدر تزيد حتى لـ6 تصاور لكل منتج.'); return }
    setUploading(true); setError('')
    try {
      for (const file of Array.from(files)) {
        const form = new FormData(); form.append('file', await prepareImage(file))
        const { url } = await requestJson('/api/admin/upload', { method: 'POST', body: form })
        setImages((current) => [...current, url])
      }
    } catch (failure) { setError((failure as Error).message) }
    finally { setUploading(false); if (uploadInput.current) uploadInput.current.value = '' }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setConflict(false)
    if (saving || uploading) return
    if (!images.length) { setError('زيد صورة وحدة على الأقل للمنتج.'); return }
    if (!sizes.length || !colors.length) { setError('اختار مقاس ولون واحد على الأقل.'); return }
    const values = new FormData(event.currentTarget)
    setSaving(true)
    try {
      await onSave({
        name: String(values.get('name')).trim(), description: String(values.get('description')).trim(),
        price: Number(values.get('price')), stock: Number(values.get('stock')),
        categorySlug: String(values.get('categorySlug')), productType: values.get('productType') === 'other' ? 'other' : 'hoodie', badge: String(values.get('badge')).trim(),
        sizes, colors, images, video, active: values.get('active') === 'on', featured: values.get('featured') === 'on',
      })
    } catch (failure) {
      const message = (failure as Error).message
      setError(message); setConflict(message.includes('حدّث اللائحة'))
    } finally { setSaving(false) }
  }

  return (
    <form onSubmit={submit} className="mt-3 space-y-6">
      <fieldset disabled={saving} className="space-y-6 disabled:opacity-70">
        <div><div className="mb-3 flex items-center justify-between"><h3 className="text-sm font-semibold">تصاور المنتج <span className="text-muted-foreground">({images.length}/6)</span></h3><span className="text-xs text-muted-foreground">الأولى هي الرئيسية</span></div>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            {images.map((url, index) => <div key={url} className={`relative aspect-square overflow-hidden rounded-xl border ${index === 0 ? 'border-amber-400' : 'border-border'}`}><Image src={url} alt={`صورة المنتج ${index + 1}`} fill unoptimized className="object-cover" /><button type="button" disabled={uploading} onClick={() => setImages((current) => current.filter((item) => item !== url))} aria-label={`حذف الصورة ${index + 1}`} className="absolute left-1 top-1 flex h-8 w-8 items-center justify-center rounded-full bg-black/75 text-white"><Trash2 size={14} /></button><button type="button" disabled={uploading} onClick={() => setImages((current) => [url, ...current.filter((item) => item !== url)])} className={`absolute inset-x-0 bottom-0 py-2 text-[10px] ${index === 0 ? 'bg-amber-400 text-black' : 'bg-black/75 text-white'}`}>{index === 0 ? 'الصورة الرئيسية' : 'خليها رئيسية'}</button></div>)}
            {images.length < 6 && <button type="button" disabled={uploading} onClick={() => uploadInput.current?.click()} className="flex aspect-square flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/40 text-xs text-muted-foreground hover:border-amber-400 hover:text-primary">{uploading ? <Loader2 className="animate-spin" size={24} /> : <ImagePlus size={24} />}{uploading ? 'كتترفع الصورة...' : 'زيد تصاور'}</button>}
          </div>
          <input ref={uploadInput} type="file" accept="image/jpeg,image/png,image/webp,image/avif,image/heic,image/heif" multiple className="hidden" aria-label="رفع صور المنتج" onChange={(event) => upload(event.target.files)} />
          <p className="mt-2 text-xs leading-6 text-muted-foreground">اختار من الهاتف أو الحاسوب. التصاور كتتصغّر تلقائياً باش المتجر يبقى سريع.</p>
        </div>
        <div className="space-y-3">
          <h3 className="text-sm font-semibold">فيديو المنتج <span className="font-normal text-muted-foreground">(اختياري)</span></h3>
          {video && <div className="space-y-3 rounded-xl border border-border bg-muted/40 p-3"><video key={video} src={video} controls playsInline preload="metadata" className="max-h-64 w-full rounded-lg bg-black" aria-label="معاينة فيديو المنتج" /><Button type="button" variant="outline" disabled={uploading} onClick={() => setVideo('')} className="gap-2 text-red-700 dark:text-red-400"><Trash2 size={15} /> حيد الفيديو من المنتج</Button></div>}
          <Button type="button" variant="outline" disabled={uploading} onClick={() => videoInput.current?.click()} className="min-h-11 gap-2">{videoProgress !== null ? <Loader2 className="animate-spin" size={17} /> : <Video size={17} />}{videoProgress !== null ? 'كيترفع الفيديو… ' + videoProgress + '%' : video ? 'بدل الفيديو' : 'زيد فيديو'}</Button>
          {videoProgress !== null && <div role="progressbar" aria-label="رفع فيديو المنتج" aria-valuenow={videoProgress} aria-valuemin={0} aria-valuemax={100} className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full bg-primary transition-[width]" style={{ width: videoProgress + '%' }} /></div>}
          <input ref={videoInput} type="file" accept="video/mp4,video/webm" className="hidden" aria-label="رفع فيديو المنتج" onChange={(event) => { void uploadVideo(event.target.files?.[0]) }} />
          <p className="text-xs leading-6 text-muted-foreground">فيديو واحد MP4 أو WebM، حتى لـ50 ميغا. كيبان مع التصاور فصفحة المنتج وكيخدم ملي الزبون يضغط عليه.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="اسم المنتج" id="product-name"><Input id="product-name" name="name" required minLength={2} maxLength={150} defaultValue={product?.name || ''} placeholder="مثلاً: هودي NOXwear أسود" /></Field>
          <Field label="القسم" id="product-category"><select id="product-category" name="categorySlug" defaultValue={product?.categorySlug || 'anime'} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">{categories.map((category) => <option key={category.slug} value={category.slug}>{category.name}</option>)}</select></Field>
          <Field label="نوع القطعة" id="product-type"><select id="product-type" name="productType" defaultValue={product?.productType || 'hoodie'} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="hoodie">هودي — كيشملو العرض</option><option value="other">قطعة أخرى — بدون العرض</option></select></Field>
          <Field label="الثمن بالدرهم" id="product-price"><Input id="product-price" name="price" type="number" inputMode="decimal" required min="0.01" max="100000" step="0.01" defaultValue={product?.price ?? 250} /></Field>
          <Field label="الكمية المتوفرة" id="product-stock"><Input id="product-stock" name="stock" type="number" inputMode="numeric" required min="0" max="100000" step="1" defaultValue={product?.stock ?? 50} /></Field>
        </div>
        <Field label="وصف المنتج" id="product-description"><Textarea id="product-description" name="description" maxLength={3000} rows={3} defaultValue={product?.description || ''} placeholder="كتب تفاصيل المنتج، القماش والطبعة..." /></Field>
        <div><p className="mb-3 text-sm font-medium">المقاسات المتوفرة</p><div className="flex flex-wrap gap-2" dir="ltr">{[...new Set(['S', 'M', 'L', 'XL', 'XXL', ...(product?.sizes || [])])].map((size) => <button key={size} type="button" aria-pressed={sizes.includes(size)} onClick={() => setSizes((current) => current.includes(size) ? current.filter((item) => item !== size) : [...current, size])} className={`min-h-10 min-w-12 rounded-lg border px-3 text-sm ${sizes.includes(size) ? 'border-amber-400 bg-amber-400/10 text-primary' : 'border-input text-muted-foreground'}`}>{size}</button>)}</div></div>
        <div><p className="mb-3 text-sm font-medium">الألوان المتوفرة</p><div className="flex flex-wrap gap-2">{[...new Set(['أسود', 'أبيض', 'بيج', ...(product?.colors || [])])].map((color) => <button key={color} type="button" aria-pressed={colors.includes(color)} onClick={() => setColors((current) => current.includes(color) ? current.filter((item) => item !== color) : [...current, color])} className={`min-h-10 rounded-lg border px-4 text-sm ${colors.includes(color) ? 'border-amber-400 bg-amber-400/10 text-primary' : 'border-input text-muted-foreground'}`}>{color}</button>)}</div></div>
        <Field label="شارة المنتج (اختياري)" id="product-badge"><Input id="product-badge" name="badge" maxLength={50} defaultValue={product?.badge || ''} placeholder="مثلاً: جديد أو عرض ترحيبي" /></Field>
        <div className="space-y-3 rounded-xl border border-border bg-muted/50 p-4"><label className="flex items-center gap-3 text-sm"><input name="active" type="checkbox" defaultChecked={product?.active ?? true} className="h-4 w-4 accent-amber-400" /> ظاهر فالمتجر <span className="text-xs text-muted-foreground">حيد العلامة باش تخفيه</span></label><label className="flex items-center gap-3 text-sm"><input name="featured" type="checkbox" defaultChecked={product?.featured ?? true} className="h-4 w-4 accent-amber-400" /> يظهر ضمن المنتجات المميزة فالرئيسية</label></div>
      </fieldset>
      {error && <div role="alert" className="rounded-xl bg-red-500/10 p-4 text-sm leading-7 text-red-700 dark:text-red-300">{error}{conflict && <button type="button" className="mr-2 underline" onClick={async () => { await onRefresh(); setConflict(false); setError('تحدّثات اللائحة. راجع معلوماتك واضغط حفظ من جديد.'); }}>تحديث اللائحة</button>}</div>}
      <div className="sticky -bottom-5 flex gap-3 border-t border-border bg-card py-4 sm:-bottom-7"><Button type="submit" disabled={saving || uploading} className="h-12 flex-1 bg-amber-400 font-bold text-black hover:bg-amber-300">{saving && <Loader2 size={16} className="animate-spin" />}{saving ? 'كيتحفظ...' : product ? 'حفظ التغييرات' : 'إضافة المنتج'}</Button><Button type="button" variant="outline" disabled={saving || uploading} onClick={onCancel} className="h-12">إلغاء</Button></div>
    </form>
  )
}

function Field({ label, id, children }: { label: string; id: string; children: React.ReactNode }) {
  return <div className="space-y-2"><label htmlFor={id} className="block text-sm font-medium">{label}</label>{children}</div>
}
