'use client'

import { type RefObject } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import type { View } from '@/lib/ui-store'

gsap.registerPlugin(ScrollTrigger, useGSAP)

interface StoreMotionProps {
  root: RefObject<HTMLDivElement | null>
  view: View
}

export default function StoreMotion({ root, view }: StoreMotionProps) {
  useGSAP(() => {
    const element = root.current
    if (!element) return
    const media = gsap.matchMedia()

    media.add('(prefers-reduced-motion: no-preference)', () => {
      const mobile = window.matchMedia('(max-width: 767px)').matches
      const entrances = new Map<HTMLElement, gsap.core.Animation>()
      const heroCopy = element.querySelector<HTMLElement>('[data-hero-copy]')
      const heroMain = element.querySelector<HTMLElement>('[data-hero-main]')
      const heroAccent = element.querySelector<HTMLElement>('[data-hero-accent]')

      if (heroCopy && !heroCopy.contains(document.activeElement)) {
        const timeline = gsap.timeline({ defaults: { ease: 'power3.out', duration: mobile ? 0.55 : 0.8 } })
        timeline.fromTo(heroCopy.children,
          { y: mobile ? 14 : 24, opacity: 0.35 },
          { y: 0, opacity: 1, stagger: mobile ? 0.045 : 0.075, clearProps: 'transform,opacity' },
        )
        if (heroMain) timeline.fromTo(heroMain,
          { y: 26, scale: 0.97, opacity: 0.6 },
          { y: 0, scale: 1, opacity: 1, clearProps: 'transform,opacity' }, 0.1,
        )
        if (heroAccent) timeline.fromTo(heroAccent,
          { y: 22, rotation: 3, scale: 0.96, opacity: 0.6 },
          { y: 0, rotation: 0, scale: 1, opacity: 1, clearProps: 'transform,opacity' }, 0.25,
        )
        entrances.set(heroCopy, timeline)
      }

      const reveal = (target: HTMLElement, delay = 0) => {
        if (target.contains(document.activeElement)) return
        const tween = gsap.fromTo(target,
          { y: mobile ? 18 : 30, opacity: 0.3, scale: 0.985 },
          {
            y: 0, opacity: 1, scale: 1,
            duration: mobile ? 0.5 : 0.7,
            delay: Math.min(Math.max(delay, 0), 0.18),
            ease: 'power3.out',
            immediateRender: false,
            clearProps: 'transform,opacity',
            scrollTrigger: { trigger: target, start: 'top 94%', once: true },
          },
        )
        entrances.set(target, tween)
      }

      element.querySelectorAll<HTMLElement>('[data-store-reveal]').forEach((target) => {
        reveal(target, Number(target.dataset.revealDelay || 0) / 1000)
      })
      element.querySelectorAll<HTMLElement>('main h2').forEach((heading) => {
        if (!heading.closest('[data-store-reveal]')) reveal(heading)
      })

      // A focused link/button must stay still and fully readable.
      const finishOnFocus = (event: FocusEvent) => {
        if (!(event.target instanceof Node)) return
        for (const [target, animation] of entrances) {
          if (target.contains(event.target)) {
            animation.scrollTrigger?.kill()
            animation.progress(1).kill()
          }
        }
      }
      element.addEventListener('focusin', finishOnFocus)
      return () => element.removeEventListener('focusin', finishOnFocus)
    }, element)

    media.add('(min-width: 1024px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)', () => {
      const collage = element.querySelector<HTMLElement>('[data-hero-collage]')
      const hero = element.querySelector<HTMLElement>('[data-hero-section]')
      if (!collage || !hero) return
      gsap.to(collage, {
        yPercent: -5,
        ease: 'none',
        scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: 0.7 },
      })
    }, element)

    return () => media.revert()
  }, { scope: root, dependencies: [view], revertOnUpdate: true })

  return null
}
