# scroll-text.tsx — held as Markdown, blocked on `split-text`

`ScrollWordReveal` and `LineMaskReveal` both import from `./split-text`, which
has not been dropped yet:

```tsx
import { splitToPieces, useSplitLines } from "./split-text"
```

As a `.tsx` this fails the build on that missing module, so it waits here until
`split-text` arrives. It also imports `offset.read`, which does not exist in
`lib/motion.ts` yet — that mapping should land with the same drop.

What is already in the repo, and how it relates:

- `components/motion/WordScrollReveal.tsx` is our version of `ScrollWordReveal`.
- `components/motion/ScrollLineHighlight.tsx` is the per-line opacity scrub used
  by the stall section. It is NOT `LineMaskReveal` — ours brightens whole lines
  that were broken by hand in the content file; the official one measures real
  wrapped line boxes and rises them out of a clip. It was called
  `ScrollTextLines` until this drop arrived and took the name back.

## The source

```tsx
"use client"

import { motion, useScroll, useTransform, type MotionValue } from "motion/react"
import { useRef } from "react"
import { offset } from "@/lib/motion"
import { splitToPieces, useSplitLines } from "./split-text"

/* ------------------------------------------------------------------ */
/* Scroll word reveal                                                   */
/* react-text-scroll-word-reveal                                        */
/* ------------------------------------------------------------------ */

/**
 * A paragraph that lights up word by word as it crosses the viewport. Each word
 * owns a slice of the parent's scroll progress, so the reveal is scrubbed by the
 * scrollbar rather than played on a timer. Scrolling back up unwrites it.
 *
 * The dim state is opacity on a coloured span, not a colour interpolation,
 * because animating opacity stays on the compositor.
 */
function Word({
  children,
  progress,
  range,
}: {
  children: string
  progress: MotionValue<number>
  range: [number, number]
}) {
  const opacity = useTransform(progress, range, [0.15, 1])
  const y = useTransform(progress, range, [8, 0])

  return (
    <span className="relative inline-block whitespace-pre">
      <motion.span style={{ opacity, y }} className="inline-block">
        {children}
      </motion.span>
    </span>
  )
}

export function ScrollWordReveal({
  children,
  className = "",
}: {
  children: string
  className?: string
}) {
  const ref = useRef<HTMLParagraphElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: offset.read as never,
  })

  const words = splitToPieces(children, "words")

  return (
    <p
      ref={ref}
      aria-label={children}
      className={`flex flex-wrap text-balance ${className}`}
    >
      {words.map((word, i) => {
        // Overlap each word's window slightly so the light travels as a wave
        // instead of stepping word to word.
        const start = i / words.length
        const end = (i + 1.6) / words.length
        return (
          <span key={i} aria-hidden>
            <Word progress={scrollYProgress} range={[start, Math.min(end, 1)]}>
              {word}
            </Word>
          </span>
        )
      })}
    </p>
  )
}

/* ------------------------------------------------------------------ */
/* Line mask reveal                                                     */
/*                                                                      */
/* NOT react-scroll-text-lines. That example is a horizontal marquee and */
/* lives in scroll-text-lines.tsx. This is the mask reveal: lines rising */
/* out of a clip as they cross the viewport. Kept because it is a useful */
/* effect in its own right and the body copy on the home page uses it.   */
/* ------------------------------------------------------------------ */

function Line({
  children,
  progress,
  range,
}: {
  children: string
  progress: MotionValue<number>
  range: [number, number]
}) {
  const y = useTransform(progress, range, ["105%", "0%"])
  const opacity = useTransform(progress, range, [0, 1])

  return (
    <span className="block overflow-hidden">
      <motion.span style={{ y, opacity }} className="block will-change-transform">
        {children}
      </motion.span>
    </span>
  )
}

/**
 * Lines rise out of a clipped mask, one after another, driven by scroll.
 *
 * The line breaks are measured from the real rendered text, so the mask always
 * matches where the browser actually wrapped. Hard-coding the breaks is what
 * makes most implementations of this fall apart on a narrow viewport.
 */
export function LineMaskReveal({
  children,
  className = "",
}: {
  children: string
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const measureRef = useRef<HTMLDivElement>(null)
  const { lines } = useSplitLines(measureRef, children)

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: offset.read as never,
  })

  return (
    <div ref={ref} aria-label={children} className={className}>
      {/* Invisible twin at full width. Line boxes are measured off this, so the
          animated copy can be transformed without disturbing the measurement. */}
      <div ref={measureRef} aria-hidden className="pointer-events-none h-0 overflow-hidden opacity-0">
        {children}
      </div>

      {lines.map((line, i) => {
        const start = i / lines.length
        const end = (i + 1) / lines.length
        return (
          <Line key={i} progress={scrollYProgress} range={[start, end]}>
            {line}
          </Line>
        )
      })}
    </div>
  )
}
```
