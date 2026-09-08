'use client'

import { useState } from 'react'
import { scrollToTarget } from '@/components/motion/SmoothScroll'
import { lpChecks } from '@/content/campaign'
import { TickItem } from '@/components/campaign/ui'

const ICONS = [
  'M9 6 4.5 10.5 9 15M15 6l4.5 4.5L15 15',
  'M12 4.5 6 7v4.2c0 3.3 2.4 6.2 6 7.3 3.6-1.1 6-4 6-7.3V7l-6-2.5Z',
  'M13 4.5 6.5 13H11l-.5 6.5L17.5 11H13l.5-6.5Z',
  'M5 19V9m4.7 10V5m4.6 14v-7m4.7 7V8',
  'M12 4.5 13.6 9.4 18.5 11l-4.9 1.6L12 17.5l-1.6-4.9L5.5 11l4.9-1.6L12 4.5Z',
]

const TAB_LABELS = ['CODE', 'SECURITY', 'RELIABILITY', 'SCALE', 'AI LAYER']

/**
 * An honest, interactive preview of the audit deliverable. It never implies a
 * visitor's repository is being scanned: the controls simply let them explore
 * the five review areas and see the level of specificity a real report uses.
 */
export function AuditPanel() {
  const [selectedId, setSelectedId] = useState('security')
  const selectedIndex = Math.max(
    0,
    lpChecks.items.findIndex((item) => item.id === selectedId),
  )
  const selected = lpChecks.items[selectedIndex]

  return (
    <section
      aria-labelledby="sample-audit-title"
      className="min-w-0 overflow-hidden rounded-2xl border border-greige/55 bg-vanilla shadow-[0_24px_60px_-40px_rgba(23,23,23,0.55)]"
    >
      <div className="flex items-start justify-between gap-step-2 border-b border-greige/45 px-step-3 py-step-2">
        <div>
          <p className="font-mono text-[0.65rem] font-semibold tracking-[0.1em] text-cherry">
            INTERACTIVE PREVIEW
          </p>
          <h2 id="sample-audit-title" className="mt-1 text-lg font-semibold">
            Sample audit report
          </h2>
        </div>
        <span className="shrink-0 rounded-full border border-greige/55 px-step-2 py-1 font-mono text-[0.6rem] tracking-[0.06em] text-bordeaux/65">
          NOT A LIVE SCAN
        </span>
      </div>

      <div
        role="group"
        aria-label="Choose a sample audit area"
        className="flex snap-x gap-step-1 overflow-x-auto border-b border-greige/45 px-step-2 py-step-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {lpChecks.items.map((item, index) => {
          const active = item.id === selected.id
          return (
            <button
              key={item.id}
              type="button"
              aria-label={`Preview ${item.name}`}
              aria-pressed={active}
              aria-controls="sample-audit-panel"
              onClick={() => setSelectedId(item.id)}
              className={`min-h-11 shrink-0 snap-start rounded-full px-step-2 font-mono text-[0.68rem] font-semibold tracking-[0.04em] transition-colors ${
                active
                  ? 'bg-bordeaux text-vanilla'
                  : 'border border-greige/50 text-bordeaux/70 hover:border-bordeaux/50'
              }`}
            >
              {TAB_LABELS[index]}
            </button>
          )
        })}
      </div>

      <div id="sample-audit-panel" aria-live="polite" className="p-step-3">
        <div className="flex items-center gap-step-2">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-oat/70" aria-hidden>
            <svg
              viewBox="0 0 24 24"
              className="size-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d={ICONS[selectedIndex]} />
            </svg>
          </span>
          <p className="font-mono text-[0.65rem] font-semibold tracking-[0.08em] text-bordeaux/55">
            REVIEW AREA {selected.n}
          </p>
        </div>

        <p className="mt-step-2 max-w-[30ch] font-display text-xl font-semibold leading-tight">
          {selected.question}
        </p>
        <ul className="mt-step-3 grid gap-step-1 text-sm text-bordeaux/80 sm:grid-cols-2">
          {selected.points.slice(0, 4).map((point) => (
            <TickItem key={point}>{point}</TickItem>
          ))}
        </ul>

        <div className="mt-step-3 flex flex-col gap-step-2 border-t border-greige/40 pt-step-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-[38ch] text-xs leading-relaxed text-bordeaux/60">
            A real audit ties each finding to your code, its impact, and the next action.
          </p>
          <button
            type="button"
            onClick={() => scrollToTarget('#report')}
            className="inline-flex min-h-11 shrink-0 items-center gap-1.5 self-start font-mono text-xs font-semibold underline decoration-bordeaux/40 underline-offset-4 transition-colors hover:decoration-bordeaux"
          >
            SEE THE DELIVERABLE
            <span aria-hidden>↓</span>
          </button>
        </div>
      </div>
    </section>
  )
}
