'use client'

import { ArrowLeft, CircleCheck, Crown, Shirt } from 'lucide-react'
import { FABRICS } from '@/lib/fabrics'
import { useUI } from '@/lib/ui-store'
import styles from './fabric-story.module.css'

export function FabricComparison() {
  const setView = useUI((s) => s.setView)

  return (
    <section id="fabric-comparison" data-fabric-comparison className={`${styles.story} ${styles.comparison}`} aria-labelledby="fabric-heading">
      <div className={styles.comparisonInner}>
        <div className={styles.sectionHeading}>
          <p className={styles.eyebrow}>اختر الجودة التي تناسبك</p> {/* taste-skill-ignore: Caption explicitly requested in the client reference. */}
          <h2 id="fabric-heading">قارن بين نوعي الثوب<br />المتوفرين</h2>
          <p>نوفر لك إمكانية اختيار نوع القماش لكل تصميم ترغب به في متجرنا.</p>
        </div>

        <div className={styles.cardGrid}>
          {FABRICS.map((fabric) => {
            const premium = fabric.id === 'turkish'
            const Icon = premium ? Crown : Shirt
            return (
              <article
                key={fabric.id}
                id={`fabric-${fabric.id}`}
                className={`${styles.fabricCard} ${premium ? styles.premiumCard : styles.localCard}`}
                aria-labelledby={`fabric-${fabric.id}-title`}
              >
                <p className={styles.cardBadge}><span aria-hidden="true">{fabric.flag}</span> {fabric.badge}</p>
                <div className={styles.cardTitle}>
                  <span className={styles.fabricIcon}><Icon aria-hidden="true" /></span>
                  <div>
                    <h3 id={`fabric-${fabric.id}-title`}>{fabric.name}<span lang="en" dir="ltr">({fabric.englishName})</span></h3>
                    <p>{fabric.description}</p>
                  </div>
                </div>
                <p className={styles.price}><bdi>{fabric.price}</bdi><span>درهم مغربي</span></p>
                <ul className={styles.featureList}>
                  {fabric.features.map((feature) => (
                    <li key={feature.title}>
                      <CircleCheck aria-hidden="true" />
                      <p><strong>{feature.title}:</strong> {feature.detail}</p>
                    </li>
                  ))}
                </ul>
                <button type="button" className={premium ? styles.primaryAction : styles.localAction} onClick={() => setView({ kind: 'search', query: '' })}>
                  تصفح تصاميم الهوديات <ArrowLeft aria-hidden="true" />
                </button>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
