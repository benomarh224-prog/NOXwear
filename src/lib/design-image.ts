// Inspect raster headers without decoding untrusted images on the server.
export function inspectDesignImage(bytes: Buffer) {
  let width = 0, height = 0
  let extension: 'png' | 'jpg' | 'webp'
  let contentType: string
  if (bytes.length >= 33 && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) && bytes.toString('ascii', 12, 16) === 'IHDR') {
    extension = 'png'; contentType = 'image/png'
    width = bytes.readUInt32BE(16); height = bytes.readUInt32BE(20)
  } else if (bytes.length >= 30 && bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP') {
    extension = 'webp'; contentType = 'image/webp'
    const chunk = bytes.toString('ascii', 12, 16)
    if (chunk === 'VP8X') {
      width = bytes.readUIntLE(24, 3) + 1; height = bytes.readUIntLE(27, 3) + 1
    } else if (chunk === 'VP8 ' && bytes.subarray(23, 26).equals(Buffer.from([0x9d, 0x01, 0x2a]))) {
      width = bytes.readUInt16LE(26) & 0x3fff; height = bytes.readUInt16LE(28) & 0x3fff
    } else if (chunk === 'VP8L' && bytes[20] === 0x2f) {
      const bits = bytes.readUInt32LE(21)
      width = (bits & 0x3fff) + 1; height = ((bits >>> 14) & 0x3fff) + 1
    }
  } else if (bytes.length >= 4 && bytes[0] === 0xff && bytes[1] === 0xd8) {
    extension = 'jpg'; contentType = 'image/jpeg'
    let offset = 2
    while (offset + 4 <= bytes.length) {
      if (bytes[offset] !== 0xff) break
      while (bytes[offset] === 0xff) offset++
      const marker = bytes[offset++]
      if (marker === 0xda || marker === 0xd9) break
      if (offset + 2 > bytes.length) break
      const length = bytes.readUInt16BE(offset)
      if (length < 2 || offset + length > bytes.length) break
      if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker) && length >= 7) {
        height = bytes.readUInt16BE(offset + 3); width = bytes.readUInt16BE(offset + 5)
        break
      }
      offset += length
    }
  } else {
    throw new Error('Unsupported image')
  }
  if (!width || !height || width > 20000 || height > 20000 || width * height > 40_000_000) throw new Error('Invalid dimensions')
  return { extension, contentType }
}
