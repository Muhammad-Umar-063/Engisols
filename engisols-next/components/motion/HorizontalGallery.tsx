'use client'

import { m, useScroll, useTransform } from 'motion/react'
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { useMotionPrefs } from '@/hooks/useMotionPrefs'

/**
 * Selected work gallery — animation spec section 8.1.
 *
 * Vertical scrolling drives a horizontal track. The outer section's height is
 * exactly `100vh + distance`, where distance is measured in pixels from the
 * track's real width with a ResizeObserver — never a hardcoded percentage,
 * because track width changes with card count and breakpoint. That equality is
 * what keeps scroll travel and horizontal travel in sync.
 *
 * Below 1024px this is NOT built: scroll hijacking on touch fights the OS, so
 * the same cards render as a native scroll-snap list. Reduced motion gets the
 * same fallback.
 */
export function HorizontalGallery({ children }: { children: ReactNode }) {
  const outerRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const [distance, setDistance] = useState(0)
  const [pinned, setPinned] = useState(false)
  const { reduced } = useMotionPrefs()

  useEffect(() => {
    const wide = window.matchMedia('(min-width: 64rem)')
    const update = () => setPinned(wide.matches && !reduced)
    update()
    wide.addEventListener('change', update)
    return () => wide.removeEventListener('change', update)
  }, [reduced])

  useLayoutEffect(() => {
    if (!pinned || !trackRef.current) return
    const measure = () => {
      if (!trackRef.current) return
      setDistance(Math.max(0, trackRef.current.scrollWidth - window.innerWidth))
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(trackRef.current)
    return () => ro.disconnect()
  }, [pinned])

  const { scrollYProgress } = useScroll({
    target: outerRef,
    offset: ['start start', 'end end'],
  })
  const x = useTransform(scrollYProgress, [0, 1], [0, -distance])

  if (!pinned) {
    return (
      <div className="-mx-6 flex snap-x snap-mandatory gap-step-3 overflow-x-auto px-6 pb-step-2 md:-mx-10 md:px-10 *:snap-start">
        {children}
      </div>
    )
  }

  return (
    <div ref={outerRef} style={{ height: `calc(100vh + ${distance}px)` }}>
      <div className="sticky top-0 flex h-svh items-center overflow-hidden">
        <m.div ref={trackRef} style={{ x }} className="flex w-max gap-step-4 px-6 md:px-10">
          {children}
        </m.div>
      </div>
    </div>
  )
}
