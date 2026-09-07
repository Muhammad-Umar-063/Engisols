'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

import { trackProductionCheck } from '@/src/production-check/analytics'
import { destinationForScan } from '@/src/production-check/navigation'
import { productionAnswersPath, productionStatusPath } from '@/src/production-check/paths'
import {
  BUILDER_ANSWERS,
  LAUNCH_STAGE_ANSWERS,
  type BuilderAnswer,
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

export function LiveScan({ initial }: { initial: PersistedScan }) {
  const router = useRouter()
  const [scan, setScan] = useState(initial)
  const [statusError, setStatusError] = useState('')
  const pollFailures = useRef(0)
  const currentIndex = phaseLabels.findIndex(({ phase }) => phase === scan.progress.phase)
  const visiblePhaseLabels = phaseLabels.slice(
    Math.max(0, currentIndex - 1),
    Math.min(phaseLabels.length, currentIndex + 2),
  )
  const scanId = scan.publicId
  const scanStatus = scan.status
  const destination = destinationForScan({ publicId: scanId, status: scanStatus })
  const reconnectFailed = statusError.startsWith('We could not reconnect')
  const liveObservation = observationFor(scan)

  useEffect(() => {
    if (destination) {
      trackProductionCheck(scanStatus === 'partial' ? 'scan_partial' : 'scan_completed')
      router.replace(destination)
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
        const body = (await response.json()) as { ok: boolean; scan: PersistedScan }
        if (body.ok) {
          setScan((current) => sameLiveSnapshot(current, body.scan) ? current : body.scan)
          setStatusError('')
          pollFailures.current = 0
        }
      } catch {
        if (!controller.signal.aborted) {
          pollFailures.current += 1
          if (pollFailures.current >= 8) {
            setStatusError('We could not reconnect to this scan. Reload to check its latest state.')
            controller.abort()
          } else {
            setStatusError('Connection paused. Reconnecting to your scan…')
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
  }, [destination, router, scanId, scanStatus])

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
      <div className="max-w-3xl rounded-2xl border border-greige/50 bg-oat p-step-4 sm:p-step-5">
        <p className="inline-flex rounded-full bg-vanilla px-step-2 py-1 font-mono text-[0.65rem] tracking-[0.08em]">SCAN NOT COMPLETED</p>
        <h2 className="mt-step-3 text-[clamp(2rem,5vw,3.5rem)]">We couldn&apos;t reach this app.</h2>
        <p className="measure mt-step-3 text-lg text-bordeaux/80">{scan.error?.message}</p>
        <div className="mt-step-4 flex flex-wrap gap-step-2">
          <Link href="/production-check#tool" className="inline-flex min-h-12 items-center rounded-full bg-cherry px-step-4 font-mono text-sm text-vanilla no-underline">TRY AGAIN <span aria-hidden className="ml-2">→</span></Link>
          <Link href="/production-check#tool" className="inline-flex min-h-12 items-center px-step-2 font-mono text-sm underline decoration-bordeaux/40 underline-offset-4">ENTER ANOTHER URL</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="grid min-w-0 gap-step-3 lg:grid-cols-[minmax(0,1.4fr)_minmax(20rem,.6fr)] lg:items-start">
      <section className="min-w-0 overflow-hidden rounded-2xl border border-greige/50 bg-oat/55">
        <div className="p-step-3 sm:p-step-4">
          <div className="flex flex-col gap-step-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <p className="font-mono text-xs tracking-[0.08em] text-bordeaux/70">CHECKING YOUR APP</p>
              <p className="production-check-wrap mt-step-1 font-display text-[clamp(1.4rem,3vw,2.1rem)]">{scan.requestedUrl}</p>
              <p role="status" aria-live="polite" className="mt-step-3 text-xl font-medium sm:text-2xl">{scan.progress.message}</p>
            </div>
            <div className="shrink-0">
              <p className="font-display text-[clamp(4.5rem,10vw,7rem)] leading-[0.82] tabular-nums">{scan.progress.progress}<span className="ml-1 text-2xl">%</span></p>
              <p className="mt-step-2 font-mono text-[0.65rem] tracking-[0.08em] text-bordeaux/65">REAL SCANNER PROGRESS</p>
            </div>
          </div>

          <div className="mt-step-4 h-3 overflow-hidden rounded-full border border-bordeaux/15 bg-vanilla" aria-hidden="true">
            <div className="h-full rounded-full bg-cherry transition-[width] duration-300 motion-reduce:transition-none" style={{ width: `${scan.progress.progress}%` }} />
          </div>
          {statusError ? (
            <div className="mt-step-2 flex flex-wrap items-center gap-step-2 text-sm text-bordeaux/75">
              <p>{statusError}</p>
              {reconnectFailed ? (
                <button type="button" onClick={() => window.location.reload()} className="cursor-pointer font-medium underline decoration-bordeaux/40 underline-offset-4">Reload status</button>
              ) : null}
            </div>
          ) : null}

          <ol className="mt-step-4 grid gap-x-step-3 sm:grid-cols-2">
            {visiblePhaseLabels.map((item) => {
              const index = phaseLabels.findIndex(({ phase }) => phase === item.phase)
              const state = index < currentIndex ? 'done' : index === currentIndex ? 'active' : 'upcoming'
              return (
                <li key={item.phase} className={`flex min-h-11 items-center gap-step-2 border-t border-greige/60 py-step-2 ${state === 'active' ? 'font-medium' : ''}`}>
                  <span aria-hidden className={`grid size-7 shrink-0 place-items-center rounded-full border font-mono text-xs ${state === 'active' ? 'border-cherry bg-cherry text-vanilla' : state === 'done' ? 'border-bordeaux bg-bordeaux text-vanilla' : 'border-bordeaux/30 text-bordeaux/60'}`}>
                    {state === 'done' ? '✓' : state === 'active' ? '→' : '○'}
                  </span>
                  <span className={state === 'upcoming' ? 'text-bordeaux/60' : 'text-bordeaux'}>{item.label}</span>
                  <span className="sr-only">{state}</span>
                </li>
              )
            })}
          </ol>
        </div>

      </section>

      <aside className="min-w-0 space-y-step-2">
        <div data-ground="dark" className="rounded-2xl bg-cherry p-step-3 text-vanilla on-dark sm:p-step-4" aria-label="Current scanner observation">
          <p className="font-mono text-xs tracking-[0.08em] text-vanilla/75">{liveObservation.label}</p>
          <p className="measure mt-step-2 font-display text-xl leading-snug sm:text-2xl">{liveObservation.message}</p>
          {scan.progress.events.length ? (
            <ul className="mt-step-3 space-y-step-1 border-t border-vanilla/25 pt-step-2 text-sm text-vanilla/85">
              {scan.progress.events.slice(-3).map((event, index) => (
                <li key={`${event.timestamp}-${index}`} className="production-check-wrap">{event.message}</li>
              ))}
            </ul>
          ) : null}
        </div>
        <div className="rounded-2xl border border-greige/50 bg-vanilla p-step-3 sm:p-step-4">
          <p className="font-mono text-xs tracking-[0.08em] text-bordeaux/65">WHILE WE FINISH…</p>
          <div className="mt-step-3 space-y-step-4">
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
        </div>
        <div className="rounded-2xl bg-bordeaux p-step-3 text-vanilla on-dark sm:p-step-4" data-ground="dark">
          <p className="font-mono text-xs tracking-[0.08em] text-vanilla/70">PASSIVE BY DESIGN</p>
          <p className="mt-step-2 text-sm leading-relaxed text-vanilla/90">We never replay credentials, call discovered APIs, or attempt to exploit your application.</p>
        </div>
      </aside>
    </div>
  )
}

function observationFor(scan: PersistedScan): { label: string; message: string } {
  const recentEvents = [...scan.progress.events].reverse()
  const event = recentEvents.find(({ type }) => type === 'technology')
    ?? recentEvents.find(({ type }) => type === 'observation')
  const technology = event?.metadata?.technology
  if (technology === 'Supabase') {
    return { label: 'SUPABASE DETECTED', message: 'Public anon keys can be normal. We are checking what actually needs attention.' }
  }
  if (technology === 'Stripe') {
    return { label: 'STRIPE DETECTED', message: 'Publishable keys belong in browser code. Privileged keys do not.' }
  }
  if (technology === 'OpenAI') {
    return { label: 'OPENAI SIGNAL DETECTED', message: 'Server-side AI credentials should never be shipped to a browser.' }
  }
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
      <legend className="font-display text-xl leading-snug">{title}</legend>
      <p className="mt-step-1 text-sm text-bordeaux/65">Optional — the scan will not wait.</p>
      <div className="mt-step-2 flex flex-wrap gap-step-1">
        {options.map((option) => (
          <button key={option.value} type="button" aria-pressed={selected === option.value} onClick={() => onSelect(option.value)} className="min-h-11 cursor-pointer rounded-full border border-bordeaux/35 px-step-2 py-step-1 text-sm transition-colors hover:border-bordeaux aria-pressed:border-bordeaux aria-pressed:bg-bordeaux aria-pressed:text-vanilla">
            {option.label}
          </button>
        ))}
      </div>
    </fieldset>
  )
}
