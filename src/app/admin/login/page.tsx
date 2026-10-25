import { redirect } from 'next/navigation'
import { adminConfigured, isAdmin } from '@/lib/admin/auth'
import { AdminLogin } from '@/components/admin/admin-login'

export const dynamic = 'force-dynamic'

export default async function LoginPage() {
  if (await isAdmin()) redirect('/admin')
  return <AdminLogin configured={adminConfigured()} />
}
