import type { CSSProperties, ReactNode } from 'react'

/**
 * Shared primitives for the AI App Audit campaign. Their semantic palette is
 * inherited from `.engisols-campaign-brand`: Bright Gray ground, Chicago Black
 * type, supporting gray panels and Crimson actions. Checkmarks remain neutral
 * because Crimson is brand emphasis, not an error status.
 */

/** Section eyebrow — the comp's accent pill, caps and letterspaced as drawn. */
export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="inline-flex rounded-full border border-greige/55 bg-oat/65 px-step-2 py-1 font-mono text-[0.65rem] font-semibold tracking-[0.12em] text-bordeaux/80">
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
 * A section. Full-bleed ground, centred column.
 *
 * Padding is 96px at every width, where the site uses 96 mobile and 160
 * desktop. The site's rhythm is built for reading — long pages a visitor
 * arrived at deliberately and will scroll patiently. This page is bought
 * traffic with one job, and at 160 the desktop layout put roughly 130px of
 * empty ground under every section that has a short left column, which on a
 * six-section page is most of a screen of nothing. Tightening it took ~700px
 * out of the page without moving a single element relative to its own section.
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
      <div className="shell scroll-mt-28 py-step-5 sm:py-step-6">{children}</div>
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
      className={`lp-card rounded-2xl border border-greige/50 bg-vanilla p-step-3 shadow-[0_20px_50px_-45px_rgba(23,23,23,0.65)] hover:border-greige ${className}`}
    >
      {children}
    </div>
  )
}
