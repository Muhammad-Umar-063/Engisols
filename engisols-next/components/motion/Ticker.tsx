import type { ReactNode } from 'react'

/**
 * Trust-strip ticker — animation spec section 4.1.
 *
 * CSS, not JavaScript, and a SERVER component: it sits above the fold in the
 * hero block, where spec 1.5 bans the animation library outright. One flex
 * track holds the logo set twice and translates -50% on an infinite linear
 * loop — the second copy is aria-hidden so content is announced once. Hover
 * pauses; reduced motion turns it into a plain scrollable row (globals.css).
 */
export function Ticker({ children }: { children: ReactNode }) {
  return (
    <div className="ticker">
      <div className="ticker-track">
        <div className="flex shrink-0 items-center gap-step-5 pr-step-5">{children}</div>
        <div aria-hidden className="flex shrink-0 items-center gap-step-5 pr-step-5">
          {children}
        </div>
      </div>
    </div>
  )
}
