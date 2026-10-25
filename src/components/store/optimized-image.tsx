import Image, { type ImageProps } from 'next/image'

const BLUR_DATA_URL =
  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPjxyZWN0IHdpZHRoPSI4IiBoZWlnaHQ9IjgiIGZpbGw9IiMxYjE5MTciLz48L3N2Zz4='

type OptimizedImageProps = Omit<ImageProps, 'fill' | 'placeholder' | 'blurDataURL'>

export function OptimizedImage({ alt, ...props }: OptimizedImageProps) {
  return (
    <Image
      {...props}
      alt={alt}
      fill
      placeholder="blur"
      blurDataURL={BLUR_DATA_URL}
      quality={75}
      decoding="async"
    />
  )
}
