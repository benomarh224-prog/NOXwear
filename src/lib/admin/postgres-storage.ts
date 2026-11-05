import 'server-only'
import { createHash } from 'node:crypto'
import { Pool } from 'pg'

export function postgresStorageEnabled() {
  if (!process.env.VERCEL && process.env.NOX_ADMIN_LOCAL_STORAGE === '1') return false
  return Boolean(process.env.NOX_DATABASE_URL_POOLED || process.env.NOX_DATABASE_URL)
}
let pool: Pool | undefined
export function storageDatabase() {
  if (!pool) {
    const value = process.env.NOX_DATABASE_URL_POOLED || process.env.NOX_DATABASE_URL
    if (!value) throw new Error('Postgres storage is not configured')
    const connection = new URL(value)
    if (!['postgres:', 'postgresql:'].includes(connection.protocol)) throw new Error('Invalid database connection')
    connection.searchParams.delete('sslmode')
    pool = new Pool({ connectionString: connection.toString(), ssl: { rejectUnauthorized: true }, max: 2, idleTimeoutMillis: 10_000, connectionTimeoutMillis: 15_000, allowExitOnIdle: true })
    pool.on('error', () => console.warn('A storage connection was interrupted'))
  }
  return pool
}
export function validateObjectPath(path: string) {
  if (!/^[a-zA-Z0-9_./-]+$/.test(path) || path.includes('..') || path.startsWith('/') || path.length > 300) throw new Error('Invalid storage path')
}
export async function readDatabaseObject(path: string) {
  validateObjectPath(path)
  const result = await storageDatabase().query<{ body: Buffer; revision: string; content_type: string }>('SELECT body, revision, content_type FROM nox_objects WHERE path = $1', [path])
  return result.rows[0] || null
}
export async function writeDatabaseObject(path: string, bytes: Buffer, contentType: string, revision: string | null) {
  validateObjectPath(path)
  const nextRevision = createHash('sha256').update(bytes).digest('hex')
  const result = revision === null
    ? await storageDatabase().query('INSERT INTO nox_objects (path, body, content_type, revision) VALUES ($1, $2, $3, $4) ON CONFLICT (path) DO NOTHING RETURNING revision', [path, bytes, contentType, nextRevision])
    : await storageDatabase().query('UPDATE nox_objects SET body = $2, content_type = $3, revision = $4 WHERE path = $1 AND revision = $5 RETURNING revision', [path, bytes, contentType, nextRevision, revision])
  return result.rowCount ? nextRevision : null
}
export async function databaseObjectMetadata(path: string) {
  validateObjectPath(path)
  const result = await storageDatabase().query<{ size: number; revision: string }>('SELECT octet_length(body) AS size, revision FROM nox_objects WHERE path = $1', [path])
  return result.rows[0] || null
}
export async function databaseObjectRange(path: string, range: { start: number; end: number } | null) {
  validateObjectPath(path)
  const result = range
    ? await storageDatabase().query<{ body: Buffer }>('SELECT substring(body FROM $2 FOR $3) AS body FROM nox_objects WHERE path = $1', [path, range.start + 1, range.end - range.start + 1])
    : await storageDatabase().query<{ body: Buffer }>('SELECT body FROM nox_objects WHERE path = $1', [path])
  return result.rows[0]?.body || null
}
