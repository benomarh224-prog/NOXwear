'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { OptimizedImage } from './optimized-image'

interface ProductGalleryProps {
  images: string[]
  name: string
  children?: ReactNode
}

export function ProductGallery({ images, name, children }: ProductGalleryProps) {
  const [viewportRef, api] = useEmblaCarousel({
    align: 'start',
    duration: 24,
    breakpoints: { '(prefers-reduced-motion: reduce)': { duration: 0 } },
  })
  const [selected, setSelected] = useState(0)
  const thumbnailsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!api) return
    const syncSelection = () => setSelected(api.selectedScrollSnap())
    syncSelection()
    api.on('select', syncSelection)
    api.on('reInit', syncSelection)
    return () => {
      api.off('select', syncSelection)
      api.off('reInit', syncSelection)
    }
  }, [api])

  useEffect(() => {
    const rail = thumbnailsRef.current
    const thumbnail = rail?.children[selected] as HTMLElement | undefined
    if (!rail || !thumbnail) return
    // Scroll only the thumbnail rail; keep the product page in place.
    rail.scrollTo({
      left: thumbnail.offsetLeft - (rail.clientWidth - thumbnail.clientWidth) / 2,
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
    })
  }, [selected])

  return (
    <div className="min-w-0" role="region" aria-label="صور المنتج" aria-roledescription="carousel">
      <div className="relative overflow-hidden rounded-2xl border border-border bg-muted">
        <div
          ref={viewportRef}
          dir="ltr"
          tabIndex={images.length > 1 ? 0 : undefined}
          aria-label="اسحب للتنقل بين صور المنتج"
          className="overflow-hidden touch-pan-y touch-pinch-zoom outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gold"
          onKeyDown={(event) => {
            if (event.key === 'ArrowLeft') {
              event.preventDefault()
              api?.scrollPrev()
            } else if (event.key === 'ArrowRight') {
              event.preventDefault()
              api?.scrollNext()
            }
          }}
        >
          <div className="flex">
            {images.map((image, index) => (
              <div
                key={image}
                className="relative aspect-square min-w-0 flex-[0_0_100%] select-none"
                role="group"
                aria-roledescription="slide"
                aria-label={`الصورة ${index + 1} من ${images.length}`}
                aria-hidden={selected !== index}
              >
                <OptimizedImage
                  src={image}
                  alt={`${name} — الصورة ${index + 1}`}
                  className="object-cover"
                  sizes="(max-width: 1023px) calc(100vw - 32px), (max-width: 1280px) 50vw, 600px"
                  preload={index === 0}
                  loading={index === 0 ? undefined : Math.abs(selected - index) <= 1 ? 'eager' : 'lazy'}
                  draggable={false}
                />
              </div>
            ))}
          </div>
        </div>

        {children}

        {images.length > 1 && (
          <div dir="ltr" className="absolute inset-x-3 bottom-3 flex items-center justify-between pointer-events-none">
            <button
              type="button"
              onClick={() => api?.scrollPrev()}
              disabled={selected === 0}
              aria-label="الصورة السابقة"
              className="pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full bg-black/65 text-white disabled:opacity-30 focus-visible:outline-2 focus-visible:outline-gold"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <span className="rounded-full bg-black/65 px-3 py-1 text-xs tabular-nums text-white" aria-live="polite" aria-atomic="true">
              {selected + 1} / {images.length}
            </span>
            <button
              type="button"
              onClick={() => api?.scrollNext()}
              disabled={selected === images.length - 1}
              aria-label="الصورة التالية"
              className="pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full bg-black/65 text-white disabled:opacity-30 focus-visible:outline-2 focus-visible:outline-gold"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>

      {images.length > 1 && (
        <div ref={thumbnailsRef} dir="ltr" className="relative mt-3 flex gap-2 overflow-x-auto overscroll-x-contain pb-1" aria-label="اختيار صورة المنتج">
          {images.map((image, index) => (
            <button
              key={image}
              type="button"
              onClick={() => api?.scrollTo(index)}
              aria-label={`عرض الصورة ${index + 1}`}
              aria-pressed={selected === index}
              className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition-colors focus-visible:outline-2 focus-visible:outline-gold ${selected === index ? 'border-gold' : 'border-border'}`}
            >
              <OptimizedImage src={image} alt="" className="object-cover" sizes="64px" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
