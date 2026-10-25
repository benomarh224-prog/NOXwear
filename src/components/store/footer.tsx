'use client'

import { useState, type ComponentType, type SVGProps } from 'react'
import { Instagram, Facebook, MapPin, ArrowLeft, Shield, Truck, RefreshCw, HeadphonesIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useUI } from '@/lib/ui-store'
import { toast } from 'sonner'
import { BrandLogo } from './brand-logo'

const FOOTER_LINKS = [
  {
    title: 'تسوق',
    links: [
      { label: 'أنمي', slug: 'anime' },
      { label: 'عالم الشغف', slug: 'sports' },
      { label: 'حبر ومعنى', slug: 'arabic-art' },
      { label: 'خارج المألوف', slug: 'limitless-drops' },
    ],
  },
  {
    title: 'مساعدة',
    links: [
      { label: 'التوصيل والإرجاع', slug: '' },
      { label: 'دليل المقاسات', slug: '' },
      { label: 'تتبع الطلب', slug: '' },
      { label: 'أسئلة شائعة', slug: '' },
      { label: 'اتصل بنا', slug: '' },
    ],
  },
  {
    title: 'الشركة',
    links: [
      { label: 'قصتنا', slug: '' },
      { label: 'الاستدامة', slug: '' },
      { label: 'التعاونيات', slug: '' },
      { label: 'الوظائف', slug: '' },
      { label: 'الصحافة', slug: '' },
    ],
  },
]

const PERKS = [
  { icon: Truck, title: 'توصيل فابور', sub: 'لجميع مدن المغرب' },
  { icon: Shield, title: 'ضمان الأصالة', sub: 'كل منتج موثق' },
  { icon: RefreshCw, title: 'إرجاع خلال 30 يوم', sub: 'بدون أسئلة' },
  { icon: HeadphonesIcon, title: 'دعم 24/7 عبر واتساب', sub: 'نرد بسرعة' },
]

export function Footer() {
  const setView = useUI((s) => s.setView)
  const [email, setEmail] = useState('')

  const subscribe = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    toast.success('تم الاشتراك!', {
      description: 'ستصلك تنبيهات الدروب على ' + email,
    })
    setEmail('')
  }

  return (
    <footer className="mt-auto border-t border-border bg-card">
      {/* Perks bar */}
      <div className="border-b border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {PERKS.map((perk) => (
              <div key={perk.title} className="flex items-center gap-3 flex-row-reverse">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-gold shrink-0">
                  <perk.icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 text-right">
                  <p className="text-sm font-semibold truncate">{perk.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{perk.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main footer */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand + newsletter */}
          <div className="col-span-2 text-right">
            <div className="mb-4 flex justify-end">
              <BrandLogo showTagline />
            </div>

            <p className="text-sm text-muted-foreground mb-6 max-w-xs mr-0 ml-auto">
              ستريت وير، أنمي، عالم الشغف، وحبر ومعنى — لمن يرفضون العادي.
            </p>

            <form onSubmit={subscribe} className="space-y-2 max-w-sm mr-0 ml-auto">
              <label className="text-xs font-semibold tracking-wider text-muted-foreground block text-right">
                اشترك ليصلك إشعار الدروب
              </label>
              <div className="flex gap-2 flex-row-reverse">
                <Button type="submit" className="gradient-gold text-primary-foreground shrink-0">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-background"
                  required
                />
              </div>
            </form>

            <div className="mt-6 flex flex-wrap items-center gap-2" aria-label="تابع NOXwear">
              <SocialIcon icon={Instagram} label="إنستغرام" href="https://www.instagram.com/noxwear_morocco?dlrf=aXBxY3NmOTQ0M3pq" />
              <SocialIcon icon={Facebook} label="فيسبوك" href="https://www.facebook.com/share/1FTN9j8XnP/?mibextid=wwXIfr" />
              <SocialIcon icon={TikTokIcon} label="تيك توك" href="https://www.tiktok.com/@noxewear_morocco?_r=1&_t=ZS-9ArJjwxVX5Z" />
            </div>
          </div>

          {/* Links */}
          {FOOTER_LINKS.map((col) => (
            <div key={col.title} className="text-right">
              <h4 className="text-xs font-bold tracking-wider text-muted-foreground mb-4">
                {col.title}
              </h4>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <button
                      onClick={() => {
                        if (link.slug) {
                          setView({ kind: 'category', slug: link.slug })
                        } else {
                          toast.info('قريباً', { description: link.label })
                        }
                      }}
                      className="text-sm text-foreground/80 hover:text-gold transition-colors text-right"
                    >
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="text-xs text-muted-foreground text-right">
            <p>© 2026 NOXwear. جميع الحقوق محفوظة.</p>
            <p className="mt-1 flex items-center gap-1 justify-end flex-row-reverse">
              <MapPin className="h-3 w-3" />
              الدار البيضاء، المغرب
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground flex-row-reverse">
            <div className="flex items-center gap-1.5 px-2 py-1 rounded border border-border">
              <span>دفع آمن</span>
              <span className="text-gold">●</span>
            </div>
            <button className="hover:text-gold transition-colors">الكوكيز</button>
            <button className="hover:text-gold transition-colors">الشروط</button>
            <button className="hover:text-gold transition-colors">الخصوصية</button>
          </div>
        </div>
      </div>
    </footer>
  )
}

function SocialIcon({ icon: Icon, href, label }: { icon: ComponentType<SVGProps<SVGSVGElement>>; href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-border px-3 text-xs hover:border-gold hover:text-gold transition-colors"
      aria-label={label}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
      <span>{label}</span>
    </a>
  )
}

function TikTokIcon(props: SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M16.7 2h-3.4v13.2a2.8 2.8 0 1 1-2.4-2.8V8.9a6.2 6.2 0 1 0 5.8 6.2V8.4a8.2 8.2 0 0 0 4.8 1.5V6.5A4.8 4.8 0 0 1 16.7 2Z" /></svg>
}
