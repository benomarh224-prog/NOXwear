import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { isAdmin, sameOrigin } from '@/lib/admin/auth'
import { readCatalog, saveProduct } from '@/lib/admin/catalog-store'
import { saveProductSchema } from '@/lib/admin/product-schema'
import { StorageConflictError } from '@/lib/admin/storage'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: 'خاصك تدخل لحساب الإدارة' }, { status: 401 })
  try {
    const { document, revision } = await readCatalog()
    return NextResponse.json({ products: document.products, revision }, { headers: { 'Cache-Control': 'private, no-store' } })
  } catch {
    return NextResponse.json({ error: 'تعذر تحميل المنتجات. حاول من جديد.' }, { status: 503 })
  }
}

export async function POST(request: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'خاصك تدخل لحساب الإدارة' }, { status: 401 })
  if (!sameOrigin(request)) return NextResponse.json({ error: 'طلب غير مسموح' }, { status: 403 })
  const body = saveProductSchema.safeParse(await request.json().catch(() => null))
  if (!body.success) return NextResponse.json({ error: body.error.issues[0]?.message || 'راجع معلومات المنتج' }, { status: 400 })
  try {
    const result = await saveProduct(body.data.product, body.data.revision)
    revalidatePath('/')
    return NextResponse.json(result, { status: 201, headers: { 'Cache-Control': 'private, no-store' } })
  } catch (error) {
    return NextResponse.json({ error: error instanceof StorageConflictError ? 'تبدلات المنتجات فصفحة أخرى. حدّث اللائحة قبل الحفظ.' : 'تعذر حفظ المنتج. المعلومات ما تبدلاتش، حاول من جديد.' }, { status: error instanceof StorageConflictError ? 409 : 503 })
  }
}
