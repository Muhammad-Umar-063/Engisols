'use client'

import { AnimatePresence, m } from 'motion/react'
import { useState } from 'react'
import { scrollToTarget } from '@/components/motion/SmoothScroll'
import { useMotionPrefs } from '@/hooks/useMotionPrefs'
import { EASE } from '@/lib/motion'
import { lpChecks } from '@/content/campaign'

const ICONS = [
  'M9 6 4.5 10.5 9 15M15 6l4.5 4.5L15 15',
  'M12 4.5 6 7v4.2c0 3.3 2.4 6 7.3 3.6-1.1 6-4 6-7.3V7l-6-2.5Z',
  'M13 4.5 6.5 13H11l-.5 6.5L17.5 11H13l.5-6.5Z',
  'M5 19V9m4.7 10V5m4.6 14v-7m4.7 7V8',
  'M12 4.5 13.6 9.4 18.5 11l-4.9 1.6L12 17.5l-1.6-4.9L5.5 11l4.9-1.6L12 4.5Z',
]

const TAB_LABELS = ['CODE', 'SEC', 'RELY', 'SCALE', 'AI']

const SAMPLE_OUTPUT: Record<string, { impact: string; decision: string }> = {
  'code-quality': {
    impact: 'Changes stay predictable',
    decision: 'Refactor map',
  },
  security: {
    impact: 'Access stays bounded',
    decision: 'Boundary review',
  },
  reliability: {
    impact: 'Failures recover safely',
    decision: 'Failure-path plan',
  },
  architecture: {
    impact: 'Growth stays affordable',
    decision: 'Scale budget',
  },
  'ai-layer': {
    impact: 'Outputs stay controlled',
    decision: 'Eval and guardrail plan',
  },
}

/**
 * An honest interactive model of the audit deliverable. The brief scan trace
 * resets when a visitor changes lenses, but every label makes clear that this
 * is a sample—not a scan of their application.
 */
export function AuditPanel() {
  const [selectedId, setSelectedId] = useState('security')
  const { reduced } = useMotionPrefs()
  const selectedIndex = Math.max(
    0,
    lpChecks.items.findIndex((item) => item.id === selectedId),
  )
  const selected = lpChecks.items[selectedIndex]
  const sample = SAMPLE_OUTPUT[selected.id]

  return (
    <section
      aria-labelledby="sample-audit-title"
      data-ground="dark"
      className="lp-audit-console relative min-w-0 overflow-hidden rounded-2xl border border-vanilla/20 text-vanilla shadow-[0_32px_80px_-38px_rgba(93,8,31,0.8)]"
    >
      <span key={selected.id} aria-hidden className="lp-console-trace absolute inset-x-0 top-0 z-20 h-px bg-vanilla/70" />

      <div className="relative z-10 flex items-start justify-between gap-step-2 border-b border-vanilla/15 bg-vanilla/8 px-step-2 py-step-2 backdrop-blur-md sm:px-step-3">
        <div>
          <p className="font-mono text-[0.62rem] font-semibold tracking-[0.12em] text-vanilla/80">
            SAMPLE AUDIT / 05 LENSES
          </p>
          <h2 id="sample-audit-title" className="mt-1 text-lg font-semibold">
            Production review console
          </h2>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-vanilla/30 bg-vanilla/10 px-3 py-1 font-mono text-[0.56rem] font-semibold tracking-[0.06em] text-vanilla/90 sm:px-step-2 sm:text-[0.6rem]">
          <span className="lp-console-dot size-1.5 rounded-full bg-vanilla" aria-hidden />
          SAMPLE MODE
        </span>
      </div>

      <dl className="relative z-10 grid grid-cols-3 divide-x divide-vanilla/15 border-b border-vanilla/15 bg-bordeaux/20 px-step-1 py-step-1.5 font-mono text-[0.56rem] tracking-[0.06em] sm:px-step-2 sm:text-[0.62rem]">
        <div className="px-step-1">
          <dt className="text-vanilla/60">ACCESS</dt>
          <dd className="mt-0.5 font-semibold text-vanilla/95">READ ONLY</dd>
        </div>
        <div className="px-step-1">
          <dt className="text-vanilla/60">OUTPUT</dt>
          <dd className="mt-0.5 font-semibold text-vanilla/95">RANKED PLAN</dd>
        </div>
        <div className="px-step-1">
          <dt className="text-vanilla/60">REVIEW</dt>
          <dd className="mt-0.5 font-semibold text-vanilla/95">ENGINEER LED</dd>
        </div>
      </dl>

      <div
        role="group"
        aria-label="Choose a sample audit lens"
        className="relative z-10 grid grid-cols-5 border-b border-vanilla/15 bg-bordeaux/15"
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
              className={`relative min-h-14 min-w-0 border-l border-vanilla/15 px-0.5 py-1 text-center first:border-l-0 sm:px-step-1 ${
                active ? 'bg-vanilla text-bordeaux' : 'text-vanilla/80 hover:bg-vanilla/10'
              }`}
            >
              <span className={`block font-mono text-[0.5rem] tabular-nums ${active ? 'text-bordeaux/55' : 'text-vanilla/50'}`}>
                {String(index + 1).padStart(2, '0')}
              </span>
              <span className="mt-1 block truncate font-mono text-[0.58rem] font-semibold tracking-[0.04em] sm:text-[0.65rem]">
                {TAB_LABELS[index]}
              </span>
            </button>
          )
        })}
      </div>

      <div id="sample-audit-panel" aria-live="polite" className="lp-console-grid relative min-h-[22rem] p-step-2 sm:min-h-[21rem] sm:p-step-3">
        <AnimatePresence mode="wait" initial={false}>
          <m.div
            key={selected.id}
            initial={reduced ? false : { opacity: 0, y: 10, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: -6, filter: 'blur(3px)' }}
            transition={{ duration: reduced ? 0 : 0.72, ease: EASE.enter }}
          >
            <div className="flex items-center gap-step-2">
              <span className="grid size-9 shrink-0 place-items-center rounded-full border border-vanilla/20 bg-vanilla/10" aria-hidden>
                <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d={ICONS[selectedIndex]} />
                </svg>
              </span>
              <div>
                <p className="font-mono text-[0.58rem] font-semibold tracking-[0.1em] text-vanilla/90">
                  LENS {selected.n} / {selected.name}
                </p>
                <p className="mt-0.5 font-mono text-[0.58rem] text-vanilla/65">3 SIGNALS MAPPED</p>
              </div>
            </div>

            <p className="mt-step-2 max-w-[31ch] font-display text-[1.18rem] font-semibold leading-tight sm:text-xl">
              {selected.question}
            </p>

            <div className="mt-step-2 grid grid-cols-2 gap-3">
              {selected.points.slice(0, 4).map((point, index) => (
                <div key={point} className="flex min-h-12 items-center gap-step-1 rounded-lg border border-vanilla/25 bg-vanilla/12 px-3 py-step-1 text-xs backdrop-blur-sm">
                  <span className="font-mono text-[0.55rem] text-vanilla/60">0{index + 1}</span>
                  <span className="leading-tight text-vanilla/95">{point}</span>
                </div>
              ))}
            </div>

            <dl className="mt-step-2 grid grid-cols-2 divide-x divide-vanilla/15 border-y border-vanilla/20 bg-bordeaux/15 py-step-2">
              <div className="pr-step-2">
                <dt className="font-mono text-[0.56rem] font-semibold tracking-[0.08em] text-vanilla/60">WHY IT MATTERS</dt>
                <dd className="mt-1 text-xs font-medium leading-snug">{sample.impact}</dd>
              </div>
              <div className="pl-step-2">
                <dt className="font-mono text-[0.56rem] font-semibold tracking-[0.08em] text-vanilla/60">REPORT DECISION</dt>
                <dd className="mt-1 text-xs font-medium leading-snug">{sample.decision}</dd>
              </div>
            </dl>
          </m.div>
        </AnimatePresence>

        <div className="mt-step-2 flex items-center justify-between gap-step-2">
          <p className="max-w-[25ch] text-[0.68rem] leading-relaxed text-vanilla/75">
            Your report connects evidence, consequence, and action.
          </p>
          <button
            type="button"
            onClick={() => scrollToTarget('#report')}
            className="inline-flex min-h-11 shrink-0 items-center gap-1 font-mono text-[0.65rem] font-semibold text-vanilla underline decoration-vanilla/40 underline-offset-4 transition-colors hover:decoration-vanilla"
          >
            SEE OUTPUT
            <span aria-hidden>↓</span>
          </button>
        </div>
      </div>
    </section>
  )
}
