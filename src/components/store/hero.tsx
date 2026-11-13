'use client'

import { ArrowLeft, Printer, Shirt, Truck } from 'lucide-react'
import { useUI } from '@/lib/ui-store'
import { FABRICS } from '@/lib/fabrics'
import { OptimizedImage } from './optimized-image'
import styles from './fabric-story.module.css'

const [turkishFabric, moroccanFabric] = FABRICS

interface HeroProps {
  featuredImage: string
  accentImage: string
}

export function Hero({ featuredImage, accentImage }: HeroProps) {
  const setView = useUI((s) => s.setView)

  function showSection(id: string) {
    const target = document.getElementById(id)
    const specifications = target?.querySelector('details')
    if (specifications) specifications.open = true
    target?.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
      block: 'start',
    })
  }

  return (
    <section data-hero-section className={`${styles.story} ${styles.hero}`} aria-labelledby="hero-title">
      <div className={styles.heroLayout}>
        <div data-hero-copy className={styles.copy}>
          <p className={styles.drop}>إصدارات محدودة <span aria-hidden="true">|</span> <bdi>DROP 2026</bdi></p>
          <h1 id="hero-title" className={styles.headline}>
            ارتدِ هويتك.<br /><span>خارج المألوف.</span>
          </h1>
          <p className={styles.intro}>
            هوديات ستريت وير بتصاميم استثنائية وطباعة <bdi>DTF</bdi> عالية الدقة.
            متوفرة الآن بنوعين من الثوب: <strong>الثوب التركي الثقيل ({turkishFabric.price} د.م)</strong> أو{' '}
            <strong>الثوب المغربي الممتاز ({moroccanFabric.price} د.م).</strong>
          </p>

          <div className={styles.fabricLinks}>
            <p>اختر نوع الثوب<br className={styles.desktopBreak} /> المناسب لميزانيتك:</p>
            <div className={styles.fabricChoices}>
              {FABRICS.map((fabric) => (
                <button
                  key={fabric.id}
                  type="button"
                  className={`${styles.fabricChip} ${fabric.id === 'turkish' ? styles.turkishChip : styles.localChip}`}
                  aria-label={`شوف تفاصيل الثوب ${fabric.shortName}، ${fabric.price} درهم`}
                  onClick={() => showSection(`fabric-${fabric.id}`)}
                >
                  <span><span aria-hidden="true">{fabric.flag}</span> {fabric.shortName}</span>
                  <span><bdi>{fabric.price}</bdi> د.م</span>
                </button>
              ))}
            </div>
          </div>

          <ul className={styles.benefits} aria-label="مميزات الهوديات">
            <li><Shirt aria-hidden="true" /><span>خياران للقطن</span></li>
            <li><Printer aria-hidden="true" /><span>طباعة <bdi>DTF</bdi> ثابتة</span></li>
            <li><Truck aria-hidden="true" /><span>توصيل <bdi>24–48</bdi> ساعة</span></li>
          </ul>

          <div className={styles.actions}>
            <button type="button" className={styles.primaryAction} onClick={() => setView({ kind: 'search', query: '' })}>
              اختر هوديك واطلب الآن <ArrowLeft aria-hidden="true" />
            </button>
            <button type="button" className={styles.secondaryAction} onClick={() => showSection('store-collections')}>
              استكشف المجموعة
            </button>
          </div>
        </div>

        <div data-hero-collage className={styles.collage}>
          <div data-hero-main className={styles.mainImage}>
            <OptimizedImage
              src={featuredImage}
              alt="هودي الحصان الأسود بلوغو واسم NOXwear"
              className="object-cover"
              sizes="(max-width: 639px) 75vw, (max-width: 1023px) 405px, 420px"
              preload
            />
          </div>
          <div data-hero-accent className={styles.accentImage}>
            <OptimizedImage
              src={accentImage}
              alt="هودي ساموراي أسود وأحمر بلوغو واسم NOXwear"
              className="object-cover"
              sizes="(max-width: 639px) 48vw, 270px"
              loading="eager"
            />
          </div>
          <p className={styles.imageCaption}>ستايلك. هويتك.<span dir="ltr">NOXwear</span></p>
        </div>
      </div>
    </section>
  )
}
