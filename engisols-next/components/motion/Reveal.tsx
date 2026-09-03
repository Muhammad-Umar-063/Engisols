'use client'

import { m } from 'motion/react'
import type { ReactNode } from 'react'
import { useMotionPrefs } from '@/hooks/useMotionPrefs'
import { DUR, EASE } from '@/lib/motion'

/**
 * The mount gate — animation spec section 1.4.
 *
 * Motion's `initial` prop serialises into SSR output: `initial={{ opacity: 0 }}`
 * ships `style="opacity:0"`, so a JS failure leaves the content invisible
 * permanently. `initial={false}` on the server render writes no transform into
 * the HTML — the element ships visible and at final position, and the animation
 * only exists once React mounts.
 *
 * BELOW-FOLD CONTENT ONLY. Above the fold this produces a visible flash
 * (browser paints final state, then JS hides it to animate); above-fold motion
 * is CSS keyframes instead (spec 1.5).
 */
export function Reveal({
  children,
  y = 16,
  delay = 0,
  className,
}: {
  children: ReactNode
  /** Entrance distance — 8, 16 or 24 (spec 1.2). */
  y?: 8 | 16 | 24
  delay?: number
  className?: string
}) {
  const { mounted, reduced } = useMotionPrefs()

  return (
    <m.div
      className={className}
      initial={mounted ? { opacity: 0, y: reduced ? 0 : y } : false}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-15%' }}
      transition={{ duration: DUR.standard, ease: EASE.enter, delay }}
    >
      {children}
    </m.div>
  )
}
