'use client'

import { LazyMotion, domAnimation, m, useReducedMotion } from 'motion/react'
import { useId } from 'react'
import { EASE } from '@/lib/motion'

/**
 * Animated path drawing — `line-graph`.
 * Build spec section 8, section 4 (proof band).
 *
 * Motion's description: "Animated visualization of data points connected by
 * drawn lines." The path draws itself via `pathLength`, which Motion animates
 * natively — no manual stroke-dasharray arithmetic, and it stays correct if the
 * viewBox changes.
 *
 * ⚠️  GATED ON REAL DATA. Spec section 3: "Never animate a chart built on
 * invented data", and section 7: if no defensible metric exists, delete this
 * and render static figures instead. It is not wired into the homepage for
 * exactly that reason — only one Engisols-attributable metric currently exists.
 * Mount it when {{TODO: PROOF_METRIC}} resolves.
 *
 * Accessibility: an SVG chart is not self-describing. The series is also
 * rendered as a visually-hidden table, so the numbers are readable rather than
 * merely decorative.
 */
export function LineGraph({
  points,
  label,
  className,
}: {
  /** Real values only. Y is in the data's own units; scaling is handled here. */
  points: { x: string; y: number }[]
  label: string
  className?: string
}) {
  const reduced = useReducedMotion()
  const gradientId = useId()

  const width = 600
  const height = 220
  const pad = 8

  const max = Math.max(...points.map((p) => p.y))
  const min = Math.min(...points.map((p) => p.y))
  const range = max - min || 1

  const coords = points.map((p, i) => ({
    cx: pad + (i / (points.length - 1 || 1)) * (width - pad * 2),
    cy: height - pad - ((p.y - min) / range) * (height - pad * 2),
  }))

  const d = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.cx} ${c.cy}`).join(' ')
  const area = `${d} L ${coords[coords.length - 1].cx} ${height} L ${coords[0].cx} ${height} Z`

  return (
    <LazyMotion features={domAnimation} strict>
      <figure className={className}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full"
          role="img"
          aria-label={label}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-cherry)" stopOpacity="0.22" />
              <stop offset="100%" stopColor="var(--color-cherry)" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Fill fades in behind the line once it has drawn. */}
          <m.path
            d={area}
            fill={`url(#${gradientId})`}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: '-15%' }}
            transition={{ duration: 0.5, ease: EASE.enter, delay: reduced ? 0 : 0.7 }}
          />

          <m.path
            d={d}
            fill="none"
            stroke="var(--color-cherry)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={reduced ? { pathLength: 1 } : { pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={{ once: true, margin: '-15%' }}
            transition={{ duration: reduced ? 0 : 1.1, ease: EASE.enter }}
          />

          {coords.map((c, i) => (
            <m.circle
              key={i}
              cx={c.cx}
              cy={c.cy}
              r="3.5"
              fill="var(--color-cherry)"
              initial={{ opacity: 0, scale: 0 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: '-15%' }}
              transition={{
                duration: 0.25,
                ease: EASE.enter,
                delay: reduced ? 0 : (i / coords.length) * 1.1,
              }}
            />
          ))}
        </svg>

        <figcaption className="sr-only">
          <table>
            <caption>{label}</caption>
            <tbody>
              {points.map((p) => (
                <tr key={p.x}>
                  <th scope="row">{p.x}</th>
                  <td>{p.y}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </figcaption>
      </figure>
    </LazyMotion>
  )
}
