'use client'

import { createContext, useCallback, useContext, useState, type FormEvent, type ReactNode } from 'react'
import { Magnetic } from '@/components/motion/Magnetic'
import { SheetModal } from '@/components/motion/SheetModal'
import { DotsMorphButton } from '@/components/motion/DotsMorphButton'
import { useToast } from '@/components/motion/Toast'
import { lpForm } from '@/content/campaign'
import {
  validateAuditInquiry,
  type AuditInquiryErrors,
  type AuditInquiryInput,
} from '@/src/campaign/audit-inquiry'

/**
 * Every CTA on the page, and the dialog behind them.
 *
 * The comp's buttons have no destination drawn, and the two obvious ones are
 * both closed off: /contact is on the site, which this page may not reach, and
 * there is no calendar account to embed yet. A dialog is the only answer that
 * leaves the page pixel-identical to the comp — nothing is added to the layout,
 * the form exists only once someone asks for it — while keeping the conversion
 * on the page the ad paid for.
 *
 * One provider, one dialog, many buttons: the CTA appears four times in the
 * comp and they must all do the same thing.
 *
 * Submission stays on the page and is delivered through the server-side
 * campaign inquiry route. Provider credentials never enter the client bundle.
 */

const BookingCtx = createContext<(() => void) | null>(null)

/** Opens the dialog. Any client component under the provider may call it. */
export function useBooking() {
  const open = useContext(BookingCtx)
  if (!open) throw new Error('CTA rendered outside <BookingProvider>')
  return open
}

export function BookingProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const show = useCallback(() => setOpen(true), [])

  return (
    <BookingCtx.Provider value={show}>
      {children}
      <SheetModal
        open={open}
        onClose={() => setOpen(false)}
        title={lpForm.heading}
        themeClassName="engisols-campaign-brand"
      >
        <BookingForm onDone={() => setOpen(false)} />
      </SheetModal>
    </BookingCtx.Provider>
  )
}

/**
 * The CTA. `variant` matches the three treatments the comp draws.
 *
 * The magnetic field is INSIDE the component, not at the call sites. The button
 * appears four times — header, hero, the clarity panel, the closing band — and
 * a pull that only some of them have reads as a bug rather than as emphasis.
 * `-m-6` cancels the field's own padding so the surrounding layout does not
 * move; `snap={false}` keeps the cursor a dot on it, because a button already
 * shows its own shape and covering it hides the label.
 */
export function BookButton({
  label,
  shortLabel,
  variant = 'primary',
  className = '',
}: {
  label: string
  shortLabel?: string
  variant?: 'primary' | 'inverse' | 'compact'
  className?: string
}) {
  const open = useBooking()

  const style =
    variant === 'inverse'
      ? 'bg-vanilla text-cherry'
      : variant === 'compact'
        ? 'bg-cherry text-vanilla'
        : 'bg-cherry text-vanilla'

  const size = variant === 'compact' ? 'px-step-3 py-2 text-xs' : 'px-step-4 py-step-2 text-sm'

  return (
    <Magnetic className="-m-6" snap={false}>
      <button
        type="button"
        onClick={open}
        aria-label={label}
      // The cursor takes its fill from the nearest `[data-ground]`, and a
      // button is a surface of its own: a cherry fill sitting on a light page
      // is dark ground for the few pixels it covers, and without this the
      // cursor paints bordeaux on bordeaux and disappears the moment it is over
      // the thing it is pointing at. The inverse variant is the same rule
      // running the other way.
      data-ground={variant === 'inverse' ? 'light' : 'dark'}
      // No `data-cursor`. The cursor's own rule: `link` is for a run of text,
      // which has no shape of its own to show, and covering a button says
      // nothing a reader cannot already see — it just hides the label under a
      // slab. On a CTA the cursor stays a dot and `Magnetic` does the talking.
      className={`inline-flex min-h-11 items-center gap-2 rounded-full font-mono font-medium tracking-tight whitespace-nowrap transition-opacity hover:opacity-90 ${style} ${size} ${className}`}
      style={{ transitionTimingFunction: 'var(--ease-micro)' }}
    >
        {shortLabel ? (
          <>
            <span className="hidden sm:inline">{label}</span>
            <span className="sm:hidden">{shortLabel}</span>
          </>
        ) : label}
        <span aria-hidden>→</span>
      </button>
    </Magnetic>
  )
}

type SubmissionState = 'idle' | 'pending' | 'sent' | 'error'

function BookingForm({ onDone }: { onDone: () => void }) {
  const [values, setValues] = useState<AuditInquiryInput>({ name: '', email: '', app: '', worry: '' })
  const [website, setWebsite] = useState('')
  const [errors, setErrors] = useState<AuditInquiryErrors>({})
  const [state, setState] = useState<SubmissionState>('idle')
  const [submissionError, setSubmissionError] = useState('')
  const { push } = useToast()

  function update<K extends keyof AuditInquiryInput>(key: K, value: AuditInquiryInput[K]) {
    setValues((current) => ({ ...current, [key]: value }))
    setState('idle')
    setSubmissionError('')
    setErrors((current) => {
      const next = { ...current }
      delete next[key]
      return next
    })
  }

  function validate(): boolean {
    const nextErrors = validateAuditInquiry(values)
    setErrors(nextErrors)
    const firstError = Object.keys(nextErrors)[0] as keyof AuditInquiryInput | undefined
    if (firstError) {
      requestAnimationFrame(() => document.getElementById(`lp-${firstError}`)?.focus())
      return false
    }
    return true
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!validate()) return
    setState('pending')
    setSubmissionError('')
    try {
      const response = await fetch('/api/ai-app-audit/inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, website }),
      })
      const body = await readResponse(response)
      if (!response.ok || !body.ok) {
        throw new Error(body.error?.message || 'We could not send your request. Please try again.')
      }
      setState('sent')
      push(lpForm.done)
      requestAnimationFrame(() => document.getElementById('lp-inquiry-status')?.focus())
    } catch (error) {
      setState('error')
      setSubmissionError(error instanceof Error ? error.message : 'We could not send your request. Please try again.')
      requestAnimationFrame(() => document.getElementById('lp-inquiry-submit')?.focus())
    }
  }

  if (state === 'sent') {
    return (
      <section id="lp-inquiry-status" tabIndex={-1} role="status" aria-live="polite" className="space-y-step-3 text-bordeaux outline-none">
        <p className="font-mono text-[0.68rem] font-semibold tracking-[0.08em] text-cherry">REQUEST RECEIVED</p>
        <h3 className="max-w-[22ch] text-[clamp(1.65rem,5vw,2.5rem)]">A senior engineer will review the context before replying.</h3>
        <p className="max-w-[58ch] leading-relaxed text-bordeaux/75">
          We sent your app details and concern to Engisols. Expect a reply to <strong className="font-medium text-bordeaux">{values.email}</strong> within one working day.
        </p>
        <div className="rounded-xl border border-greige/50 bg-oat/60 p-step-3">
          <p className="font-mono text-[0.65rem] font-semibold tracking-[0.08em] text-cherry">WHAT HAPPENS NEXT</p>
          <p className="mt-step-1 text-sm leading-relaxed text-bordeaux/75">We first decide whether a codebase audit is justified. If it is, you receive scope and price before sharing repository access.</p>
        </div>
        <button type="button" onClick={onDone} className="inline-flex min-h-12 items-center justify-center rounded-full bg-cherry px-step-4 font-mono text-xs font-semibold text-vanilla transition-opacity hover:opacity-90">
          RETURN TO THE AUDIT <span aria-hidden className="ml-2">→</span>
        </button>
      </section>
    )
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-step-3 text-bordeaux">
      <p className="max-w-[58ch] text-sm leading-relaxed text-bordeaux/75 sm:text-base">{lpForm.lead}</p>

      <div className="grid grid-cols-3 divide-x divide-greige/50 border-y border-greige/50 py-step-2 text-center">
        {['30 min', 'No prep', 'No pitch'].map((item) => (
          <p key={item} className="px-step-1 font-mono text-[0.65rem] font-semibold tracking-[0.04em] text-bordeaux/75">{item}</p>
        ))}
      </div>

      <div className="grid gap-step-3 sm:grid-cols-2">
        <Field id="lp-name" label={lpForm.fields.name} error={errors.name}>
          <input id="lp-name" name="name" autoComplete="name" required maxLength={100} disabled={state === 'pending'} value={values.name} onChange={(event) => update('name', event.target.value)} aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? 'lp-name-error' : undefined} className={fieldClass} />
        </Field>
        <Field id="lp-email" label={lpForm.fields.email} error={errors.email}>
          <input id="lp-email" name="email" type="email" inputMode="email" autoComplete="email" required maxLength={254} disabled={state === 'pending'} value={values.email} onChange={(event) => update('email', event.target.value)} aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? 'lp-email-error' : undefined} className={fieldClass} />
        </Field>
      </div>
      <Field id="lp-app" label={lpForm.fields.app} error={errors.app}>
        <input id="lp-app" name="app" required maxLength={300} disabled={state === 'pending'} placeholder="yourapp.com or product name" value={values.app} onChange={(event) => update('app', event.target.value)} aria-invalid={Boolean(errors.app)} aria-describedby={errors.app ? 'lp-app-error' : undefined} className={fieldClass} />
      </Field>
      <Field id="lp-worry" label={lpForm.fields.worry} hint="Include the builder or stack if you know it · 1,000 characters maximum" error={errors.worry}>
        <textarea id="lp-worry" name="worry" rows={4} required maxLength={1_000} disabled={state === 'pending'} placeholder="For example: auth, payments, stability, AI cost, or taking over from another builder…" value={values.worry} onChange={(event) => update('worry', event.target.value)} aria-invalid={Boolean(errors.worry)} aria-describedby={errors.worry ? 'lp-worry-error' : 'lp-worry-hint'} className={`${fieldClass} min-h-28 resize-y`} />
      </Field>

      <div className="absolute left-[-10000px] top-auto size-px overflow-hidden" aria-hidden="true">
        <label htmlFor="lp-website">Website</label>
        <input id="lp-website" name="website" tabIndex={-1} autoComplete="off" value={website} onChange={(event) => setWebsite(event.target.value)} />
      </div>

      {Object.keys(errors).length ? (
        <p role="alert" className="border-l-2 border-cherry pl-step-2 text-sm">Complete the highlighted fields before sending.</p>
      ) : null}

      {submissionError ? (
        <div role="alert" className="rounded-xl border border-cherry/45 bg-oat/65 p-step-2 text-sm leading-relaxed">
          <p className="font-semibold">Your request was not sent.</p>
          <p className="mt-1 text-bordeaux/75">{submissionError}</p>
        </div>
      ) : null}

      <div className="flex flex-col gap-step-2 border-t border-greige/50 pt-step-3 sm:flex-row sm:items-center">
        <DotsMorphButton id="lp-inquiry-submit" label={state === 'error' ? 'Try sending again' : lpForm.submit} state={state === 'pending' ? 'pending' : 'idle'} />
        <p className="font-mono text-[0.65rem] leading-relaxed text-bordeaux/60">Your details go directly to Engisols. No repository access is requested.</p>
      </div>
    </form>
  )
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
  children: ReactNode
}) {
  return (
    <div>
      <label htmlFor={id} className="block font-mono text-xs font-semibold tracking-tight text-bordeaux/75">{label}</label>
      {children}
      {hint && !error ? <p id={`${id}-hint`} className="mt-1 text-xs text-bordeaux/55">{hint}</p> : null}
      {error ? <p id={`${id}-error`} className="mt-1 text-xs font-medium text-bordeaux" role="alert">{error}</p> : null}
    </div>
  )
}

const fieldClass = 'mt-step-1 min-h-11 w-full rounded-lg border border-greige/60 bg-vanilla px-step-2 py-step-1 text-base outline-none transition-colors placeholder:text-bordeaux/40 focus-visible:border-cherry focus-visible:ring-2 focus-visible:ring-cherry/20 disabled:opacity-60 aria-invalid:border-cherry'

interface InquiryResponse {
  ok: boolean
  error?: { message?: string }
}

async function readResponse(response: Response): Promise<InquiryResponse> {
  try {
    return await response.json() as InquiryResponse
  } catch {
    return { ok: false }
  }
}
