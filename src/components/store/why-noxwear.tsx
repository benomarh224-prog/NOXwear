import { Layers3, Printer, Shirt } from 'lucide-react'
import storyStyles from './fabric-story.module.css'
import styles from './why-noxwear.module.css'

const REASONS = [
  {
    icon: Layers3,
    title: <>قماش ثقيل <bdi>380 GSM</bdi></>,
    description: <>في الخيار التركي: قطن ممشوط <bdi>100%</bdi>، بملمس دافئ وناعم. ويتوفر أيضاً الثوب المغربي الممتاز بوزن <bdi>300 GSM</bdi>.</>,
  },
  {
    icon: Printer,
    title: <>طباعة <bdi>DTF</bdi> بتفاصيل دقيقة</>,
    description: <>تصاميم واضحة وطباعة ثابتة، بنفس الجودة على الثوب التركي والمغربي. كل تفصيلة كتكمّل الستايل ديالك.</>,
  },
  {
    icon: Shirt,
    title: 'قصة مريحة، هوية خاصة',
    description: <>قصة ستريت وير عصرية ومريحة، وتصاميم كتعبّر عليك. من الأنمي لعالم الشغف، اختار الستايل اللي كيشبه ليك.</>,
  },
]

export function WhyNoxwear() {
  return (
    <section id="why-noxwear" aria-labelledby="why-noxwear-title" className={`${storyStyles.story} ${styles.section}`}>
      <div className={styles.inner}>
        <div className={styles.heading}>
          <h2 id="why-noxwear-title">لماذا يختار الشباب<br /><bdi>NOXwear</bdi>؟</h2>
          <p>نحرص على تقديم أعلى جودة ممكنة في كل قطعة ننتجها بمدينة الدار البيضاء.</p>
        </div>
        <div className={styles.grid}>
          {REASONS.map(({ icon: Icon, title, description }, index) => (
            <article key={index} className={styles.reason}>
              <span className={styles.icon}><Icon aria-hidden="true" /></span>
              <div className={styles.reasonCopy}>
                <h3>{title}</h3>
                <p>{description}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
