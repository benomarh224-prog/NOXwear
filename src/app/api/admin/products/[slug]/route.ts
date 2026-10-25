import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { isAdmin, sameOrigin } from '@/lib/admin/auth'
import { saveProduct } from '@/lib/admin/catalog-store'
import { saveProductSchema } from '@/lib/admin/product-schema'
import { StorageConflictError } from '@/lib/admin/storage'

export const runtime = 'nodejs'

export async function PUT(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'خاصك تدخل لحساب الإدارة' }, { status: 401 })
  if (!sameOrigin(request)) return NextResponse.json({ error: 'طلب غير مسموح' }, { status: 403 })
  const body = saveProductSchema.safeParse(await request.json().catch(() => null))
  if (!body.success) return NextResponse.json({ error: body.error.issues[0]?.message || 'راجع معلومات المنتج' }, { status: 400 })
  try {
    const { slug } = await params
    const result = await saveProduct(body.data.product, body.data.revision, slug)
    if (!result) return NextResponse.json({ error: 'المنتج ما بقاش موجود' }, { status: 404 })
    revalidatePath('/')
    return NextResponse.json(result, { headers: { 'Cache-Control': 'private, no-store' } })
  } catch (error) {
    return NextResponse.json({ error: error instanceof StorageConflictError ? 'تبدلات المنتجات فصفحة أخرى. حدّث اللائحة قبل الحفظ.' : 'تعذر حفظ التغييرات. حاول من جديد.' }, { status: error instanceof StorageConflictError ? 409 : 503 })
  }
}
