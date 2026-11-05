import { BrandLogo } from './brand-logo'

export function StoreUnavailable({ retryHref = '/' }: { retryHref?: string }) {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center bg-background px-6 py-12 text-center text-foreground" dir="rtl">
      <meta name="robots" content="noindex, nofollow" />
      <BrandLogo size="hero" showTagline />
      <div className="mt-12 max-w-sm">
        <h1 className="text-2xl font-bold leading-relaxed">المتجر غير متاح مؤقتاً</h1>
        <p className="mt-3 text-sm leading-7 text-muted-foreground">سمح لينا على هاد التوقف. عاود المحاولة من بعد شوية، أو تواصل معانا فالواتساب ونعاونوك.</p>
        <div className="mt-7 flex flex-col gap-3">
          <a href={retryHref} className="flex min-h-12 items-center justify-center rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground">عاود المحاولة</a>
          <a href="https://wa.me/212645900763" target="_blank" rel="noopener noreferrer" className="flex min-h-12 items-center justify-center rounded-lg border border-border px-5 py-3 text-sm font-semibold">تواصل معانا فالواتساب</a>
        </div>
      </div>
    </main>
  )
}
