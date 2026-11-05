'use client'

import { useState } from 'react'
import { ImageOff } from 'lucide-react'
import Image, { type ImageProps } from 'next/image'
import { MEDIA_IMAGE_PATH, mediaImageLoader, STATIC_IMAGE_COPIES } from '@/lib/media-image'

type OptimizedImageProps = Omit<ImageProps, 'fill' | 'placeholder' | 'blurDataURL' | 'loader'>

export function OptimizedImage({ alt, src, unoptimized, onError, ...props }: OptimizedImageProps) {
  const [failedSource, setFailedSource] = useState<ImageProps['src'] | null>(null)
  const uploaded = typeof src === 'string' && MEDIA_IMAGE_PATH.test(src)
  const source = typeof src === 'string' ? STATIC_IMAGE_COPIES[src] ?? src : src
  if (failedSource === src) return (
    <span className="absolute inset-0 flex items-center justify-center bg-muted text-muted-foreground" role={alt ? 'img' : undefined} aria-label={alt ? alt + ' — الصورة غير متاحة مؤقتاً' : undefined} aria-hidden={!alt} title="الصورة غير متاحة مؤقتاً">
      <ImageOff className="h-6 w-6" aria-hidden="true" />
    </span>
  )
  return (
    <Image
      {...props}
      src={source}
      alt={alt}
      fill
      loader={uploaded ? mediaImageLoader : undefined}
      unoptimized={unoptimized || !uploaded}
      placeholder="empty"
      quality={75}
      decoding="async"
      onError={(event) => { setFailedSource(src); onError?.(event) }}
    />
  )
}
