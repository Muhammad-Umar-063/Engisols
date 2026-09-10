'use client'

import { useState, type FormEvent } from 'react'

import { SheetModal } from '@/components/motion/SheetModal'
import { useToast } from '@/components/motion/Toast'
import { SITE } from '@/lib/site'
import { trackProductionCheck } from '@/src/production-check/analytics'
import {
  formatProductionCheckPrice,
  LAUNCH_BLOCKER_FIX_PRICE_USD,
} from '@/src/production-check/config'
import { productionReportPath, productionReviewRequestPath } from '@/src/production-check/paths'
import {
  REVIEW_HELP_OPTIONS,
  REVIEW_TIMELINE_OPTIONS,
  buildReviewRequestText,
  validateReviewRequest,
  type ReviewRequestContext,
  type ReviewRequestErrors,
  type ReviewRequestInput,
} from '@/src/production-check/review-intake'
import type { ProductionCheckLeadNextStep } from '@/src/production-check/types'

type SubmissionState = 'idle' | 'sending' | 'sent' | 'error'
type LeadEvent = 'lead_nurture' | 'lead_maybe' | 'lead_qualified'

interface ReviewSubmissionResult {
  requestId: string
  nextStep: ProductionCheckLeadNextStep
  notification: 'sent' | 'delayed'
  message?: string
  metaEvents?: { primary?: string; secondary?: string }
}

export function CodeReviewIntake({
  open,
  onClose,
  reviewContext,
}: {
  open: boolean
  onClose: () => void
  reviewContext: ReviewRequestContext
}) {
  const { push } = useToast()
  const [values, setValues] = useState<ReviewRequestInput>({
    name: '',
    email: '',
    help: reviewContext.fixNow > 0 ? 'fix' : 'verify',
    timeline: '',
    context: '',
  })
  const [website, setWebsite] = useState('')
  const [errors, setErrors] = useState<ReviewRequestErrors>({})
  const [submissionState, setSubmissionState] = useState<SubmissionState>('idle')
  const [submissionError, setSubmissionError] = useState('')
  const [submissionResult, setSubmissionResult] = useState<ReviewSubmissionResult>()
  const [copied, setCopied] = useState(false)
  const sending = submissionState === 'sending'

  function update<K extends keyof ReviewRequestInput>(key: K, value: ReviewRequestInput[K]) {
    setValues((current) => ({ ...current, [key]: value }))
    setSubmissionState('idle')
    setSubmissionError('')
    setCopied(false)
    setErrors((current) => {
      const next = { ...current }
      delete next[key]
      return next
    })
  }

  function validate(): boolean {
    const nextErrors = validateReviewRequest(values)
    setErrors(nextErrors)
    const firstError = Object.keys(nextErrors)[0] as keyof ReviewRequestInput | undefined
    if (firstError) {
      requestAnimationFrame(() => document.getElementById(`review-${firstError}`)?.focus())
      return false
    }
    return true
  }

  function requestText(): string {
    const reportUrl = new URL(productionReportPath(reviewContext.reportId), window.location.origin).toString()
    return buildReviewRequestText(values, reviewContext, reportUrl)
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!validate()) return

    setSubmissionState('sending')
    setSubmissionError('')
    setCopied(false)
    try {
      const response = await fetch(productionReviewRequestPath, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportId: reviewContext.reportId, ...values, website }),
      })
      const body = await readResponse(response)
      if (!response.ok || !body.ok) {
        throw new Error(body.error?.message || 'We could not send your request. Please try again.')
      }
      if (!body.requestId || !body.nextStep || !body.notification) {
        throw new Error('Your request was received, but its confirmation could not be loaded.')
      }
      setSubmissionResult({
        requestId: body.requestId,
        nextStep: body.nextStep,
        notification: body.notification,
        ...(body.message ? { message: body.message } : {}),
        ...(body.metaEvents ? { metaEvents: body.metaEvents } : {}),
      })
      setSubmissionState('sent')
      trackProductionCheck('review_request_sent', { reportId: reviewContext.reportId })
      trackProductionCheck('lead_created', {
        reportId: reviewContext.reportId,
        ...(body.metaEvents?.primary ? { metaEventId: body.metaEvents.primary } : {}),
      })
      trackProductionCheck('lead_segmented', {
        reportId: reviewContext.reportId,
        nextStep: body.nextStep,
      })
      trackProductionCheck(leadEventFor(body.nextStep), {
        reportId: reviewContext.reportId,
        ...(body.metaEvents?.secondary
          ? { metaEventId: body.metaEvents.secondary }
          : {}),
      })
      push(body.notification === 'delayed' ? 'Engineering review request saved.' : 'Engineering review request sent.')
      requestAnimationFrame(() => {
        const status = document.getElementById('review-request-status')
        status?.focus({ preventScroll: true })
        const dialog = status?.closest<HTMLElement>('[role="dialog"]')
        if (dialog) dialog.scrollTop = 0
      })
    } catch (error) {
      setSubmissionState('error')
      setSubmissionError(error instanceof Error ? error.message : 'We could not send your request. Please try again.')
      trackProductionCheck('review_request_failed', { reportId: reviewContext.reportId })
      requestAnimationFrame(() => document.getElementById('review-request-submit')?.focus())
    }
  }

  async function copyRequest() {
    if (!validate()) return
    try {
      await navigator.clipboard.writeText(requestText())
      setCopied(true)
      trackProductionCheck('review_request_copied', { reportId: reviewContext.reportId })
      push(`Engineering review request copied. Send it to ${SITE.email}.`)
    } catch {
      setCopied(false)
      push(`Copy was blocked. Email the report link to ${SITE.email}.`, 'error')
    }
  }

  return (
    <SheetModal open={open} onClose={onClose} title="Request an engineering review" themeClassName="production-check-brand">
      {submissionState === 'sent' && submissionResult ? (
        <LeadRoutingConfirmation
          result={submissionResult}
          email={values.email}
          reviewContext={reviewContext}
          onClose={onClose}
        />
      ) : (
        <form onSubmit={submit} noValidate className="space-y-step-3 text-bordeaux">
          <p className="max-w-[62ch] text-sm leading-relaxed text-bordeaux/75 sm:text-base">
            Send this report with a few details. A senior engineer will identify what needs source-code proof and recommend the smallest sensible next step.
          </p>

          <ReportAttachment context={reviewContext} />

          <div className="grid gap-step-3 sm:grid-cols-2">
            <Field id="review-name" label="Your name" error={errors.name}>
              <input id="review-name" name="name" autoComplete="name" required maxLength={100} disabled={sending} value={values.name} onChange={(event) => update('name', event.target.value)} aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? 'review-name-error' : undefined} className={fieldClass} />
            </Field>
            <Field id="review-email" label="Work email" error={errors.email}>
              <input id="review-email" name="email" type="email" inputMode="email" autoComplete="email" required maxLength={254} disabled={sending} value={values.email} onChange={(event) => update('email', event.target.value)} aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? 'review-email-error' : undefined} className={fieldClass} />
            </Field>
          </div>

          <Field id="review-help" label="What kind of help would be useful?" error={errors.help}>
            <select id="review-help" name="help" required disabled={sending} value={values.help} onChange={(event) => update('help', event.target.value as ReviewRequestInput['help'])} aria-invalid={Boolean(errors.help)} aria-describedby={errors.help ? 'review-help-error' : undefined} className={fieldClass}>
              <option value="">Choose one</option>
              {REVIEW_HELP_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </Field>

          <Field id="review-timeline" label="When do you need to move?" error={errors.timeline}>
            <select id="review-timeline" name="timeline" required disabled={sending} value={values.timeline} onChange={(event) => update('timeline', event.target.value as ReviewRequestInput['timeline'])} aria-invalid={Boolean(errors.timeline)} aria-describedby={errors.timeline ? 'review-timeline-error' : undefined} className={fieldClass}>
              <option value="">Choose a rough timeline</option>
              {REVIEW_TIMELINE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </Field>

          <Field id="review-context" label="What are you trying to ship next?" hint="Optional · 1,000 characters maximum" error={errors.context}>
            <textarea id="review-context" name="context" rows={4} maxLength={1_000} disabled={sending} value={values.context} onChange={(event) => update('context', event.target.value)} aria-invalid={Boolean(errors.context)} aria-describedby={errors.context ? 'review-context-error' : 'review-context-hint'} className={`${fieldClass} min-h-32 resize-none py-step-2`} />
          </Field>

          <div className="absolute left-[-10000px] top-auto size-px overflow-hidden" aria-hidden="true">
            <label htmlFor="review-website">Website</label>
            <input id="review-website" name="website" tabIndex={-1} autoComplete="off" value={website} onChange={(event) => setWebsite(event.target.value)} />
          </div>

          {Object.keys(errors).length ? (
            <p role="alert" className="border-l-2 border-cherry pl-step-2 text-sm">Complete the highlighted fields before sending the request.</p>
          ) : null}

          {submissionError ? (
            <div role="alert" className="rounded-xl border border-cherry/40 bg-oat p-step-2 text-sm leading-relaxed">
              <p className="font-medium text-bordeaux">Your request was not sent.</p>
              <p className="mt-1 text-bordeaux/75">{submissionError}</p>
            </div>
          ) : null}

          <div className="flex flex-col gap-step-2 border-t border-greige/60 pt-step-3 sm:flex-row sm:flex-wrap sm:items-center">
            <button id="review-request-submit" type="submit" disabled={sending} aria-busy={sending} className="inline-flex min-h-12 min-w-[12.5rem] cursor-pointer items-center justify-center rounded-full bg-cherry px-step-4 font-mono text-xs font-medium text-vanilla transition-opacity hover:opacity-90 disabled:cursor-wait disabled:opacity-60">
              {sending ? 'SENDING…' : submissionState === 'error' ? 'TRY SEND AGAIN' : 'SEND REVIEW REQUEST'} {!sending ? <span aria-hidden className="ml-2">→</span> : null}
            </button>
            {submissionState === 'error' ? (
              <button type="button" onClick={copyRequest} className="min-h-12 cursor-pointer rounded-full border border-bordeaux/35 px-step-3 font-mono text-xs transition-colors hover:border-bordeaux hover:bg-oat/60">
                {copied ? 'REQUEST COPIED' : 'COPY REQUEST INSTEAD'}
              </button>
            ) : null}
            <button type="button" onClick={onClose} className="min-h-11 cursor-pointer px-step-2 font-mono text-xs underline decoration-bordeaux/35 underline-offset-4 sm:ml-auto">
              RETURN TO REPORT
            </button>
          </div>
          <p className="font-mono text-[0.65rem] leading-relaxed text-bordeaux/60">
            This sends your contact details, report link, and answers securely to Engisols. No repository access is requested.
          </p>

          <details className="group rounded-xl border border-greige/50 bg-oat/45 p-step-2">
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-step-2 font-mono text-xs font-semibold tracking-[0.04em]">
              WHAT HAPPENS AFTER YOU SEND
              <span aria-hidden className="text-cherry transition-transform group-open:rotate-45">+</span>
            </summary>
            <ol className="mt-step-2 grid divide-y divide-greige/50 border-t border-greige/50 text-sm sm:grid-cols-3 sm:divide-x sm:divide-y-0" aria-label="How the engineering review can progress">
              {[
                ['1', 'Free report triage', 'We read the public findings and your launch context.'],
                ['2', 'Codebase audit, if needed', 'If source access will answer the open questions, you get a scoped proposal first.'],
                ['3', 'Choose who implements', 'Keep the plan, have Engisols fix it, or extend your engineering team.'],
              ].map(([number, title, body]) => (
                <li key={number} className="grid min-w-0 grid-cols-[2rem_minmax(0,1fr)] gap-step-2 py-step-2 sm:block sm:px-step-2 sm:first:pl-0 sm:last:pr-0">
                  <span className="flex size-8 items-center justify-center rounded-full bg-cherry font-mono text-xs font-semibold tabular-nums text-vanilla" aria-hidden>{number}</span>
                  <div className="min-w-0 sm:mt-step-2">
                    <p className="font-display font-semibold leading-snug">{title}</p>
                    <p className="mt-1 leading-relaxed text-bordeaux/65">{body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </details>
        </form>
      )}
    </SheetModal>
  )
}

function LeadRoutingConfirmation({
  result,
  email,
  reviewContext,
  onClose,
}: {
  result: ReviewSubmissionResult
  email: string
  reviewContext: ReviewRequestContext
  onClose: () => void
}) {
  const launchBlockerSubject = encodeURIComponent(
    `Launch Blocker Fix — ${hostnameFor(reviewContext.targetUrl)}`,
  )
  const heading = result.nextStep === 'launch_blocker_fix'
    ? 'A focused production pass may be the best next step.'
    : result.nextStep === 'senior_engineer_review'
      ? 'Review this with a senior product engineer.'
      : 'Keep the report as your launch checklist.'
  const message = result.nextStep === 'launch_blocker_fix'
    ? 'Your app looks close enough that a focused production pass may be the best next step.'
    : result.nextStep === 'senior_engineer_review'
      ? `Your report and project context are saved. We’ll follow up with ${email} after a senior engineer reviews them.`
      : 'Use the recommended first action in your report, then work through the remaining review items before launch.'

  return (
    <section id="review-request-status" tabIndex={-1} role="status" aria-live="polite" className="space-y-step-3 text-bordeaux outline-none">
      <p className="font-mono text-[0.68rem] tracking-[0.08em] text-cherry">REQUEST SAVED</p>
      <h2 className="max-w-[24ch] text-[clamp(1.8rem,4vw,2.8rem)]">{heading}</h2>
      <p className="max-w-[58ch] leading-relaxed text-bordeaux/75">{message}</p>

      {result.notification === 'delayed' ? (
        <div className="rounded-xl border border-bordeaux/25 bg-oat/55 p-step-2 text-sm leading-relaxed">
          <p className="font-medium text-bordeaux">You do not need to submit again.</p>
          <p className="mt-1 text-bordeaux/70">{result.message}</p>
        </div>
      ) : null}

      {result.nextStep === 'launch_blocker_fix' ? (
        <section className="rounded-xl border border-cherry/35 bg-oat/55 p-step-3" aria-labelledby="launch-blocker-fix-title">
          <div className="flex flex-wrap items-baseline justify-between gap-step-1">
            <h3 id="launch-blocker-fix-title" className="text-xl">Launch Blocker Fix</h3>
            <p className="font-mono text-sm font-semibold text-cherry">
              {formatProductionCheckPrice(LAUNCH_BLOCKER_FIX_PRICE_USD)} fixed scope
            </p>
          </div>
          <p className="mt-step-1 max-w-[58ch] text-sm leading-relaxed text-bordeaux/70">
            A focused pass to resolve the highest-priority production blocker without turning this into a long consulting engagement.
          </p>
          <a
            href={`mailto:${SITE.email}?subject=${launchBlockerSubject}`}
            className="mt-step-2 inline-flex min-h-12 cursor-pointer items-center justify-center rounded-full bg-cherry px-step-4 font-mono text-xs font-medium text-vanilla transition-opacity hover:opacity-90"
          >
            ASK ABOUT THE FIX <span aria-hidden className="ml-2">→</span>
          </a>
        </section>
      ) : null}

      <ReviewReportSummary context={reviewContext} compact />
      <div className="flex flex-wrap items-center gap-step-2">
        <button type="button" onClick={onClose} className="inline-flex min-h-12 cursor-pointer items-center justify-center rounded-full bg-cherry px-step-4 font-mono text-xs font-medium text-vanilla transition-opacity hover:opacity-90">
          RETURN TO REPORT <span aria-hidden className="ml-2">→</span>
        </button>
        <p className="font-mono text-[0.62rem] text-bordeaux/50">REQUEST {result.requestId}</p>
      </div>
    </section>
  )
}

function leadEventFor(nextStep: ProductionCheckLeadNextStep): LeadEvent {
  if (nextStep === 'senior_engineer_review') return 'lead_qualified'
  if (nextStep === 'launch_blocker_fix') return 'lead_maybe'
  return 'lead_nurture'
}

function hostnameFor(value: string): string {
  try {
    return new URL(value).hostname
  } catch {
    return 'production-check'
  }
}

function ReportAttachment({ context }: { context: ReviewRequestContext }) {
  const publicAttention = context.fixNow + context.review
  const summary = publicAttention > 0
    ? `${publicAttention} ${publicAttention === 1 ? 'public item' : 'public items'} flagged`
    : `${context.needsCodeReview} source checks remain`

  return (
    <section className="rounded-xl border border-greige/55 bg-oat/50 px-step-3 py-step-2" aria-label="Report included with this request">
      <div className="flex flex-wrap items-center justify-between gap-step-1">
        <p className="font-mono text-[0.65rem] font-semibold tracking-[0.08em] text-cherry">REPORT ATTACHED</p>
        <p className="font-mono text-[0.65rem] font-semibold text-bordeaux/60">{summary}</p>
      </div>
      <p className="production-check-wrap mt-step-1 font-mono text-[0.68rem] text-bordeaux/55">{context.targetUrl}</p>
      <p className="mt-1 line-clamp-2 text-sm font-semibold leading-snug text-bordeaux">{context.verdict}</p>
    </section>
  )
}

function ReviewReportSummary({
  context,
  compact = false,
}: {
  context: ReviewRequestContext
  compact?: boolean
}) {
  const publicAttention = context.fixNow + context.review
  const summary = publicAttention > 0
    ? `${publicAttention} ${publicAttention === 1 ? 'public item needs' : 'public items need'} attention.`
    : context.needsCodeReview > 0
      ? `No supported public issue was observed. ${context.needsCodeReview} ${context.needsCodeReview === 1 ? 'private control still needs' : 'private controls still need'} source-code review.`
      : 'No supported issue was observed in the sampled public surface.'

  return (
    <section className="overflow-hidden rounded-xl border border-greige/55 bg-vanilla" aria-label="Report included with this request">
      <div className="flex flex-wrap items-center justify-between gap-step-1 border-b border-greige/45 bg-oat/55 px-step-3 py-step-2">
        <p className="font-mono text-[0.65rem] font-semibold tracking-[0.08em] text-bordeaux">REPORT ATTACHED</p>
        <p className="rounded-full bg-cherry px-step-2 py-1 font-mono text-[0.6rem] font-semibold tracking-[0.06em] text-vanilla">PUBLIC-SURFACE CHECK</p>
      </div>

      <div className="p-step-3">
        <p className="production-check-wrap font-mono text-[0.68rem] text-bordeaux/55">{context.targetUrl}</p>
        <p className={`mt-step-2 max-w-[46ch] font-display font-semibold leading-snug ${compact ? 'text-lg' : 'text-[clamp(1.25rem,2.4vw,1.75rem)]'}`}>{context.verdict}</p>
        <p className="mt-step-1 max-w-[68ch] text-sm leading-relaxed text-bordeaux/70">{summary}</p>

        {!compact ? (
          <div className="mt-step-3 grid grid-cols-3 divide-x divide-greige/50 border-y border-greige/50 py-step-2" aria-label="Report handoff summary">
            <ReviewStat value={context.fixNow} label="FIX NOW" urgent={context.fixNow > 0} />
            <ReviewStat value={context.review} label="PUBLIC REVIEW" />
            <ReviewStat value={context.needsCodeReview} label="CODE CHECKS" />
          </div>
        ) : null}

        <div className={`${compact ? 'mt-step-2' : 'mt-step-3'} rounded-lg bg-oat/55 px-step-2 py-step-2`}>
          <p className="font-mono text-[0.62rem] font-semibold tracking-[0.07em] text-cherry">FIRST ENGINEERING ACTION</p>
          <p className="production-check-wrap mt-1 text-sm font-medium leading-relaxed text-bordeaux">{context.recommendedAction}</p>
        </div>
      </div>
    </section>
  )
}

function ReviewStat({ value, label, urgent = false }: { value: number; label: string; urgent?: boolean }) {
  return (
    <div className="min-w-0 px-step-1 text-center sm:px-step-2">
      <p className={`font-display text-2xl font-semibold leading-none tabular-nums sm:text-3xl ${urgent ? 'text-cherry' : 'text-bordeaux'}`}>{value}</p>
      <p className="production-check-wrap mt-step-1 font-mono text-[0.55rem] font-semibold tracking-[0.05em] text-bordeaux/55 sm:text-[0.62rem]">{label}</p>
    </div>
  )
}

const fieldClass = 'mt-step-1 min-h-12 w-full rounded-xl border border-bordeaux/30 bg-vanilla px-step-2 text-base outline-none transition-colors focus-visible:border-cherry focus-visible:ring-2 focus-visible:ring-cherry/25 disabled:cursor-wait disabled:opacity-60'

async function readResponse(response: Response): Promise<{
  ok: boolean
  requestId?: string
  nextStep?: ProductionCheckLeadNextStep
  notification?: 'sent' | 'delayed'
  message?: string
  metaEvents?: { primary?: string; secondary?: string }
  error?: { message?: string }
}> {
  try {
    return await response.json() as {
      ok: boolean
      requestId?: string
      nextStep?: ProductionCheckLeadNextStep
      notification?: 'sent' | 'delayed'
      message?: string
      metaEvents?: { primary?: string; secondary?: string }
      error?: { message?: string }
    }
  } catch {
    return { ok: false }
  }
}

function Field({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string
  label: string
  hint?: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <label htmlFor={id} className="block font-mono text-xs text-bordeaux/75">
      {label}
      {hint ? <span id={`${id}-hint`} className="ml-step-1 text-bordeaux/50">{hint}</span> : null}
      {children}
      {error ? <span id={`${id}-error`} className="mt-1 block text-cherry">{error}</span> : null}
    </label>
  )
}
