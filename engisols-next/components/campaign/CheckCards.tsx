'use client'

import { AnimatePresence, m } from 'motion/react'
import { useState, type CSSProperties } from 'react'
import { useMotionPrefs } from '@/hooks/useMotionPrefs'
import { DUR, EASE } from '@/lib/motion'
import { lpChecks } from '@/content/campaign'
import { Tick, TickItem } from '@/components/campaign/ui'

const ICONS = [
  'M9 6 4.5 10.5 9 15M15 6l4.5 4.5L15 15',
  'M12 4.5 6 7v4.2c0 3.3 2.4 6 7.3 3.6-1.1 6-4 6-7.3V7l-6-2.5Z',
  'M13 4.5 6.5 13H11l-.5 6.5L17.5 11H13l.5-6.5Z',
  'M5 19V9m4.7 10V5m4.6 14v-7m4.7 7V8',
  'M12 4.5 13.6 9.4 18.5 11l-4.9 1.6L12 17.5l-1.6-4.9L5.5 11l4.9-1.6L12 4.5Z',
]

/** A compact one-open-at-a-time disclosure. Every control does what it says. */
export function CheckCards() {
  const [openId, setOpenId] = useState<string | null>('security')
  const { reduced } = useMotionPrefs()

  return (
    <ul className="mt-step-4 overflow-hidden rounded-2xl border border-greige/50 bg-vanilla">
      {lpChecks.items.map((item, index) => {
        const open = openId === item.id
        const panelId = `check-panel-${item.id}`

        return (
          <li key={item.id} className="border-t border-greige/45 first:border-t-0">
            <button
              type="button"
              aria-expanded={open}
              aria-controls={panelId}
              onClick={() => setOpenId(open ? null : item.id)}
              className="group grid min-h-[5.5rem] w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-step-2 px-step-2 py-step-2 text-left transition-colors hover:bg-oat/35 sm:px-step-3"
            >
              <span className={`grid size-10 place-items-center rounded-full ${open ? 'bg-cherry text-vanilla' : 'bg-oat/70'}`} aria-hidden>
                <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d={ICONS[index]} />
                </svg>
              </span>
              <span className="min-w-0">
                <span className="block font-mono text-[0.65rem] font-semibold tracking-[0.07em] text-bordeaux/55">
                  {item.name}
                </span>
                <span className="mt-1 block text-sm font-medium leading-snug sm:text-base">
                  {item.question}
                </span>
              </span>
              <span className={`grid size-11 place-items-center rounded-full border border-greige/55 text-xl transition-transform ${open ? 'rotate-45 border-cherry text-cherry' : ''}`} aria-hidden>
                +
              </span>
            </button>

            <AnimatePresence initial={false}>
              {open ? (
                <m.div
                  id={panelId}
                  initial={reduced ? false : { height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={reduced ? { opacity: 0 } : { height: 0, opacity: 0 }}
                  transition={{ duration: reduced ? 0 : DUR.standard, ease: EASE.enter }}
                  className="overflow-hidden"
                >
                  <div className="border-t border-greige/35 bg-oat/35 px-step-3 py-step-3 sm:pl-[5.75rem]">
                    <p className="max-w-[60ch] text-sm text-bordeaux/65">
                      We trace these signals together, then explain what is healthy, what needs proof, and what deserves action.
                    </p>
                    <ul className="mt-step-2 grid gap-x-step-4 gap-y-step-1 text-sm text-bordeaux/85 sm:grid-cols-2 lg:grid-cols-3">
                      {item.points.map((point) => (
                        <TickItem key={point}>{point}</TickItem>
                      ))}
                    </ul>
                    <button
                      type="button"
                      onClick={() => setOpenId(null)}
                      className="mt-step-3 min-h-11 font-mono text-xs font-semibold underline decoration-bordeaux/40 underline-offset-4 hover:decoration-bordeaux"
                    >
                      COLLAPSE {item.name}
                    </button>
                  </div>
                </m.div>
              ) : null}
            </AnimatePresence>
          </li>
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
