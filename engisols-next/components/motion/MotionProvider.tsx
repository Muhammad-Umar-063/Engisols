'use client'

import { LazyMotion, domAnimation } from 'motion/react'
import type { ReactNode } from 'react'

/**
 * Import discipline — animation spec section 1.6.
 *
 * One LazyMotion at the app root; every leaf file uses `m` components and never
 * imports the full `motion` bundle. `strict` makes an accidental `motion.*`
 * import throw in development instead of silently shipping the extra bytes.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      {children}
    </LazyMotion>
  )
}
