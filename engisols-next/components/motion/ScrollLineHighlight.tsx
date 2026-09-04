'use client'

import { m, useScroll, useTransform, type MotionValue } from 'motion/react'
import { useRef, type ReactNode } from 'react'
import { useMotionPrefs } from '@/hooks/useMotionPrefs'

/**
 * The stall — animation spec section 5.1.
 *
 * Copy sits at low opacity and each line brightens to full as it passes
 * through the middle of the viewport. Scrubbed to scroll, not a one-shot
 * entrance, so it reverses when the reader scrolls back.
 *
 * Called `ScrollTextLines` until Motion's own `scroll-text-lines` source
 * arrived and turned out to be something else entirely — a horizontal
 * editorial marquee, which now holds that name. This is not that, and it is
 * not the official `LineMaskReveal` either: that one measures real wrapped line
 * boxes and rises them out of a clip, where this brightens whole lines broken
 * by hand in the content file (see below for why).
 *
 * Opacity ONLY, on bordeaux text: cherry and bordeaux are 1.64 apart, so a
 * colour tween between them would not read.
 *
 * Lines are broken manually in the content file and passed as children —
 * never measured from wrapped text at runtime, because wrapping changes
 * across breakpoints and fonts. Each line is its own component because hooks
 * cannot run in a loop.
 */
export function ScrollLineHighlight({ children }: { children: ReactNode[] }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start 0.8', 'end 0.4'],
  })

  return (
    <div ref={containerRef}>
      {children.map((line, i) => (
        <Line key={i} index={i} total={children.length} progress={scrollYProgress}>
          {line}
        </Line>
      ))}
    </div>
  )
}

function Line({
  children,
  index,
  total,
  progress,
}: {
  children: ReactNode
  index: number
  total: number
  progress: MotionValue<number>
}) {
  const { mounted, reduced } = useMotionPrefs()
  const start = index / total
  const end = (index + 1) / total
  const opacity = useTransform(progress, [start, end], [0.18, 1])

  // Style attaches only after mount: the server ships every line fully
  // readable, and the dimmed scrub state exists only once JS is running.
  return <m.div style={mounted && !reduced ? { opacity } : undefined}>{children}</m.div>
}
