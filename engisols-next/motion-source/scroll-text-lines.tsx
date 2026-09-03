"use client"

import { motion, useScroll, useTransform } from "motion/react"
import { useRef, type ReactNode } from "react"
import { Ticker } from "./ticker"

/**
 * Scroll text lines. react-scroll-text-lines / vue-scroll-text-lines.
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

const DEFAULT_LINES: TextLine[] = [
  { text: "AI systems", velocity: 30, direction: 1 },
  { text: "Automation", velocity: 55, direction: -1, outline: true },
  { text: "Agentic workflows", velocity: 18, direction: 1 },
  { text: "Data pipelines", velocity: 70, direction: -1, outline: true },
  { text: "Cloud architecture", velocity: 40, direction: 1 },
]

export function ScrollTextLines({
  lines = DEFAULT_LINES,
  separator = "✳",
  className = "",
}: {
  lines?: TextLine[]
  /** Glyph between repetitions. Set null for plain repeating text. */
  separator?: ReactNode | null
  className?: string
}) {
  const ref = useRef<HTMLElement>(null)

  /**
   * A slight vertical counter-drift across the whole stack as it crosses the
   * viewport. Cheap, and it stops the block feeling bolted to the page.
   */
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  })
  const y = useTransform(scrollYProgress, [0, 1], ["6%", "-6%"])

  return (
    <section
      ref={ref}
      className={`relative overflow-hidden py-24 ${className}`}
      aria-label={lines.map((line) => line.text).join(", ")}
    >
      <motion.div style={{ y }} className="flex flex-col gap-1 will-change-transform">
        {lines.map((line, i) => (
          <Ticker
            key={i}
            velocity={line.velocity ?? 40}
            direction={line.direction ?? 1}
            scrollBoost={4}
            gap={48}
            className={`text-[10vw] leading-[0.95] tracking-tight md:text-[7vw] ${
              line.outline
                ? "text-transparent [-webkit-text-stroke:1px_var(--warm-greige)]"
                : "text-[--bordeaux-noir]"
            } ${line.className ?? ""}`}
          >
            <span className="flex items-center gap-12">
              {line.text}
              {separator ? (
                <span className="text-[--cherry-velvet] opacity-70">{separator}</span>
              ) : null}
            </span>
          </Ticker>
        ))}
      </motion.div>

      {/*
        Feathered edges. Without them the rows visibly begin and end at the
        viewport bounds, which gives away that the text is finite.
      */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[--vanilla-cream] to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[--vanilla-cream] to-transparent" />
    </section>
  )
}
