// Storefront comparison copy. Catalogue and checkout prices remain admin-managed.
export const FABRICS = [
  {
    id: 'turkish',
    name: 'الثوب التركي',
    shortName: 'تركي',
    englishName: 'Turkish Premium',
    flag: '🇹🇷',
    price: 269,
    badge: 'المفضل لدى الزبناء',
    description: 'جودة فاخرة ممتازة للغاية',
    features: [
      { title: 'وزن ثقيل جداً', detail: '380 GSM، قطن ممشوط 100%.' },
      { title: 'بطانة داخلية', detail: 'ملمس مخملي دافئ وناعم على الجلد.' },
      { title: 'قصة Oversized', detail: 'ثبات ممتاز للهودي بدون تغير الشكل بعد الغسيل.' },
      { title: 'عمر طويل', detail: 'مقاوم للتوبر والتمدد حتى مع الغسيل المتكرر.' },
    ],
  },
  {
    id: 'local',
    name: 'الثوب المغربي',
    shortName: 'مغربي',
    englishName: 'Local Standard',
    flag: '🇲🇦',
    price: 199,
    badge: 'اقتصادي وممتاز',
    description: 'جودة عالية بسعر اقتصادي',
    features: [
      { title: 'وزن متوسط إلى ثقيل', detail: '300 GSM، قطن ممتاز.' },
      { title: 'مريح جداً', detail: 'مناسب للاستعمال اليومي وفصول السنة المختلفة.' },
      { title: 'قصة ستريت وير', detail: 'قصة عصرية ومريحة عند الارتداء.' },
      { title: 'طباعة احترافية', detail: 'نفس جودة طباعة DTF الدقيقة والمعمرة.' },
    ],
  },
] as const
