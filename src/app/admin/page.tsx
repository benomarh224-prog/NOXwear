import { redirect } from 'next/navigation'
import { isAdmin } from '@/lib/admin/auth'
import { readCatalog } from '@/lib/admin/catalog-store'
import { adminCategories } from '@/lib/admin/product-schema'
import { ProductDashboard } from '@/components/admin/product-dashboard'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  if (!(await isAdmin())) redirect('/admin/login')
  const { document, revision } = await readCatalog()
  return <ProductDashboard initialProducts={document.products} initialRevision={revision} categories={adminCategories} />
}
