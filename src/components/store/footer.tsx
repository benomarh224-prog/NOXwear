'use client'

import { useState } from 'react'
import { Instagram, Twitter, Youtube, Mail, MapPin, ArrowLeft, Shield, Truck, RefreshCw, HeadphonesIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useUI } from '@/lib/ui-store'
import { toast } from 'sonner'

const FOOTER_LINKS = [
  {
    title: 'تسوق',
    links: [
      { label: 'هوديات', slug: 'hoodies' },
      { label: 'أنمي', slug: 'anime' },
      { label: 'رياضة', slug: 'sports' },
      { label: 'فن عربي', slug: 'arabic-art' },
      { label: 'دروب محدودة', slug: 'limitless-drops' },
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
            <div className="flex items-center gap-2 mb-4 flex-row-reverse justify-end">
              <div className="flex flex-col leading-none">
                <span className="font-black text-base tracking-tight">
                  NOX<span className="text-gold">wear</span>
                </span>
                <span className="text-[10px] text-muted-foreground tracking-[0.15em] uppercase">
                  Style • Identity • 2018
                </span>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-md gradient-gold text-primary-foreground font-black text-lg">
                N
              </div>
            </div>

            <p className="text-sm text-muted-foreground mb-6 max-w-xs mr-0 ml-auto">
              ستريت وير، أنمي، رياضة، وفن عربي مختار — لمن يرفضون العادي.
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

            <div className="flex items-center gap-2 mt-6 flex-row-reverse justify-end">
              <SocialIcon icon={Instagram} href="#" />
              <SocialIcon icon={Twitter} href="#" />
              <SocialIcon icon={Youtube} href="#" />
              <SocialIcon icon={Mail} href="#" />
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

function SocialIcon({ icon: Icon, href }: { icon: any; href: string }) {
  return (
    <a
      href={href}
      className="flex h-9 w-9 items-center justify-center rounded-lg border border-border hover:border-gold hover:text-gold transition-colors"
      aria-label="رابط اجتماعي"
    >
      <Icon className="h-4 w-4" />
    </a>
  )
}
