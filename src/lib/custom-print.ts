export const DESIGN_MAX_BYTES = 4 * 1024 * 1024
export const PRINT_SIZES = ['S', 'M', 'L', 'XL', 'XXL'] as const
export const PRINT_COLORS = ['أسود', 'أبيض'] as const
export const PRINT_POSITIONS = ['القدام', 'اللور', 'القدام واللور'] as const

export interface CustomPrintDetails {
  name: string
  size: string
  color: string
  position: string
  quantity: number
  idea: string
  reference: string
}

export function buildCustomPrintMessage(details: CustomPrintDetails, imageUrl?: string) {
  const lines = ['🎨 *طلب طبعة خاصة — NOXwear*', '']
  if (details.name.trim()) lines.push(`الاسم: ${details.name.trim()}`)
  lines.push('المنتج: هودي', `المقاس: ${details.size}`, `اللون: ${details.color}`,
    `مكان الطبعة: ${details.position}`, `الكمية: ${details.quantity}`)
  if (details.idea.trim()) lines.push('', `💡 الفكرة: ${details.idea.trim()}`)
  if (details.reference.trim()) lines.push('', `🔗 مرجع التصميم: ${details.reference.trim()}`)
  if (imageUrl) lines.push('', `📷 التصميم المطلوب: ${imageUrl}`)
  lines.push('', 'بغيت نأكد معاكم التصميم والثمن ومدة الإنجاز قبل تثبيت الطلب.')
  return lines.join('\n')
}
