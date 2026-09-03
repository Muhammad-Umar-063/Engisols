"use client"

import {
  motion,
  useInView,
  useMotionValueEvent,
  useScroll,
  useTransform,
  type MotionValue,
} from "motion/react"
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react"
import { duration, ease, offset, spring } from "@/lib/motion"

/* ------------------------------------------------------------------ */
/* Hide header on scroll direction                                      */
/* react-scroll-hide-header / vue-scroll-hide-header                    */
/* ------------------------------------------------------------------ */

/**
 * Header retracts on scroll down, returns immediately on scroll up.
 *
 * Two guards that the naive version misses:
 *  - a 6px threshold, so trackpad jitter and iOS rubber-banding don't flicker it
 *  - it never hides inside the first viewport height, because hiding the nav
 *    while the user is still reading the hero feels like a bug
 */
export function HideOnScrollHeader({ children }: { children: ReactNode }) {
  const { scrollY } = useScroll()
  const [hidden, setHidden] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious() ?? 0
    const delta = latest - previous

    setScrolled(latest > 24)

    if (Math.abs(delta) < 6) return
    if (latest < window.innerHeight * 0.6) {
      setHidden(false)
      return
    }
    setHidden(delta > 0)
  })

  return (
    <motion.header
      animate={hidden ? "hidden" : "visible"}
      initial="visible"
      variants={{
        visible: { y: "0%" },
        hidden: { y: "-100%" },
      }}
      transition={{ duration: duration.base, ease: ease.out }}
      data-scrolled={scrolled}
      className="fixed inset-x-0 top-0 z-50 border-b border-transparent transition-colors duration-300 data-[scrolled=true]:border-[--alpine-oat] data-[scrolled=true]:bg-[--vanilla-cream]/85 data-[scrolled=true]:backdrop-blur-md"
    >
      {children}
    </motion.header>
  )
}

/* ------------------------------------------------------------------ */
/* Scroll highlight (scrollspy)                                         */
/* vue-scroll-highlight                                                 */
/* ------------------------------------------------------------------ */

/**
 * Section nav where the active item is marked by a single indicator that slides
 * between entries rather than each item toggling its own background.
 *
 * `layoutId` does the work: Motion measures the old and new positions and
 * interpolates, so the indicator travels the actual distance instead of
 * cross-fading in place.
 */
export function ScrollHighlightNav({
  sections,
}: {
  sections: { id: string; label: string }[]
}) {
  const [active, setActive] = useState(sections[0]?.id)
  const handleEnter = useCallback((id: string) => setActive(id), [])

  return (
    <nav className="sticky top-24 hidden lg:block" aria-label="On this page">
      <ul className="space-y-1">
        {sections.map((section) => (
          <li key={section.id} className="relative">
            {active === section.id ? (
              <motion.span
                layoutId="scroll-highlight"
                className="absolute inset-0 rounded-sm bg-[--alpine-oat]"
                transition={spring.ui}
              />
            ) : null}
            <a
              href={`#${section.id}`}
              aria-current={active === section.id ? "true" : undefined}
              className="relative block px-3 py-2 text-sm text-[--warm-greige] transition-colors aria-[current]:text-[--bordeaux-noir]"
            >
              {section.label}
            </a>
            <SectionObserver id={section.id} onEnter={handleEnter} />
          </li>
        ))}
      </ul>
    </nav>
  )
}

function SectionObserver({ id, onEnter }: { id: string; onEnter: (id: string) => void }) {
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const target = document.getElementById(id)
    if (!target) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) onEnter(id)
      },
      // Narrow band across the middle of the viewport, so exactly one section
      // is ever considered active during a fast scroll.
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 }
    )

    observer.observe(target)
    return () => observer.disconnect()
  }, [id, onEnter])

  return <span ref={ref} aria-hidden className="hidden" data-observes={id} />
}

/* ------------------------------------------------------------------ */
/* Track element in viewport                                            */
/* vue-scroll-track-element-in-viewport                                 */
/* ------------------------------------------------------------------ */

/**
 * Reports how far through the viewport an element currently is, as 0 to 1, and
 * hands it to a render prop. Useful as the driver for any bespoke effect you
 * want to wire up later without writing another useScroll block.
 */
export function TrackInViewport({
  children,
  className,
}: {
  children: (progress: MotionValue<number>, isVisible: boolean) => ReactNode
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: offset.cross as never,
  })
  const isVisible = useInView(ref, { amount: 0.01 })

  return (
    <div ref={ref} className={className}>
      {children(scrollYProgress, isVisible)}
    </div>
  )
}
