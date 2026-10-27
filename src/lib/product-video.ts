export const MAX_PRODUCT_VIDEO_BYTES = 50 * 1024 * 1024
export const PRODUCT_VIDEO_FILENAME = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\.(mp4|webm)$/
export const PRODUCT_VIDEO_PATH = /^\/api\/product-videos\/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\.(mp4|webm)$/

export function videoExtension(type: string) {
  return type === 'video/mp4' ? 'mp4' : type === 'video/webm' ? 'webm' : null
}

export function validVideoHeader(bytes: Uint8Array, extension: string) {
  if (extension === 'mp4') {
    return bytes.length >= 16 && String.fromCharCode(...bytes.slice(4, 8)) === 'ftyp' && String.fromCharCode(...bytes.slice(8, 12)) !== 'qt  '
  }
  return extension === 'webm' && bytes.length >= 16 && bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3 && new TextDecoder().decode(bytes.slice(0, 4096)).includes('webm')
}

export function parseVideoRange(header: string | null, size: number): { start: number; end: number } | null | 'invalid' {
  if (!header) return null
  const match = /^bytes=(\d*)-(\d*)$/.exec(header)
  if (!match || (!match[1] && !match[2]) || size <= 0) return 'invalid'
  const first = match[1] ? Number(match[1]) : null
  const last = match[2] ? Number(match[2]) : null
  if ((first !== null && !Number.isSafeInteger(first)) || (last !== null && !Number.isSafeInteger(last))) return 'invalid'
  const start = first === null ? Math.max(0, size - (last || 0)) : first
  const end = first === null || last === null ? size - 1 : Math.min(last, size - 1)
  return start >= size || start > end ? 'invalid' : { start, end }
}
