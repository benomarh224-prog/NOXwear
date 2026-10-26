import assert from 'node:assert/strict'
import { readFile, unlink, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'
import vm from 'node:vm'
import ts from 'typescript'
import sharp from 'sharp'

const base = process.env.BASE_URL || 'http://localhost:3100'
assert.ok(['localhost', '127.0.0.1'].includes(new URL(base).hostname), 'Upload tests are local only')
const ip = `custom-print-test-${randomUUID()}`
const uploaded = []
const fixtures = await Promise.all(['png', 'jpeg', 'webp'].map(async (format) => ({
  format,
  bytes: await sharp({ create: { width: 32, height: 24, channels: 4, background: '#daa520' } }).toFormat(format).toBuffer(),
})))

function loadTypeScript(path) {
  const exports = {}
  const source = ts.transpileModule(path, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
  vm.runInNewContext(source, { exports, Buffer, URL })
  return exports
}

async function upload(bytes, type = 'image/png', origin = base) {
  const body = new FormData()
  body.set('file', new Blob([bytes], { type }), 'design.png')
  return fetch(`${base}/api/custom-designs`, { method: 'POST', headers: { Origin: origin, 'x-forwarded-for': ip }, body })
}

try {
  const messageApi = loadTypeScript(await readFile('src/lib/custom-print.ts', 'utf8'))
  const message = messageApi.buildCustomPrintMessage({ name: 'اختبار', color: 'أبيض', size: 'XL', position: 'القدام واللور', quantity: 2, idea: 'كتابة عربية', reference: 'https://example.com/design' }, 'https://www.noxwear.site/api/custom-designs/sample.png')
  for (const text of ['أبيض', 'XL', 'القدام واللور', 'الكمية: 2', 'كتابة عربية', 'https://example.com/design', 'https://www.noxwear.site/api/custom-designs/sample.png', 'الثمن ومدة الإنجاز']) assert.ok(message.includes(text))
  const url = new URL(`https://wa.me/212645900763?text=${encodeURIComponent(message)}`)
  assert.equal(url.searchParams.get('text'), message)

  const imageApi = loadTypeScript(await readFile('src/lib/design-image.ts', 'utf8'))
  for (const fixture of fixtures) assert.ok(imageApi.inspectDesignImage(fixture.bytes).contentType.startsWith('image/'))
  assert.throws(() => imageApi.inspectDesignImage(Buffer.from('<svg onload="alert(1)"/>')))
  const giant = Buffer.from(fixtures[0].bytes)
  giant.writeUInt32BE(50000, 16)
  assert.throws(() => imageApi.inspectDesignImage(giant))

  assert.equal((await upload(fixtures[0].bytes, 'image/png', 'https://other.example')).status, 403)
  assert.equal((await fetch(`${base}/api/custom-designs`, { method: 'POST', headers: { Origin: base, 'Content-Type': 'application/json' }, body: '{}' })).status, 400)
  assert.equal((await upload(Buffer.alloc(4 * 1024 * 1024 + 20000))).status, 413)
  assert.equal((await fetch(`${base}/api/custom-designs/not-a-design.png`)).status, 404)

  for (const fixture of fixtures) {
    const response = await upload(fixture.bytes, `image/${fixture.format}`)
    assert.equal(response.status, 201, await response.clone().text())
    const { url: path } = await response.json()
    assert.match(path, /^\/api\/custom-designs\/[a-f0-9-]+\.(png|jpg|webp)$/)
    uploaded.push(path.split('/').pop())
    const image = await fetch(new URL(path, base))
    assert.equal(image.status, 200)
    assert.equal(image.headers.get('x-content-type-options'), 'nosniff')
    assert.match(image.headers.get('x-robots-tag'), /noindex/)
    assert.deepEqual(Buffer.from(await image.arrayBuffer()), fixture.bytes)
  }
  assert.equal((await upload(Buffer.from('<svg onload="alert(1)"/>'), 'image/png')).status, 400)
  assert.equal((await upload(Buffer.alloc(0))).status, 400)
  assert.equal((await upload(giant)).status, 400)
  const concurrent = await Promise.all([upload(fixtures[0].bytes), upload(fixtures[0].bytes)])
  for (const response of concurrent) {
    assert.equal(response.status, 201)
    uploaded.push((await response.json()).url.split('/').pop())
  }
  assert.equal((await upload(fixtures[0].bytes)).status, 429)
  // A repeatable, non-sensitive image for manual browser preview/upload checks.
  await writeFile('.codex/custom-print-preview.png', fixtures[0].bytes)
  console.log('PASS: message details, image formats, upload/read round trip, origin and size checks, forged files, concurrent uploads and rate limit. No WhatsApp message sent.')
} finally {
  for (const filename of uploaded) await unlink(join(process.cwd(), '.codex/store/custom-designs/media', filename)).catch(() => {})
}
