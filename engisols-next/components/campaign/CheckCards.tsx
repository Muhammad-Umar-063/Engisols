'use client'

import { m } from 'motion/react'
import type { CSSProperties } from 'react'
import { useMotionPrefs } from '@/hooks/useMotionPrefs'
import { DUR, EASE } from '@/lib/motion'
import { lpChecks } from '@/content/campaign'
import { useBooking } from '@/components/campaign/Booking'
import { Tick, TickItem } from '@/components/campaign/ui'

/**
 * The five checks, as drawn: icon chip, number, name in caps, the question, a
 * four-item tick list, and "Learn more →". The fifth card is the filled one.
 *
 * "Learn more" is the one link in the comp with nowhere to go that does not
 * leave for the site. It scrolls to the booking section instead of navigating,
 * and it keeps the comp's label and arrow. The alternative — inventing a page
 * of detail per card — would have added five screens of copy that are not in
 * the design.
 */

const ICONS = [
  'M9 6 4.5 10.5 9 15M15 6l4.5 4.5L15 15',
  'M12 4.5 6 7v4.2c0 3.3 2.4 6.2 6 7.3 3.6-1.1 6-4 6-7.3V7l-6-2.5Z',
  'M13 4.5 6.5 13H11l-.5 6.5L17.5 11H13l.5-6.5Z',
  'M5 19V9m4.7 10V5m4.6 14v-7m4.7 7V8',
  'M12 4.5 13.6 9.4 18.5 11l-4.9 1.6L12 17.5l-1.6-4.9L5.5 11l4.9-1.6L12 4.5Z',
]

export function CheckCards() {
  const { mounted, reduced } = useMotionPrefs()
  // The provider lives in the page; a server component cannot hand a click
  // handler to a client one, so the button reaches for it directly.
  const onMore = useBooking()

  return (
    <ul className="mt-step-5 grid gap-step-2 md:grid-cols-2 xl:grid-cols-5">
      {lpChecks.items.map((item, i) => {
        const feature = i === lpChecks.items.length - 1

        return (
          <m.li
            key={item.id}
            initial={reduced || !mounted ? false : { opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-10%' }}
            transition={{ duration: DUR.standard, ease: EASE.enter, delay: i * 0.05 }}
            // Same rule as the CTA: the filled card is a dark surface inside a
            // light section, so it declares its own ground or the cursor
            // vanishes over it.
            data-ground={feature ? 'dark' : undefined}
            className={`flex flex-col rounded-2xl border p-step-3 ${
              feature
                ? 'border-cherry bg-cherry text-vanilla on-dark'
                : 'border-greige/40 bg-vanilla'
            }`}
          >
            <span
              className={`grid size-9 place-items-center rounded-full ${
                feature ? 'bg-vanilla/15' : 'bg-oat/70'
              }`}
              aria-hidden
            >
              <svg
                viewBox="0 0 24 24"
                className="size-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d={ICONS[i]} />
              </svg>
            </span>

            <p
              className={`mt-step-3 font-mono text-xs ${feature ? 'text-vanilla/70' : 'text-bordeaux/50'}`}
            >
              {item.n}
            </p>
            <h3 className="mt-1 font-mono text-[0.8rem] font-medium tracking-[0.06em]">
              {item.name}
            </h3>
            <p
              className={`mt-step-2 text-sm ${feature ? 'text-vanilla/85' : 'text-bordeaux/75'}`}
            >
              {item.question}
            </p>

            <ul className="mt-step-3 space-y-1.5 text-sm">
              {item.points.map((point) => (
                <TickItem
                  key={point}
                  className={feature ? 'text-vanilla/90' : 'text-bordeaux/80'}
                >
                  {point}
                </TickItem>
              ))}
            </ul>

            <button
              type="button"
              onClick={onMore}
              className="mt-step-4 inline-flex items-center gap-1.5 self-start font-mono text-xs underline decoration-current/40 underline-offset-4 transition-colors hover:decoration-current"
            >
              {lpChecks.more}
              <span aria-hidden>→</span>
            </button>
          </m.li>
        )
      })}
    </ul>
  )
}

/** The tick row under the hero CTAs and in the closing band. */
export function PointRow({
  points,
  className = '',
  style,
}: {
  points: string[]
  className?: string
  style?: CSSProperties
}) {
  return (
    <ul className={`flex flex-wrap gap-x-step-3 gap-y-step-1 ${className}`} style={style}>
      {points.map((point) => (
        <li key={point} className="flex items-center gap-1.5 text-sm">
          <Tick className="opacity-70" />
          {point}
        </li>
      ))}
    </ul>
  )
}
