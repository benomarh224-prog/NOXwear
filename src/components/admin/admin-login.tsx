'use client'

import { useState, type FormEvent } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { ArrowRight, LockKeyhole, Loader2 } from 'lucide-react'
import { BrandLogo } from '@/components/store/brand-logo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function AdminLogin({ configured }: { configured: boolean }) {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true); setError('')
    try {
      const result = await signIn('credentials', { password, redirect: false, callbackUrl: '/admin' })
      if (result?.ok) { router.replace('/admin'); router.refresh() }
      else setError('كلمة المرور غير صحيحة أو كاينين محاولات كثيرة. راجعها وحاول من جديد.')
    } catch { setError('تعذر الدخول دابا. حاول من جديد.') }
    finally { setBusy(false) }
  }

  return (
    <main className="min-h-dvh bg-[#0b0b0d] px-5 py-10 flex items-center justify-center">
      <div className="w-full max-w-md">
        <a href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground mb-10"><ArrowRight size={16} /> رجوع للمتجر</a>
        <div className="rounded-3xl border border-white/10 bg-[#131315] p-7 sm:p-9 shadow-2xl">
          <BrandLogo showTagline />
          <div className="mt-9 mb-6 flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-400/20 bg-amber-400/10 text-amber-400"><LockKeyhole size={22} /></div>
          <h1 className="text-2xl font-bold">مرحبا بك فلوحة الإدارة</h1>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">دخل باش تسيّر المنتجات، التصاور والأثمنة ديال NOXwear.</p>
          {!configured ? <p role="alert" className="mt-6 rounded-xl bg-amber-500/10 p-4 text-sm text-amber-300">الدخول للإدارة ما تفعّلش بعد. خاص إعداد حساب المالك.</p> : (
            <form onSubmit={submit} className="mt-7 space-y-5">
              <div className="space-y-2"><label htmlFor="admin-password" className="text-sm font-medium">كلمة المرور</label><Input id="admin-password" type="password" autoComplete="current-password" required maxLength={256} value={password} onChange={(event) => setPassword(event.target.value)} className="h-12 bg-black/20" /></div>
              {error && <p role="alert" className="text-sm leading-6 text-red-400">{error}</p>}
              <Button type="submit" disabled={busy} className="h-12 w-full bg-amber-400 font-bold text-black hover:bg-amber-300">{busy && <Loader2 className="animate-spin" size={16} />} دخول للإدارة</Button>
            </form>
          )}
        </div>
        <p className="mt-6 text-center text-xs text-muted-foreground">من إنشاء <bdi dir="ltr" className="font-medium text-amber-400">WebHBdev</bdi></p>
      </div>
    </main>
  )
}
