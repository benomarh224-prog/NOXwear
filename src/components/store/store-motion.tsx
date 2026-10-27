'use client'

import { type RefObject } from 'react'
import { gsap } from 'gsap'
import { useGSAP } from '@gsap/react'
import type { View } from '@/lib/ui-store'

gsap.registerPlugin(useGSAP)

interface StoreMotionProps {
  root: RefObject<HTMLDivElement | null>
  view: View
}

export default function StoreMotion({ root, view }: StoreMotionProps) {
  useGSAP(() => {
    const element = root.current
    if (!element || view.kind !== 'home') return
    const media = gsap.matchMedia()

    // Product/category images stay fully visible and still at every scroll position.
    // Limit enhancement to one short text entrance on devices with a mouse.
    media.add('(min-width: 1024px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)', () => {
      const heading = element.querySelector<HTMLElement>('[data-hero-copy] h1')
      if (!heading || heading.contains(document.activeElement)) return
      const bounds = heading.getBoundingClientRect()
      // The optional animation chunk may arrive after the visitor has scrolled on.
      if (bounds.top < 0 || bounds.bottom > window.innerHeight) return
      const entrance = gsap.fromTo(heading,
        { y: 12 },
        { y: 0, duration: 0.45, ease: 'power2.out', clearProps: 'transform' },
      )
      const finish = () => entrance.progress(1).kill()
      heading.addEventListener('focusin', finish)
      return () => heading.removeEventListener('focusin', finish)
    }, element)

    return () => media.revert()
  }, { scope: root, dependencies: [view], revertOnUpdate: true })

  return null
}
