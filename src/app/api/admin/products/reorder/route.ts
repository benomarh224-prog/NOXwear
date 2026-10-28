import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { isAdmin, sameOrigin } from '@/lib/admin/auth'
import { InvalidProductOrderError, reorderProducts } from '@/lib/admin/catalog-store'
import { reorderProductsSchema } from '@/lib/admin/product-schema'
import { StorageConflictError } from '@/lib/admin/storage'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'خاصك تدخل لحساب الإدارة' }, { status: 401 })
  if (!sameOrigin(request)) return NextResponse.json({ error: 'طلب غير مسموح' }, { status: 403 })
  const body = reorderProductsSchema.safeParse(await request.json().catch(() => null))
  if (!body.success) return NextResponse.json({ error: 'راجع القسم ولائحة الترتيب' }, { status: 400 })
  try {
    const result = await reorderProducts(body.data.categorySlug, body.data.slugs, body.data.revision)
    revalidatePath('/')
    return NextResponse.json(result, { headers: { 'Cache-Control': 'private, no-store' } })
  } catch (error) {
    const conflict = error instanceof StorageConflictError
    const invalid = error instanceof InvalidProductOrderError
    return NextResponse.json({ error: conflict ? 'تبدلات المنتجات. حدّث اللائحة ورتّبها من جديد.' : invalid ? 'لائحة الترتيب ما كتطابقش منتجات القسم. حدّث اللائحة.' : 'تعذر حفظ الترتيب. حاول من جديد.' }, { status: conflict ? 409 : invalid ? 400 : 503 })
  }
}
