import type { ReactNode } from 'react'

/**
 * A full-bleed horizontal band — the unit every page is assembled from.
 *
 * Grounds are hard cuts, never gradients (build spec section 4). The ground
 * also carries two things that are easy to forget when hand-rolling a section:
 *
 *   `data-ground` — the custom cursor reads it to pick its own colour, and the
 *   header reads the hero's to swap between transparent-on-dark and solid.
 *   `on-dark` — switches focus rings to vanilla so they stay visible.
 *
 * Three dark bands per page maximum (spec section 7). If a fourth is proposed,
 * one has to come out.
 */

const GROUNDS = {
  vanilla: { bg: 'bg-vanilla text-bordeaux', dark: false },
  oat: { bg: 'bg-oat text-bordeaux', dark: false },
  greige: { bg: 'bg-greige text-bordeaux', dark: false },
  cherry: { bg: 'bg-cherry text-vanilla', dark: true },
  bordeaux: { bg: 'bg-bordeaux text-vanilla', dark: true },
} as const

export type Ground = keyof typeof GROUNDS

export function Band({
  children,
  ground = 'vanilla',
  id,
  className = '',
  width = 'shell',
  tight = false,
}: {
  children: ReactNode
  ground?: Ground
  id?: string
  className?: string
  /** `full` skips the centred column for sections that run edge to edge. */
  width?: 'shell' | 'full'
  /** Half the vertical rhythm, for a band that continues the one above it. */
  tight?: boolean
}) {
  const tone = GROUNDS[ground]

  return (
    <section
      id={id}
      data-ground={tone.dark ? 'dark' : 'light'}
      className={`${tone.bg} ${tone.dark ? 'on-dark' : ''} ${className}`}
    >
      {width === 'shell' ? (
        <div className={`shell ${tight ? 'py-step-6' : 'band'}`}>{children}</div>
      ) : (
        children
      )}
    </section>
  )
}

/**
 * Section heading with an optional standfirst.
 *
 * `eyebrow` is mono and small — it is the section's name, not a slogan, and it
 * exists so a scanner can navigate the page without reading it.
 */
export function BandHeading({
  eyebrow,
  title,
  lead,
  className = '',
}: {
  eyebrow?: string
  title: ReactNode
  lead?: ReactNode
  className?: string
}) {
  return (
    <div className={className}>
      {eyebrow ? (
        <p className="font-mono text-xs tracking-tight text-current/60">{eyebrow}</p>
      ) : null}
      <h2 className={`text-[clamp(1.75rem,3.5vw,3rem)] ${eyebrow ? 'mt-step-2' : ''}`}>
        {title}
      </h2>
      {lead ? <p className="measure mt-step-3 text-lg text-current/80">{lead}</p> : null}
    </div>
  )
}

/**
 * The marker for content the spec forbids inventing.
 *
 * Rendered rather than hidden: a blocker you can see on the page gets resolved,
 * and one buried in a comment does not. Every instance is a thing that must be
 * replaced before launch.
 */
export function Blocked({ marker, need }: { marker: string; need: string }) {
  return (
    <p className="border-l-2 border-current/40 pl-step-2 font-mono text-xs text-current/70">
      {marker} — {need}
    </p>
  )
}
