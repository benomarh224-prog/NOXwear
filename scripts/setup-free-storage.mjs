import { readFile } from 'node:fs/promises'
import pg from 'pg'

if (!process.env.NOX_DATABASE_URL) process.loadEnvFile('.codex/free-storage-production.env')
const url = new URL(process.env.NOX_DATABASE_URL)
url.searchParams.delete('sslmode')
const client = new pg.Client({ connectionString: url.toString(), ssl: { rejectUnauthorized: true }, connectionTimeoutMillis: 15000 })
try {
  await client.connect()
  await client.query(await readFile(new URL('../migrations/001-free-storage.sql', import.meta.url), 'utf8'))
  console.log('NOXwear storage schema is ready. Existing objects were retained.')
} finally { await client.end() }
