'use client'

import { m, useInView } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { useMotionPrefs } from '@/hooks/useMotionPrefs'
import { scrollToTarget } from '@/components/motion/SmoothScroll'
import { DUR, EASE, STAGGER } from '@/lib/motion'
import { lpAudit } from '@/content/campaign'

/**
 * The audit panel in the hero.
 *
 * The comp draws a static panel mid-review. This renders that panel exactly —
 * same rows, same wording, same statuses, "REVIEW IN PROGRESS" still showing at
 * rest — and animates its way INTO that state rather than past it. Rows arrive
 * one after another and the TOP PRIORITIES card follows, so the panel builds
 * itself on first view and then sits at the frame the comp specifies.
 *
 * That constraint is the whole design of this component. It would be easy to
 * let the rows "finish" — resolve to ticks, flip the badge to complete — and it
 * would be wrong twice over: the comp says otherwise, and a panel that
 * completes implies a scan this page does not run.
 *
 * Nothing invites a visitor to think it is live: the repository is the comp's
 * own `your-app/main`, as text, not an input.
 *
 * Two things run on top of the sequence, both CSS so they cost no frames:
 * a soft band sweeping down the panel while the rows arrive — a gradient, not a
 * line, because a hard edge reads as a rendering artefact and a soft one reads
 * as a pass over the code — and the "Reviewing" chips breathing on opacity
 * afterwards, so the panel is still alive once it has settled. The chips carry
 * finding counts, so they breathe rather than move: a chip that shifts is a
 * chip the reader has to find again.
 *
 * Reduced motion renders the finished frame with no sequencing, no sweep and no
 * breathing.
 *
 * The priorities card is ALWAYS in the DOM, faded rather than mounted. It used
 * to arrive through `AnimatePresence`, which meant the hero column was 8px
 * shorter until the sequence finished and everything below the hero stepped
 * down when it landed — measured: the section under it moved from 935 to 943.
 * A card that appears two seconds after load must not be allowed to move the
 * page; reserving its space costs nothing and is the whole fix. `inert` keeps
 * the button inside it out of the tab order for the seconds it is invisible.
 */

const ICONS: Record<string, string> = {
  'CODE QUALITY': 'M9 6 4.5 10.5 9 15M15 6l4.5 4.5L15 15',
  SECURITY: 'M12 4.5 6 7v4.2c0 3.3 2.4 6.2 6 7.3 3.6-1.1 6-4 6-7.3V7l-6-2.5Z',
  RELIABILITY: 'M13 4.5 6.5 13H11l-.5 6.5L17.5 11H13l.5-6.5Z',
  ARCHITECTURE: 'M5 19V9m4.7 10V5m4.6 14v-7m4.7 7V8',
  'AI LAYER': 'M12 4.5 13.6 9.4 18.5 11l-4.9 1.6L12 17.5l-1.6-4.9L5.5 11l4.9-1.6L12 4.5Z',
}

export function AuditPanel() {
  const ref = useRef<HTMLDivElement>(null)
  const { mounted, reduced } = useMotionPrefs()
  const inView = useInView(ref, { once: true, margin: '-10% 0px -10% 0px' })
  const [step, setStep] = useState(0)

  const total = lpAudit.rows.length
  const complete = !mounted || reduced || step > total

  useEffect(() => {
    if (!mounted || reduced || !inView || step > total) return
    const id = setTimeout(() => setStep((s) => s + 1), step === 0 ? 320 : 420)
    return () => clearTimeout(id)
  }, [mounted, reduced, inView, step, total])

  return (
    <div ref={ref} className="relative">
      <div className="relative overflow-hidden rounded-2xl border border-greige/40 bg-vanilla p-step-3 shadow-[0_24px_60px_-40px_rgba(42,20,24,0.5)]">
        {/* The scan sweep. Runs once, while the rows are arriving. */}
        {!complete ? (
          <span
            aria-hidden
            className="lp-scan absolute inset-x-0 top-0 z-10 h-24 bg-[linear-gradient(to_bottom,transparent,color-mix(in_srgb,var(--color-cherry)_12%,transparent),transparent)]"
          />
        ) : null}
        <div className="flex items-center justify-between gap-step-2">
          <p className="font-display text-base font-medium tracking-tight">{lpAudit.title}</p>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-greige/30 px-step-2 py-1 font-mono text-[0.6rem] tracking-[0.08em] text-bordeaux/75">
            <span className="capacity-dot size-1.5 rounded-full bg-cherry" aria-hidden />
            {lpAudit.status}
          </span>
        </div>

        <div className="mt-step-3 flex items-center gap-step-2 rounded-xl border border-greige/40 bg-oat/40 px-step-2 py-2">
          <span className="font-mono text-[0.65rem] text-bordeaux/60">{lpAudit.repoLabel}</span>
          <span className="min-w-0 flex-1 truncate font-mono text-sm text-bordeaux/80">
            {lpAudit.repo}
          </span>
          <svg viewBox="0 0 16 16" aria-hidden className="size-4 shrink-0 fill-bordeaux/50">
            <path d="M8 0a8 8 0 0 0-2.53 15.59c.4.07.55-.17.55-.38l-.01-1.34c-2.23.48-2.7-1.07-2.7-1.07-.36-.93-.89-1.18-.89-1.18-.73-.5.06-.49.06-.49.8.06 1.23.83 1.23.83.72 1.23 1.88.87 2.34.67.07-.52.28-.87.5-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.6 7.6 0 0 1 4 0c1.53-1.03 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.28.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48l-.01 2.2c0 .21.15.46.55.38A8 8 0 0 0 8 0Z" />
          </svg>
        </div>

        <ul className="mt-step-2">
          {lpAudit.rows.map((row, i) => {
            const shown = complete || step > i
            const finding = row.status !== 'Reviewing'
            return (
              <m.li
                key={row.name}
                initial={reduced || !mounted ? false : { opacity: 0, y: 6 }}
                animate={shown ? { opacity: 1, y: 0 } : { opacity: 0, y: 6 }}
                transition={{ duration: reduced ? 0 : DUR.standard, ease: EASE.enter }}
                className="flex items-center gap-step-2 border-t border-greige/30 py-step-2 first:border-t-0"
              >
                <span
                  className="grid size-8 shrink-0 place-items-center rounded-full bg-oat/60"
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
                    <path d={ICONS[row.name] ?? ICONS['CODE QUALITY']} />
                  </svg>
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block font-mono text-[0.7rem] tracking-[0.06em]">{row.name}</span>
                  <span className="block text-xs text-bordeaux/60">{row.detail}</span>
                </span>

                <span
                  className={`shrink-0 rounded-full px-step-1 py-0.5 font-mono text-[0.6rem] tracking-tight ${
                    finding ? 'bg-cherry text-vanilla' : 'lp-breathe bg-greige/30 text-bordeaux/75'
                  }`}
                >
                  {row.status}
                </span>
              </m.li>
            )
          })}
        </ul>
      </div>

      {/* TOP PRIORITIES — the comp's overlapping card, arriving once the rows
          have landed so the two read as one sequence. In flow with a negative
          margin rather than absolutely positioned: absolute placement covered
          the last rows at desktop widths. */}
      <m.div
        inert={!complete}
        aria-hidden={!complete}
        initial={false}
        animate={complete ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
        transition={{ duration: reduced ? 0 : DUR.standard, ease: EASE.enter }}
        className="relative z-10 mx-step-3 -mt-step-3 rounded-2xl border border-greige/40 bg-vanilla p-step-3 shadow-[0_24px_60px_-40px_rgba(42,20,24,0.5)] sm:mx-0 sm:ml-auto sm:mr-[-1.25rem] sm:w-[19rem]"
      >
        <p className="font-mono text-[0.6rem] tracking-[0.1em] text-bordeaux/65">
          {lpAudit.prioritiesTitle}
        </p>
        <ul className="mt-step-2 space-y-step-1">
          {lpAudit.priorities.map((p, i) => (
            <m.li
              key={p.label}
              initial={false}
              animate={complete ? { opacity: 1, x: 0 } : { opacity: 0, x: -6 }}
              transition={{
                duration: reduced ? 0 : DUR.standard,
                ease: EASE.enter,
                delay: reduced || !complete ? 0 : 0.12 + i * STAGGER * 2,
              }}
              className="flex items-center gap-step-2 text-sm"
            >
              <span className="font-mono text-xs text-bordeaux/45">{p.rank}</span>
              <span className="flex-1">{p.label}</span>
              <span
                className={`rounded-full px-step-1 py-0.5 font-mono text-[0.6rem] tracking-tight ${
                  p.severity === 'High' ? 'bg-cherry text-vanilla' : 'bg-greige/35 text-bordeaux/75'
                }`}
              >
                {p.severity}
              </span>
            </m.li>
          ))}
        </ul>
        {/* The comp's "View full report →". There is no report to open and
            nowhere off this page to send anyone, so it goes to the section that
            describes the deliverable. */}
        <button
          type="button"
          onClick={() => scrollToTarget('#how')}
          className="mt-step-2 inline-flex items-center gap-1.5 font-mono text-xs text-bordeaux underline decoration-bordeaux/40 underline-offset-4 transition-colors hover:decoration-bordeaux"
        >
          {lpAudit.report}
          <span aria-hidden>→</span>
        </button>
      </m.div>
    </div>
  )
}
