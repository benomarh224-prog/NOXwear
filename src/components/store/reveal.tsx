'use client'

import { useEffect, useRef, type ReactNode } from 'react'

interface RevealProps {
  children: ReactNode
  className?: string
  delay?: number
}

// Content stays visible during SSR and if browser animations are unavailable.
export function Reveal({ children, className, delay = 0 }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = ref.current
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (!element || preference.matches || !window.IntersectionObserver || !element.animate) return

    let animation: Animation | undefined
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      observer.disconnect()
      // Never move an interactive card while a keyboard user is focusing it.
      if (element.contains(document.activeElement) || preference.matches) return
      animation = element.animate(
        [{ opacity: 0.25, transform: 'translateY(18px)' }, { opacity: 1, transform: 'translateY(0)' }],
        { duration: 520, delay: Math.min(Math.max(delay, 0), 180), easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'backwards' },
      )
    }, { threshold: 0.08 })
    const stop = () => animation?.cancel()
    const onPreferenceChange = () => {
      if (preference.matches) {
        observer.disconnect()
        stop()
      }
    }
    observer.observe(element)
    element.addEventListener('focusin', stop)
    preference.addEventListener('change', onPreferenceChange)
    return () => {
      observer.disconnect()
      stop()
      element.removeEventListener('focusin', stop)
      preference.removeEventListener('change', onPreferenceChange)
    }
  }, [delay])

  return <div ref={ref} className={className}>{children}</div>
}
