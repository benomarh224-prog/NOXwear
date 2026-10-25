import 'server-only'
import { createHmac, scryptSync, timingSafeEqual } from 'node:crypto'
import { getServerSession, type NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { readJson, writeJson, StorageConflictError } from './storage'

const OWNER_EMAIL = 'owner@noxwear.local'

export function adminConfigured() {
  return Boolean(process.env.NEXTAUTH_SECRET && process.env.ADMIN_PASSWORD_HASH)
}

async function allowLogin(ip: string) {
  const key = createHmac('sha256', process.env.NEXTAUTH_SECRET!).update(ip).digest('hex')
  const path = `admin/security/login-${key}.json`
  for (let attempt = 0; attempt < 3; attempt++) {
    const saved = await readJson<{ count: number; expiresAt: number }>(path)
    const now = Date.now()
    const fresh = !saved || saved.value.expiresAt <= now
    const counter = fresh ? { count: 0, expiresAt: now + 15 * 60 * 1000 } : saved.value
    if (counter.count >= 12) return false
    try {
      await writeJson(path, { ...counter, count: counter.count + 1 }, saved?.revision || null)
      return true
    } catch (error) {
      if (!(error instanceof StorageConflictError)) throw error
    }
  }
  return false
}

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: 'jwt', maxAge: 8 * 60 * 60 },
  pages: { signIn: '/admin/login', error: '/admin/login' },
  providers: [CredentialsProvider({
    name: 'NOXwear Admin',
    credentials: { password: { label: 'كلمة المرور', type: 'password' } },
    async authorize(credentials, request) {
      if (!adminConfigured()) return null
      const password = credentials?.password
      if (!password || password.length > 256) return null
      const ip = String(request.headers?.['x-vercel-forwarded-for'] || request.headers?.['x-forwarded-for'] || 'local').split(',')[0].trim()
      if (!(await allowLogin(ip))) return null
      const [salt, encoded] = process.env.ADMIN_PASSWORD_HASH!.split(':')
      if (!salt || !encoded || !/^[a-f0-9]{128}$/.test(encoded)) return null
      const expected = Buffer.from(encoded, 'hex')
      const supplied = scryptSync(password, salt, 64)
      if (!timingSafeEqual(supplied, expected)) return null
      return { id: 'noxwear-owner', name: 'NOXwear', email: OWNER_EMAIL }
    },
  })],
  callbacks: {
    async redirect({ url, baseUrl }) {
      try {
        const target = new URL(url, baseUrl)
        if (target.origin === baseUrl && target.pathname.startsWith('/admin')) return target.toString()
      } catch { /* Use the safe default below. */ }
      return `${baseUrl}/admin`
    },
  },
}

export async function isAdmin() {
  if (!adminConfigured()) return false
  const session = await getServerSession(authOptions)
  return session?.user?.email === OWNER_EMAIL
}

export function sameOrigin(request: Request) {
  const origin = request.headers.get('origin')
  return origin === new URL(request.url).origin
}
