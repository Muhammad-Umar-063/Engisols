import type { CSSProperties, ReactNode } from 'react'

/**
 * The landing page's small shared parts, and the one place its palette
 * translation is written down.
 *
 * The campaign design arrives in a different colour language: white ground,
 * black type, a saturated blue for every primary action, a lime accent on the
 * eyebrow pills, and green ticks. None of those exist here. The mapping:
 *
 *   white ground          -> vanilla     the page
 *   light grey panel      -> oat         sections that need to sit back
 *   black type            -> bordeaux    all body and display type
 *   blue button           -> cherry      filled CTAs — rule 2's second job
 *   blue panel            -> cherry      full-bleed panels — rule 2's first job
 *   lime eyebrow pill     -> oat/greige  a pill, in mono, at 12px
 *   green tick            -> bordeaux    see below
 *   grey hairline         -> greige      rules and borders, its stated job
 *
 * Two of those are decisions rather than substitutions.
 *
 * The ticks are not green. `--color-valid` exists in this palette and is
 * reserved for one thing: form validation success. Red is the brand colour, so
 * red cannot mean failure, which is the entire reason green is ring-fenced —
 * spending it on decorative checklist ticks would take the only signal the
 * forms have. The ticks are bordeaux, and the checklist reads as a list rather
 * than as a status.
 *
 * Everything else is the comp's, including two treatments the site's own build
 * spec bans by name: all-caps letterspaced eyebrow labels, and "→" appended to
 * button text. Those bans govern the SITE. This is a campaign asset matched to
 * a supplied design, the instruction is that only the palette changes, and a
 * landing page that quietly redesigns the comp is not the asset that was asked
 * for. If these ever migrate onto a site page, they have to lose both.
 */

/** Section eyebrow — the comp's accent pill, caps and letterspaced as drawn. */
export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="inline-flex rounded-full bg-greige/30 px-step-2 py-1 font-mono text-[0.65rem] tracking-[0.12em] text-bordeaux/75">
      {children}
    </p>
  )
}

/**
 * The tick. Drawn rather than a character: ✓ renders at a different weight in
 * every fallback font, and this appears in six places on the page.
 */
export function Tick({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      aria-hidden
      className={`size-4 shrink-0 ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3.5 8.5 6.5 11.5 12.5 4.5" />
    </svg>
  )
}

/** A checklist row. Used at three sizes, so the tick alignment lives here once. */
export function TickItem({
  children,
  className = '',
  style,
}: {
  children: ReactNode
  className?: string
  /** Carries `--i` when the row is part of a CSS entrance sequence. */
  style?: CSSProperties
}) {
  return (
    <li className={`flex items-start gap-step-1 ${className}`} style={style}>
      <Tick className="mt-0.5 opacity-70" />
      <span>{children}</span>
    </li>
  )
}

/**
 * A section. Full-bleed ground, centred column, and the site's own vertical
 * rhythm — the landing page is a different design, not a different grid.
 */
export function LpSection({
  id,
  ground = 'vanilla',
  children,
  className = '',
}: {
  id?: string
  ground?: 'vanilla' | 'oat' | 'cherry'
  children: ReactNode
  className?: string
}) {
  const tone =
    ground === 'cherry'
      ? 'bg-cherry text-vanilla on-dark'
      : ground === 'oat'
        ? 'bg-oat text-bordeaux'
        : 'bg-vanilla text-bordeaux'

  return (
    <section
      id={id}
      data-ground={ground === 'cherry' ? 'dark' : 'light'}
      className={`${tone} ${className}`}
    >
      {/* scroll-mt clears the floating header, which overlays the page rather
          than pushing it down — without it an anchor lands under the bar. */}
      <div className="shell scroll-mt-28 py-step-6 lg:py-step-7">{children}</div>
    </section>
  )
}

/** The card surface. One definition, because the page has 20 of them. */
export function Card({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={`lp-card rounded-2xl border border-greige/40 bg-vanilla p-step-3 hover:border-greige ${className}`}
    >
      {children}
    </div>
  )
}
