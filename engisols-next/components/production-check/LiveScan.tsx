'use client'

import { useEffect, useRef, useState } from 'react'

import { trackProductionCheck } from '@/src/production-check/analytics'
import { InlineReportPanel } from '@/components/production-check/ReportView'
import { productionAnswersPath, productionStatusPath } from '@/src/production-check/paths'
import {
  BUILDER_ANSWERS,
  LAUNCH_STAGE_ANSWERS,
  type BuilderAnswer,
  type FounderReport,
  type LaunchStageAnswer,
  type PersistedScan,
  type ScanAnswers,
} from '@/src/production-check/types'
import { SCAN_PHASES, type ScanPhase } from '@/src/scanner/types'

const phaseLabelByPhase: Record<ScanPhase, string> = {
  validating: 'Public address validated',
  fetching: 'Website reached',
  headers: 'Response headers checked',
  discovering_assets: 'Browser bundles discovered',
  analyzing_assets: 'Browser-side code inspected',
  classifying: 'Observations classified',
  building_report: 'Prioritized report prepared',
  complete: 'Scan complete',
}
const phaseLabels = SCAN_PHASES
  .filter((phase) => phase !== 'complete')
  .map((phase) => ({ phase, label: phaseLabelByPhase[phase] }))
const builderLabels: Record<BuilderAnswer, string> = {
  lovable: 'Lovable', bolt: 'Bolt', cursor: 'Cursor', v0: 'v0', replit: 'Replit',
  claude_code: 'Claude Code', other: 'Other', not_sure: 'Not sure',
}
const stageLabels: Record<LaunchStageAnswer, string> = {
  experimenting: 'Just experimenting', preparing_to_launch: 'Preparing to launch',
  has_users: 'Already has users', taking_payments: 'Taking payments',
}

export function LiveScan({
  initial,
  initialReport,
  onComplete,
  onRestart,
}: {
  initial: PersistedScan
  initialReport?: FounderReport
  onComplete: (scan: PersistedScan, report: FounderReport) => void
  onRestart: () => void
}) {
  const [scan, setScan] = useState(initial)
  const [report, setReport] = useState<FounderReport | undefined>(initialReport)
  const [statusError, setStatusError] = useState('')
  const pollFailures = useRef(0)
  const completionHandled = useRef(false)
  const currentIndex = phaseLabels.findIndex(({ phase }) => phase === scan.progress.phase)
  const visiblePhaseLabels = phaseLabels.slice(
    Math.max(0, currentIndex - 1),
    Math.min(phaseLabels.length, currentIndex + 2),
  )
  const scanId = scan.publicId
  const scanStatus = scan.status
  const complete = scanStatus === 'completed' || scanStatus === 'partial'
  const liveObservation = observationFor(scan)

  useEffect(() => {
    if (complete && report) {
      if (completionHandled.current) return
      completionHandled.current = true
      trackProductionCheck(
        scanStatus === 'partial' ? 'scan_partial' : 'scan_completed',
        {
          ...(scan.metaEvents?.scanCompleted
            ? { metaEventId: scan.metaEvents.scanCompleted }
            : {}),
        },
      )
      onComplete(scan, report)
      return
    }
    if (scanStatus === 'failed') {
      trackProductionCheck('scan_failed')
      return
    }

    const controller = new AbortController()
    let timeout: ReturnType<typeof setTimeout> | undefined
    async function poll() {
      try {
        const response = await fetch(productionStatusPath(scanId), {
          cache: 'no-store',
          signal: controller.signal,
        })
        if (!response.ok) throw new Error('status unavailable')
        const body = (await response.json()) as { ok: boolean; scan: PersistedScan; report?: FounderReport }
        if (body.ok) {
          if (body.report) setReport(body.report)
          setScan((current) => sameLiveSnapshot(current, body.scan) ? current : body.scan)
          setStatusError('')
          pollFailures.current = 0
        }
      } catch {
        if (!controller.signal.aborted) {
          pollFailures.current += 1
          if (pollFailures.current >= 8) {
            setStatusError('We could not reconnect to this scan. Reload the page to check its latest state.')
            controller.abort()
          } else {
            setStatusError('Connection paused. Reconnecting…')
          }
        }
      } finally {
        if (!controller.signal.aborted) timeout = setTimeout(poll, 1_000)
      }
    }
    timeout = setTimeout(poll, 350)
    return () => {
      controller.abort()
      if (timeout) clearTimeout(timeout)
    }
  }, [complete, onComplete, report, scan, scanId, scanStatus])

  async function answer(values: ScanAnswers) {
    setScan((current) => ({ ...current, answers: { ...current.answers, ...values } }))
    if (values.builder) trackProductionCheck('builder_answered', { answer: values.builder })
    if (values.launchStage) trackProductionCheck('launch_stage_answered', { answer: values.launchStage })
    await fetch(productionAnswersPath(scan.publicId), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    }).catch(() => undefined)
  }

  if (scan.status === 'failed') {
    return (
      <section className="rounded-2xl border border-greige/50 bg-vanilla p-step-3 text-bordeaux shadow-[0_24px_70px_-48px_rgba(42,20,24,0.75)] sm:p-step-4" aria-labelledby="scan-failed-title">
        <p className="font-mono text-[0.65rem] tracking-[0.08em] text-bordeaux/60">SCAN NOT COMPLETED</p>
        <h2 id="scan-failed-title" className="mt-step-2 text-[clamp(1.8rem,4vw,2.6rem)]">We couldn&apos;t reach this app.</h2>
        <p className="mt-step-2 text-bordeaux/75">{scan.error?.message}</p>
        <p className="mt-step-1 text-sm text-bordeaux/65">Check that the URL opens without signing in, then try again.</p>
        <button type="button" onClick={onRestart} className="mt-step-3 min-h-12 cursor-pointer rounded-full bg-cherry px-step-4 font-mono text-xs text-vanilla">TRY ANOTHER URL</button>
      </section>
    )
  }

  if (complete && report) return <InlineReportPanel scan={scan} report={report} />

  return (
    <section className="rounded-2xl border border-greige/50 bg-vanilla p-step-3 text-bordeaux shadow-[0_24px_70px_-48px_rgba(42,20,24,0.75)] sm:p-step-4" aria-labelledby="live-scan-title">
      <div className="flex items-center justify-between gap-step-2 border-b border-greige/50 pb-step-2">
        <h2 id="live-scan-title" className="font-display text-lg">Checking your app</h2>
        <span className="rounded-full bg-oat px-step-2 py-1 font-mono text-[0.65rem] tabular-nums">{scan.progress.progress}%</span>
      </div>

      <p className="production-check-wrap mt-step-3 font-mono text-xs text-bordeaux/60">{scan.requestedUrl}</p>
      <p role="status" aria-live="polite" className="mt-step-2 text-xl font-medium">{scan.progress.message}</p>

      <div
        className="mt-step-3 h-2 overflow-hidden rounded-full bg-oat"
        role="progressbar"
        aria-label="Production check progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={scan.progress.progress}
      >
        <div className="h-full rounded-full bg-cherry transition-[width] duration-300 motion-reduce:transition-none" style={{ width: `${scan.progress.progress}%` }} />
      </div>
      {statusError ? <p className="mt-step-2 text-sm text-bordeaux/70">{statusError}</p> : null}

      <ol className="mt-step-3 divide-y divide-greige/55 border-y border-greige/55">
        {visiblePhaseLabels.map((item) => {
          const index = phaseLabels.findIndex(({ phase }) => phase === item.phase)
          const state = index < currentIndex ? 'done' : index === currentIndex ? 'active' : 'upcoming'
          return (
            <li key={item.phase} className="flex min-h-10 items-center gap-step-2 py-step-1 text-sm">
              <span aria-hidden className={`size-2 shrink-0 rounded-full ${state === 'active' ? 'bg-cherry' : state === 'done' ? 'bg-bordeaux' : 'border border-bordeaux/35'}`} />
              <span className={state === 'upcoming' ? 'text-bordeaux/55' : 'text-bordeaux'}>{item.label}</span>
              <span className="sr-only">{state}</span>
            </li>
          )
        })}
      </ol>

      <div className="mt-step-3 rounded-xl bg-oat p-step-2">
        <p className="font-mono text-[0.65rem] tracking-[0.06em] text-bordeaux/60">{liveObservation.label}</p>
        <p className="mt-step-1 text-sm leading-relaxed text-bordeaux/80">{liveObservation.message}</p>
      </div>

      <details className="group mt-step-2 border-t border-greige/50 pt-step-1">
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-step-2 text-sm font-medium">
          Optional: personalize the report
          <span aria-hidden className="text-lg text-cherry transition-transform group-open:rotate-45 motion-reduce:transition-none">+</span>
        </summary>
        <div className="space-y-step-3 pb-step-2">
          <Question
            title="What did you use to build this app?"
            options={BUILDER_ANSWERS.map((value) => ({ value, label: builderLabels[value] }))}
            selected={scan.answers.builder}
            onSelect={(value) => answer({ builder: value as BuilderAnswer })}
          />
          {scan.progress.progress >= 35 ? (
            <Question
              title="Where is this app today?"
              options={LAUNCH_STAGE_ANSWERS.map((value) => ({ value, label: stageLabels[value] }))}
              selected={scan.answers.launchStage}
              onSelect={(value) => answer({ launchStage: value as LaunchStageAnswer })}
            />
          ) : null}
        </div>
      </details>
    </section>
  )
}

function observationFor(scan: PersistedScan): { label: string; message: string } {
  const recentEvents = [...scan.progress.events].reverse()
  const event = recentEvents.find(({ type }) => type === 'technology')
    ?? recentEvents.find(({ type }) => type === 'observation')
  const technology = event?.metadata?.technology
  if (technology === 'Supabase') return { label: 'SUPABASE DETECTED', message: 'Public anon keys can be normal. We are checking what actually needs attention.' }
  if (technology === 'Stripe') return { label: 'STRIPE DETECTED', message: 'Publishable keys belong in browser code. Privileged keys do not.' }
  if (technology === 'OpenAI') return { label: 'OPENAI SIGNAL DETECTED', message: 'Server-side AI credentials should never be shipped to a browser.' }
  if (event) return { label: 'LIVE OBSERVATION', message: event.message }
  return { label: 'PUBLIC-SURFACE CHECK', message: 'Public frontend configuration is not automatically a security leak.' }
}

function sameLiveSnapshot(left: PersistedScan, right: PersistedScan): boolean {
  const leftLast = left.progress.events.at(-1)
  const rightLast = right.progress.events.at(-1)
  return left.status === right.status &&
    left.progress.phase === right.progress.phase &&
    left.progress.progress === right.progress.progress &&
    left.progress.message === right.progress.message &&
    left.progress.events.length === right.progress.events.length &&
    leftLast?.timestamp === rightLast?.timestamp &&
    leftLast?.message === rightLast?.message &&
    left.answers.builder === right.answers.builder &&
    left.answers.launchStage === right.answers.launchStage &&
    left.error?.code === right.error?.code &&
    left.error?.message === right.error?.message
}

function Question({ title, options, selected, onSelect }: { title: string; options: Array<{ value: string; label: string }>; selected?: string; onSelect: (value: string) => void }) {
  return (
    <fieldset>
      <legend className="font-display text-base">{title}</legend>
      <div className="mt-step-1 flex flex-wrap gap-step-1">
        {options.map((option) => (
          <button key={option.value} type="button" aria-pressed={selected === option.value} onClick={() => onSelect(option.value)} className="min-h-10 cursor-pointer rounded-full border border-bordeaux/30 px-step-2 py-step-1 text-sm transition-colors hover:border-bordeaux aria-pressed:border-bordeaux aria-pressed:bg-bordeaux aria-pressed:text-vanilla">
            {option.label}
          </button>
        ))}
      </div>
    </fieldset>
  )
}
