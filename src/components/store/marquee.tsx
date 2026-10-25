'use client'

const ITEMS = [
  'توصيل فابور لجميع مدن المغرب',
  'تخفيض 50 د.م على كل جوج هوديات — كيتحسب تلقائياً',
  'تسبيق احتياطي 50 د.م فقط',
  'الدفع عبر واتساب — سهل وسريع',
  'دروب جديدة كل خميس',
  'منتجات أصلية مضمونة',
  'هوديات NOXwear بجودة عالية',
]

export function Marquee() {
  return (
    <div className="bg-primary text-primary-foreground py-2 overflow-hidden">
      <div className="flex whitespace-nowrap animate-marquee">
        {[...ITEMS, ...ITEMS, ...ITEMS].map((item, i) => (
          <span
            key={i}
            className="mx-6 text-xs font-medium tracking-wider flex items-center gap-2"
          >
            <span className="text-gold">◆</span>
            {item}
          </span>
        ))}
      </div>
    </div>
  )
}
