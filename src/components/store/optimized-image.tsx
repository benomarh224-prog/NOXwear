import Image, { type ImageProps } from 'next/image'

type OptimizedImageProps = Omit<ImageProps, 'fill' | 'placeholder' | 'blurDataURL'>

export function OptimizedImage({ alt, ...props }: OptimizedImageProps) {
  return (
    <Image
      {...props}
      alt={alt}
      fill
      placeholder="empty"
      quality={75}
      decoding="async"
    />
  )
}
