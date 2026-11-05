// A bounded set of immutable image variants, served by our media route.
export const MEDIA_IMAGE_WIDTHS = [96, 320, 640, 960, 1280, 1800] as const
export const MEDIA_IMAGE_PATH = /^\/api\/media\/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\.webp$/

export function mediaImageLoader({ src, width }: { src: string; width: number }) {
  if (!MEDIA_IMAGE_PATH.test(src)) return src
  const size = MEDIA_IMAGE_WIDTHS.find((candidate) => candidate >= width) ?? 1800
  return src + '?w=' + size
}

// These copies preserve the artwork while avoiding multi-megabyte PNG downloads.
export const STATIC_IMAGE_COPIES: Record<string, string> = {
  '/hero/noxwear-horse-card-v2.png': '/hero/noxwear-horse-card-v2.webp',
  '/hero/noxwear-samurai-card-v2.png': '/hero/noxwear-samurai-card-v2.webp',
  '/categories/arabic-art-dark.png': '/categories/arabic-art-dark.webp',
}
