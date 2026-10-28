'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ArrowUp, ArrowDown, Loader2, RefreshCw, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { compareCollectionOrder } from '@/lib/collection-order'
import type { AdminProduct } from '@/lib/admin/product-schema'

interface Props {
  products: AdminProduct[]
  revision: string
  category: string
  categories: { slug: string; name: string }[]
  onCategory: (category: string) => void
  onSave: (category: string, slugs: string[], revision: string) => Promise<void>
  onRefresh: () => Promise<void>
  onCancel: () => void
  onBusy: (busy: boolean) => void
}

export function ProductOrderEditor({ products, revision, category, categories, onCategory, onSave, onRefresh, onCancel, onBusy }: Props) {
  const [items, setItems] = useState(() => products.filter((product) => !product.deletedAt && product.categorySlug === category).sort(compareCollectionOrder))
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [announcement, setAnnouncement] = useState('')

  function move(index: number, direction: number) {
    const next = index + direction
    if (saving || next < 0 || next >= items.length) return
    const ordered = [...items]
    ;[ordered[index], ordered[next]] = [ordered[next], ordered[index]]
    setItems(ordered); setDirty(true); setError('')
    setAnnouncement(ordered[next].name + ' فالموضع ' + (next + 1))
  }

  async function save() {
    if (saving || !dirty) return
    setSaving(true); onBusy(true); setError('')
    try { await onSave(category, items.map((item) => item.slug), revision) }
    catch (failure) { setError((failure as Error).message) }
    finally { setSaving(false); onBusy(false) }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <label className="space-y-2 text-sm"><span>اختار الكولكشن</span><select value={category} disabled={saving || dirty} onChange={(event) => onCategory(event.target.value)} className="mt-2 h-11 w-full rounded-lg border border-input bg-background px-3">{categories.map((item) => <option key={item.slug} value={item.slug}>{item.name}</option>)}</select></label>
      <p className="text-xs leading-6 text-muted-foreground">طلع وهبط المنتجات بالأسهم، ومن بعد حفظ. المنتج الأول هنا كيبان الأول فالكولكشن. المنتجات الجديدة كتبان فوق حتى ترتبها.</p>
      <p className="sr-only" role="status">{announcement}</p>
      <ol className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain pr-1" aria-label="ترتيب منتجات الكولكشن">
        {items.map((product, index) => (
          <li key={product.slug} className="flex items-center gap-2 rounded-xl border border-border bg-background p-2 sm:gap-3 sm:p-3">
            <span className="w-5 shrink-0 text-center text-xs font-semibold text-muted-foreground" aria-label={'الموضع ' + (index + 1)}>{index + 1}</span>
            <div className="relative h-12 w-10 shrink-0 overflow-hidden rounded-lg bg-muted"><Image src={product.images[0]} alt="" fill sizes="40px" className="object-cover" /></div>
            <div className="min-w-0 flex-1"><p className="line-clamp-2 text-xs font-medium leading-5 sm:text-sm">{product.name}</p>{!product.active && <span className="text-[10px] text-muted-foreground">مخفي فالمتجر</span>}</div>
            <div className="flex shrink-0 gap-1">
              <Button type="button" variant="outline" size="icon" className="h-10 w-10" disabled={saving || index === 0} onClick={() => move(index, -1)} aria-label={'طلع ' + product.name}><ArrowUp size={16} /></Button>
              <Button type="button" variant="outline" size="icon" className="h-10 w-10" disabled={saving || index === items.length - 1} onClick={() => move(index, 1)} aria-label={'هبط ' + product.name}><ArrowDown size={16} /></Button>
            </div>
          </li>
        ))}
        {!items.length && <li className="py-10 text-center text-sm text-muted-foreground">ما كاينينش منتجات فهاد الكولكشن.</li>}
      </ol>
      {error && <div role="alert" className="rounded-lg bg-red-500/10 p-3 text-sm leading-6 text-red-800 dark:text-red-300"><p>{error}</p><Button type="button" variant="link" disabled={saving} onClick={() => { void onRefresh().catch((failure) => setError((failure as Error).message)) }} className="px-0 text-inherit"><RefreshCw size={14} /> حدّث اللائحة وأعد الترتيب</Button></div>}
      <div className="flex shrink-0 items-center gap-2 border-t border-border pt-4">
        <Button type="button" disabled={saving || !dirty} onClick={() => void save()} className="min-h-11 flex-1">{saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}{saving ? 'كيتم الحفظ...' : 'حفظ الترتيب'}</Button>
        <Button type="button" variant="outline" disabled={saving} onClick={onCancel} className="min-h-11">إلغاء</Button>
      </div>
    </div>
  )
}
