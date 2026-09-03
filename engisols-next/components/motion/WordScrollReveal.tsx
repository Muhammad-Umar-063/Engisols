'use client'

import { m, useScroll, useTransform, type MotionValue } from 'motion/react'
import { useRef } from 'react'
import { useMotionPrefs } from '@/hooks/useMotionPrefs'

/**
 * Section 9 opener — animation spec section 11.2. Used nowhere else.
 *
 * Identical mechanics to the stall's line scrub, but per word: each word's
 * opacity is driven by scroll progress (0.12 → 1), assembling the sentence as
 * the reader moves and reversing if they scroll back.
 *
 * Words arrive pre-split from the content file — spec says split at build
 * time, not runtime — and are capped at ~40, beyond which the effect outlasts
 * the reader's patience. Full text is server-rendered inside the spans, so a
 * crawler reads the sentence whole.
 */
export function WordScrollReveal({
  words,
  className,
}: {
  words: string[]
  className?: string
}) {
  const ref = useRef<HTMLParagraphElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start 0.8', 'end 0.4'],
  })

  const capped = words.slice(0, 40)

  return (
    <p ref={ref} className={className}>
      {capped.map((word, i) => (
        <Word key={`${word}-${i}`} index={i} total={capped.length} progress={scrollYProgress}>
          {word}
        </Word>
      ))}
    </p>
  )
}

function Word({
  children,
  index,
  total,
  progress,
}: {
  children: string
  index: number
  total: number
  progress: MotionValue<number>
}) {
  const { mounted, reduced } = useMotionPrefs()
  const opacity = useTransform(progress, [index / total, (index + 1) / total], [0.12, 1])

  // Mount-gated for the same reason as the stall: full opacity in SSR HTML.
  return (
    <m.span className="inline-block" style={mounted && !reduced ? { opacity } : undefined}>
      {children}&nbsp;
    </m.span>
  )
}
