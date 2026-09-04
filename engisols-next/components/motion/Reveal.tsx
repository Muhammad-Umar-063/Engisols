'use client'

import { m, useInView } from 'motion/react'
import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { useMotionPrefs } from '@/hooks/useMotionPrefs'
import { DUR, EASE } from '@/lib/motion'

/**
 * The mount gate — animation spec section 1.4.
 *
 * Motion's `initial` prop serialises into SSR output: `initial={{ opacity: 0 }}`
 * ships `style="opacity:0"`, so a JS failure leaves the content invisible
 * permanently. The element must therefore ship visible and at final position,
 * and the animation must exist only once React is running.
 *
 * BELOW-FOLD CONTENT ONLY. Above the fold this produces a visible flash
 * (browser paints final state, then JS hides it to animate); above-fold motion
 * is CSS keyframes instead (spec 1.5).
 *
 * ── Why this is not `initial={mounted ? {...} : false}` ──────────────────────
 *
 * It was, and that version never animated anything. `initial` is read on the
 * FIRST render and never again, and on the first client render `mounted` is
 * false — so every Reveal on the site mounted with `initial={false}`, which
 * tells Motion to start at the target. `whileInView` then had nothing to travel
 * from. Measured before the fix: every heading below the fold sat at opacity 1
 * from load and never transitioned, on this page and on the site.
 *
 * So the gate moved off `initial` and onto `animate`, which IS re-read. The
 * element renders visible, and once mounted it holds itself hidden until it
 * scrolls into view.
 *
 * `wasOnScreen` is what keeps that from flashing. `useInView` reports false
 * until its observer fires, roughly a frame after mount, so anything already on
 * screen would blink out and back. A layout-effect measurement — synchronous,
 * before paint — marks those elements and they are never hidden at all.
 */
/**
 * The gate on its own, for components that animate an element they cannot wrap
 * — a grid cell that also carries hover, a list item that must stay a list
 * item. Same contract as `Reveal`: render visible, hide once mounted, reveal on
 * entry, and never hide something that was already on screen.
 *
 * Hand-rolled `whileInView` with `initial={mounted ? … : false}` has the bug
 * described above, so it is not an alternative — it silently does nothing.
 */
export function useReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const { mounted, reduced } = useMotionPrefs()
  const inView = useInView(ref, { once: true, margin: '-12%' })
  const [wasOnScreen, setWasOnScreen] = useState(false)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    if (rect.top < window.innerHeight && rect.bottom > 0) setWasOnScreen(true)
  }, [])

  return { ref, reduced, hidden: mounted && !reduced && !wasOnScreen && !inView }
}

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
  const ref = useRef<HTMLDivElement>(null)
  const { mounted, reduced } = useMotionPrefs()
  const inView = useInView(ref, { once: true, margin: '-12%' })
  const [wasOnScreen, setWasOnScreen] = useState(false)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    if (rect.top < window.innerHeight && rect.bottom > 0) setWasOnScreen(true)
  }, [])

  const hidden = mounted && !reduced && !wasOnScreen && !inView

  return (
    <m.div
      ref={ref}
      className={className}
      initial={false}
      animate={hidden ? { opacity: 0, y } : { opacity: 1, y: 0 }}
      transition={
        hidden
          ? { duration: 0 }
          : { duration: DUR.standard, ease: EASE.enter, delay: reduced ? 0 : delay }
      }
    >
      {children}
    </m.div>
  )
}
