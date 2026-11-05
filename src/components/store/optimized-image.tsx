'use client'

import Image, { type ImageProps } from 'next/image'
import { MEDIA_IMAGE_PATH, mediaImageLoader, STATIC_IMAGE_COPIES } from '@/lib/media-image'

type OptimizedImageProps = Omit<ImageProps, 'fill' | 'placeholder' | 'blurDataURL' | 'loader'>

export function OptimizedImage({ alt, src, unoptimized, ...props }: OptimizedImageProps) {
  const uploaded = typeof src === 'string' && MEDIA_IMAGE_PATH.test(src)
  const source = typeof src === 'string' ? STATIC_IMAGE_COPIES[src] ?? src : src
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
    />
  )
}
