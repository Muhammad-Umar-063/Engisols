"use client"

import {
  motion,
  useAnimationFrame,
  useInView,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
  wrap,
} from "motion/react"
import { useEffect, useRef, useState, type ReactNode } from "react"
import { tickerRepeatCount } from "@/lib/ticker-math"

/**
 * Seamless infinite ticker. Open-source stand-in for Motion+ `Ticker`.
 *
 * The naive version of this renders four copies of the content and wraps x
 * between -25% and 0%. It works right up until the content is narrower than the
 * container, at which point you get a visible gap, or wider, at which point you
 * get a visible jump. Percentage wrapping only holds for one content width.
 *
 * This measures one copy and wraps by that exact pixel width instead, then
 * renders however many copies are needed to cover the container plus one
 * spare. Correct at any content width, any container width, any font.
 */

interface TickerProps {
  children: ReactNode
  /** Baseline drift in px/s. Set 0 for a row that only moves when scrolling. */
  velocity?: number
  /** 1 moves left, -1 moves right. */
  direction?: 1 | -1
  /** How hard scroll velocity boosts the drift. 0 disables scroll linkage. */
  scrollBoost?: number
  /** Whether scrolling up reverses the row. Editorial rows usually want this. */
  reverseOnScrollUp?: boolean
  /** Space between repetitions, px. */
  gap?: number
  className?: string
  /** Read aloud once, rather than once per repetition. */
  label?: string
}

export function Ticker({
  children,
  velocity = 40,
  direction = 1,
  scrollBoost = 4,
  reverseOnScrollUp = true,
  gap = 64,
  className = "",
  label,
}: TickerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const copyRef = useRef<HTMLSpanElement>(null)
  const reduced = useReducedMotion()

  const [copyWidth, setCopyWidth] = useState(0)

  /**
   * One copy on the server, the rest added after measurement.
   *
   * The duplicates exist only to make the loop seamless; they carry no
   * information. Emitting them server-side would put the same phrase in the
   * HTML five or ten times over, which reads as keyword stuffing on a page
   * being optimised for search. One copy in, duplicates on the client.
   */
  const [repeat, setRepeat] = useState(1)

  /** Offscreen rows should not burn frames. */
  const inView = useInView(containerRef, { amount: 0 })

  useEffect(() => {
    const container = containerRef.current
    const copy = copyRef.current
    if (!container || !copy) return

    const measure = () => {
      const width = copy.getBoundingClientRect().width
      if (width === 0) return

      setCopyWidth(width)
      setRepeat(tickerRepeatCount(container.getBoundingClientRect().width, width))
    }

    measure()

    const observer = new ResizeObserver(measure)
    observer.observe(copy)
    observer.observe(container)

    // A webfont landing after hydration changes the copy width, and with it the
    // wrap distance. Without this the loop develops a visible seam.
    if (document.fonts?.ready) void document.fonts.ready.then(measure)

    return () => observer.disconnect()
  }, [children, gap])

  const baseX = useMotionValue(0)

  const { scrollY } = useScroll()
  const scrollVelocity = useVelocity(scrollY)
  const smoothVelocity = useSpring(scrollVelocity, {
    damping: 50,
    stiffness: 400,
  })
  const velocityFactor = useTransform(smoothVelocity, [0, 1000], [0, scrollBoost], {
    clamp: false,
  })

  /** Which way the row is currently travelling. Flipped by scroll direction. */
  const heading = useRef<number>(direction)

  useAnimationFrame((_, delta) => {
    if (reduced || !inView || copyWidth === 0) return

    // Tab-switch or a long frame hands back a huge delta. Uncapped, the row
    // teleports on return.
    const step = Math.min(delta, 64) / 1000

    const factor = velocityFactor.get()
    if (reverseOnScrollUp) {
      if (factor < 0) heading.current = -direction
      else if (factor > 0) heading.current = direction
    }

    let moveBy = heading.current * velocity * step
    // Scroll velocity scales the baseline rather than replacing it, so a row
    // with velocity 0 stays still and a fast row surges.
    moveBy += heading.current * moveBy * Math.abs(factor)

    baseX.set(baseX.get() - moveBy)
  })

  /**
   * Wrap by one copy's exact width. Because every copy is identical, landing
   * back at 0 is invisible.
   */
  const x = useTransform(baseX, (value) =>
    copyWidth ? wrap(-copyWidth, 0, value) : 0
  )

  return (
    <div
      ref={containerRef}
      className={`relative w-full overflow-hidden ${className}`}
      aria-label={label}
    >
      <motion.div style={{ x }} className="flex w-max will-change-transform">
        {Array.from({ length: repeat }, (_, i) => (
          <span
            key={i}
            /* Measure the first copy only. The rest are clones of it. */
            ref={i === 0 ? copyRef : undefined}
            aria-hidden
            className="shrink-0 whitespace-nowrap"
            style={{ paddingRight: gap }}
          >
            {children}
          </span>
        ))}
      </motion.div>
    </div>
  )
}
