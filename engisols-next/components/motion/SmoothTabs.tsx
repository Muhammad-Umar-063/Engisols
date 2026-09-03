'use client'

import { m } from 'motion/react'
import { useId, useRef, useState, type ReactNode } from 'react'
import { useMotionPrefs } from '@/hooks/useMotionPrefs'
import { EASE } from '@/lib/motion'

/**
 * Smooth tabs — animation spec section 7. One component, used by sections 5
 * (services) and 10 (pricing).
 *
 * Crawlability rule (7.3): ALL panels render in the DOM server-side, inactive
 * ones carrying the `hidden` attribute. AnimatePresence mounting only the
 * active panel would leave the other four panels' copy invisible to crawlers —
 * on the services and pricing sections that is most of the sellable content.
 *
 * The indicator slides via shared layoutId with the spring; panels animate
 * opacity + 8px on activation. Focus stays on the trigger, never moved into
 * the panel.
 */

export type Tab = { id: string; label: string; content: ReactNode }

export function SmoothTabs({ tabs, className }: { tabs: Tab[]; className?: string }) {
  const [active, setActive] = useState(0)
  const { reduced } = useMotionPrefs()
  const groupId = useId()
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])

  const onKeyDown = (e: React.KeyboardEvent) => {
    const last = tabs.length - 1
    let next: number | null = null
    if (e.key === 'ArrowRight') next = active === last ? 0 : active + 1
    if (e.key === 'ArrowLeft') next = active === 0 ? last : active - 1
    if (e.key === 'Home') next = 0
    if (e.key === 'End') next = last
    if (next === null) return
    e.preventDefault()
    setActive(next)
    tabRefs.current[next]?.focus()
  }

  return (
    <div className={className}>
      <div
        role="tablist"
        aria-label="Sections"
        onKeyDown={onKeyDown}
        className="flex flex-wrap gap-step-1 border-b border-greige/40"
      >
        {tabs.map((tab, i) => (
          <button
            key={tab.id}
            ref={(el) => {
              tabRefs.current[i] = el
            }}
            role="tab"
            id={`${groupId}-tab-${tab.id}`}
            aria-selected={i === active}
            aria-controls={`${groupId}-panel-${tab.id}`}
            tabIndex={i === active ? 0 : -1}
            onClick={() => setActive(i)}
            className="relative px-step-2 py-step-2 text-left text-sm font-medium transition-opacity"
            style={{
              opacity: i === active ? 1 : 0.6,
              transitionTimingFunction: 'var(--ease-micro)',
            }}
          >
            {tab.label}
            {i === active ? (
              <m.span
                layoutId={`${groupId}-indicator`}
                className="absolute inset-x-0 -bottom-px block h-0.5 bg-cherry"
                transition={reduced ? { duration: 0 } : EASE.spring}
              />
            ) : null}
          </button>
        ))}
      </div>

      {/* Every panel is in the DOM from the server render. Only visibility and
          the entrance animation change client-side. */}
      <m.div layout className="pt-step-3">
        {tabs.map((tab, i) => (
          <m.div
            key={tab.id}
            role="tabpanel"
            id={`${groupId}-panel-${tab.id}`}
            aria-labelledby={`${groupId}-tab-${tab.id}`}
            hidden={i !== active}
            animate={
              i === active
                ? { opacity: 1, y: 0 }
                : { opacity: 0, y: reduced ? 0 : 8 }
            }
            transition={
              reduced ? { duration: 0 } : { duration: 0.2, ease: EASE.enter }
            }
          >
            {tab.content}
          </m.div>
        ))}
      </m.div>
    </div>
  )
}
