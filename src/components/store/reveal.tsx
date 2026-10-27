'use client'

import { type ReactNode } from 'react'

interface RevealProps {
  children: ReactNode
  className?: string
  delay?: number
}

// Render visible content first; the shared GSAP controller enhances it on scroll.
export function Reveal({ children, className, delay = 0 }: RevealProps) {
  return <div data-store-reveal data-reveal-delay={delay} className={className}>{children}</div>
}
