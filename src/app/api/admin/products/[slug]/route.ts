import { NextResponse } from 'next/server'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { isAdmin, sameOrigin } from '@/lib/admin/auth'
import { saveProduct, setProductDeleted } from '@/lib/admin/catalog-store'
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


const trashMutationSchema = z.object({ revision: z.string().min(1).max(300) })

async function changeTrashState(request: Request, params: Promise<{ slug: string }>, deleted: boolean) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'خاصك تدخل لحساب الإدارة' }, { status: 401 })
  if (!sameOrigin(request)) return NextResponse.json({ error: 'طلب غير مسموح' }, { status: 403 })
  const body = trashMutationSchema.safeParse(await request.json().catch(() => null))
  if (!body.success) return NextResponse.json({ error: 'حدّث اللائحة وحاول من جديد' }, { status: 400 })
  try {
    const { slug } = await params
    const result = await setProductDeleted(slug, body.data.revision, deleted)
    if (!result) return NextResponse.json({ error: 'المنتج ما بقاش موجود' }, { status: 404 })
    revalidatePath('/')
    return NextResponse.json(result, { headers: { 'Cache-Control': 'private, no-store' } })
  } catch (error) {
    return NextResponse.json({ error: error instanceof StorageConflictError ? 'تبدلات المنتجات فصفحة أخرى. حدّث اللائحة وحاول من جديد.' : 'تعذر إتمام العملية. حاول من جديد.' }, { status: error instanceof StorageConflictError ? 409 : 503 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  return changeTrashState(request, params, true)
}

export async function PATCH(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  return changeTrashState(request, params, false)
}
