'use client'

import {
  m,
  useAnimationFrame,
  useInView,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
  wrap,
} from 'motion/react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useMotionPrefs } from '@/hooks/useMotionPrefs'
import { spring } from '@/lib/motion'
import { coversStrip, tickerRepeatCount } from '@/lib/ticker-math'

/**
 * Seamless infinite ticker, driven by scroll velocity — the engine behind
 * `ScrollTextLines`, adapted from Motion's `ticker` source
 * (`motion-source/ticker.tsx`).
 *
 * NOT the same component as `Ticker.tsx`, and it does not replace it. That one
 * is a CSS marquee and a SERVER component because it sits in the hero, above
 * the fold, where spec 1.5 bans the animation library outright. This one is
 * JavaScript on every frame and belongs below the fold only.
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

interface VelocityTickerProps {
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

export function VelocityTicker({
  children,
  velocity = 40,
  direction = 1,
  scrollBoost = 4,
  reverseOnScrollUp = true,
  gap = 64,
  className = '',
  label,
}: VelocityTickerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const copyRef = useRef<HTMLSpanElement>(null)
  const { reduced } = useMotionPrefs()

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

      const containerWidth = container.getBoundingClientRect().width
      const count = tickerRepeatCount(containerWidth, width)

      setCopyWidth(width)
      setRepeat(count)

      // The source ships `coversStrip` for its unit tests. There is no test
      // runner here, so the invariant is asserted against the real measurement:
      // if it ever fails, the row drops a gap once per loop and it is much
      // easier to read this than to chase a flicker.
      if (process.env.NODE_ENV !== 'production' && !coversStrip(containerWidth, width, count)) {
        console.warn(
          '[VelocityTicker] Repeat count does not cover the strip; the loop will gap once per cycle.',
          { containerWidth, copyWidth: width, repeat: count },
        )
      }
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
  const smoothVelocity = useSpring(scrollVelocity, spring.velocity)
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

    // Scroll velocity scales the baseline rather than replacing it, so a row
    // with velocity 0 stays still and a fast row surges.
    //
    // Deviation from the source, which writes this as
    // `moveBy += heading.current * moveBy * Math.abs(factor)`. Because moveBy
    // already carries the heading, that squares it: the boost comes out
    // positive for every row regardless of which way it is travelling. Rows
    // with direction -1 then slow, stop and reverse as you scroll faster, and
    // the stack collapses into a single direction — which is precisely the
    // "one moving block" the effect exists to avoid. Scaling the magnitude and
    // leaving the sign alone is what the surrounding comment describes.
    const moveBy = heading.current * velocity * step * (1 + Math.abs(factor))

    baseX.set(baseX.get() - moveBy)
  })

  /**
   * Wrap by one copy's exact width. Because every copy is identical, landing
   * back at 0 is invisible.
   */
  const x = useTransform(baseX, (value) => (copyWidth ? wrap(-copyWidth, 0, value) : 0))

  const running = inView && !reduced

  return (
    <div
      ref={containerRef}
      className={`relative w-full overflow-hidden ${className}`}
      aria-label={label}
    >
      <m.div
        style={{ x }}
        // Promoted only while it is actually moving. A stack of five rows
        // holding composited layers for the whole session is exactly the kind
        // of permanent promotion that leaves unpainted tiles behind.
        className={`flex w-max ${running ? 'will-change-transform' : ''}`}
      >
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
      </m.div>
    </div>
  )
}
