'use client'

import { m, useScroll, useTransform } from 'motion/react'
import { useRef, type ReactNode } from 'react'
import { useMotionPrefs } from '@/hooks/useMotionPrefs'
import { offset } from '@/lib/motion'
import { VelocityTicker } from '@/components/motion/VelocityTicker'

/**
 * Scroll text lines — adapted from Motion's `scroll-text-lines` example
 * (`motion-source/scroll-text-lines.tsx`).
 *
 * Editorial stacked marquee. Several rows of infinitely repeating text running
 * horizontally, each at its own speed, all driven by scroll velocity. Scrolling
 * down pushes the rows one way, scrolling up pulls them back.
 *
 * The effect lives in the speed differential, not in the movement itself. Rows
 * at identical speeds read as one moving block. Rows at different speeds
 * separate into planes and the stack gains depth, which is why the defaults
 * below spread across a wide range rather than clustering.
 *
 * Alternating direction per row is the other half of it. A stack all sliding
 * the same way is a marquee. A stack sliding opposite ways is editorial.
 *
 * Palette translation. The demo puts its accent on the separator glyph; cherry
 * cannot take that job here (spec palette rule 2: full-bleed panels and filled
 * CTAs, never an inline accent), so the separator is greige — the token whose
 * stated job is rules and separators — and so is the outline stroke. The filled
 * rows are bordeaux.
 *
 * `ground` exists because the feathered edges are a gradient TO the section's
 * own background: hardcode vanilla and the fade shows as a pale smear the
 * moment this band sits on oat.
 */

export interface TextLine {
  text: string
  /** Baseline drift px/s. Larger reads as nearer. */
  velocity?: number
  direction?: 1 | -1
  /** Outline rather than filled, for the receding rows. */
  outline?: boolean
  className?: string
}

const GROUND = {
  vanilla: { from: 'from-vanilla', bg: 'bg-vanilla' },
  oat: { from: 'from-oat', bg: 'bg-oat' },
} as const

export function ScrollTextLines({
  lines,
  separator = '✳',
  ground = 'vanilla',
  className = '',
}: {
  lines: TextLine[]
  /** Glyph between repetitions. Set null for plain repeating text. */
  separator?: ReactNode | null
  ground?: keyof typeof GROUND
  className?: string
}) {
  const ref = useRef<HTMLElement>(null)
  const { mounted, reduced } = useMotionPrefs()

  /**
   * A slight vertical counter-drift across the whole stack as it crosses the
   * viewport. Cheap, and it stops the block feeling bolted to the page.
   */
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: [...offset.cross],
  })
  const y = useTransform(scrollYProgress, [0, 1], ['6%', '-6%'])

  const drifting = mounted && !reduced

  return (
    <section
      ref={ref}
      className={`relative overflow-hidden py-step-6 ${GROUND[ground].bg} ${className}`}
      aria-label={lines.map((line) => line.text).join(', ')}
    >
      <m.div
        style={drifting ? { y } : undefined}
        className={`flex flex-col gap-1 ${drifting ? 'will-change-transform' : ''}`}
      >
        {lines.map((line) => (
          <VelocityTicker
            key={line.text}
            velocity={line.velocity ?? 40}
            direction={line.direction ?? 1}
            scrollBoost={4}
            gap={48}
            className={`font-display text-[10vw] leading-[0.95] tracking-tight md:text-[7vw] ${
              line.outline
                ? 'text-transparent [-webkit-text-stroke:1px_var(--color-greige)]'
                : 'text-bordeaux'
            } ${line.className ?? ''}`}
          >
            <span className="flex items-center gap-12">
              {line.text}
              {separator ? <span className="text-greige">{separator}</span> : null}
            </span>
          </VelocityTicker>
        ))}
      </m.div>

      {/*
        Feathered edges. Without them the rows visibly begin and end at the
        viewport bounds, which gives away that the text is finite.
      */}
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r ${GROUND[ground].from} to-transparent`}
      />
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l ${GROUND[ground].from} to-transparent`}
      />
    </section>
  )
}
