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
  const scanId = scan.publicId
  const scanStatus = scan.status
  const destination = destinationForScan({ publicId: scanId, status: scanStatus })
  const reconnectFailed = statusError.startsWith('We could not reconnect')

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
      <div className="max-w-2xl border-t border-bordeaux/25 pt-step-4">
        <p className="font-mono text-xs text-current/60">SCAN NOT COMPLETED</p>
        <h2 className="mt-step-2 text-3xl">We couldn&apos;t reach this app.</h2>
        <p className="measure mt-step-2 text-current/75">{scan.error?.message}</p>
        <div className="mt-step-4 flex flex-wrap gap-step-2">
          <Link href="/production-check" className="rounded-full bg-cherry px-step-3 py-step-2 text-vanilla no-underline">Try again</Link>
          <Link href="/production-check" className="px-step-2 py-step-2 underline">Enter another URL</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="grid min-w-0 gap-step-5 lg:grid-cols-[minmax(0,1.25fr)_minmax(280px,.75fr)]">
      <div className="min-w-0">
        <div className="flex items-end justify-between gap-step-3">
          <div className="min-w-0">
            <p className="font-mono text-xs text-current/60">CHECKING</p>
            <p className="production-check-wrap mt-step-1 text-lg">{scan.requestedUrl}</p>
          </div>
          <p className="shrink-0 font-display text-5xl tabular-nums">{scan.progress.progress}%</p>
        </div>
        <div className="mt-step-3 h-2 overflow-hidden rounded-full bg-bordeaux/10" aria-hidden="true">
          <div className="h-full rounded-full bg-cherry transition-[width] duration-300 motion-reduce:transition-none" style={{ width: `${scan.progress.progress}%` }} />
        </div>
        <p role="status" aria-live="polite" className="mt-step-2 text-lg">{scan.progress.message}</p>
        {statusError ? (
          <div className="mt-step-1 flex flex-wrap items-center gap-step-2 text-sm text-current/60">
            <p>{statusError}</p>
            {reconnectFailed ? (
              <button type="button" onClick={() => window.location.reload()} className="underline decoration-current/35 underline-offset-4">Reload status</button>
            ) : null}
          </div>
        ) : null}

        <ol className="mt-step-5 border-t border-bordeaux/20">
          {phaseLabels.map((item, index) => {
            const state = index < currentIndex ? 'done' : index === currentIndex ? 'active' : 'upcoming'
            return (
              <li key={item.phase} className="flex items-center gap-step-2 border-b border-bordeaux/15 py-step-2">
                <span aria-hidden className="w-5 font-mono text-sm">{state === 'done' ? '✓' : state === 'active' ? '→' : '○'}</span>
                <span className={state === 'upcoming' ? 'text-current/45' : ''}>{item.label}</span>
                <span className="sr-only">{state}</span>
              </li>
            )
          })}
        </ol>

        {scan.progress.events.length ? (
          <div className="mt-step-4" aria-label="Recent scan activity">
            <p className="font-mono text-xs text-current/60">RECENT ACTIVITY</p>
            <ul className="mt-step-2 space-y-step-1 text-sm text-current/75">
              {scan.progress.events.slice(-5).map((event, index) => (
                <li key={`${event.timestamp}-${index}`} className="production-check-wrap">{event.message}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      <aside className="min-w-0 space-y-step-4 border-t border-bordeaux/20 pt-step-4 lg:border-l lg:border-t-0 lg:pl-step-4 lg:pt-0">
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
        <div className="border-t border-bordeaux/20 pt-step-3">
          <p className="font-mono text-xs text-current/60">PASSIVE BY DESIGN</p>
          <p className="mt-step-2 text-sm text-current/75">We never replay credentials, call discovered APIs, or attempt to exploit your application.</p>
        </div>
      </aside>
    </div>
  )
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
      <legend className="font-display text-xl">{title}</legend>
      <p className="mt-step-1 text-xs text-current/55">Optional — the scan will not wait.</p>
      <div className="mt-step-2 flex flex-wrap gap-step-1">
        {options.map((option) => (
          <button key={option.value} type="button" aria-pressed={selected === option.value} onClick={() => onSelect(option.value)} className="rounded-full border border-bordeaux/25 px-step-2 py-step-1 text-sm hover:border-bordeaux aria-pressed:bg-bordeaux aria-pressed:text-vanilla">
            {option.label}
          </button>
        ))}
      </div>
    </fieldset>
  )
}
