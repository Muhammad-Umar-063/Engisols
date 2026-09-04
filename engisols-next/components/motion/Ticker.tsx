import type { ReactNode } from 'react'

/**
 * Trust-strip ticker — animation spec section 4.1.
 *
 * CSS, not JavaScript, and a SERVER component: it sits above the fold in the
 * hero block, where spec 1.5 bans the animation library outright. One flex
 * track holds the logo set twice and translates -50% on an infinite linear
 * loop — the second copy is aria-hidden so content is announced once. Hover
 * pauses; reduced motion turns it into a plain scrollable row (globals.css).
 *
 * `spacing` exists because the two callers hold different things. The trust
 * strip runs bare text, which needs 4rem between items or the claims run into
 * one another. The landing page's tool strip runs bordered chips, which carry
 * their own edges — at 4rem they read as seven islands with a lot of nothing
 * between them, and the row stops looking like a set.
 *
 * Both values are written out in full because Tailwind needs to see the class
 * names to emit them; a computed `gap-step-${n}` produces no CSS at all.
 */
export function Ticker({
  children,
  spacing = 'wide',
}: {
  children: ReactNode
  spacing?: 'wide' | 'tight'
}) {
  const gap = spacing === 'tight' ? 'gap-step-2 pr-step-2' : 'gap-step-5 pr-step-5'

  return (
    <div className="ticker">
      <div className="ticker-track">
        <div className={`flex shrink-0 items-center ${gap}`}>{children}</div>
        <div aria-hidden className={`flex shrink-0 items-center ${gap}`}>
          {children}
        </div>
      </div>
    </div>
  )
}
