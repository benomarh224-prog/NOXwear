'use client'

import { type ReactNode } from 'react'

interface RevealProps {
  children: ReactNode
  className?: string
  delay?: number
}

// Keep layout wrappers stable; images must never fade out when entering the viewport.
export function Reveal({ children, className, delay = 0 }: RevealProps) {
  return <div data-store-reveal data-reveal-delay={delay} className={className}>{children}</div>
}
