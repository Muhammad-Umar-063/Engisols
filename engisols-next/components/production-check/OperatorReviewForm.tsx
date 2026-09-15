'use client'

import { useState, type FormEvent } from 'react'

import {
  LAUNCH_BLOCKER_FIX_PRICE_USD,
  PRODUCTION_ENGINEERING_PRICE_USD,
  PRODUCTION_HARDEN_PRICE_USD,
} from '@/src/production-check/config'
import {
  isPaidScopeDecision,
  parseOptionalOfferAmount,
} from '@/src/production-check/operator-review'
import { trackProductionCheck } from '@/src/production-check/analytics'
import type { ScopeDecision, ScopeOfferBilling } from '@/src/production-check/types'

const decisions: Array<{ value: ScopeDecision; label: string }> = [
  { value: 'no_paid_work', label: 'No paid work' },
  { value: 'needs_information', label: 'Needs information' },
  { value: 'launch_blocker_fix', label: '$499 Launch Blocker Fix' },
  { value: 'production_harden', label: '$1,999 Production Harden' },
  { value: 'ongoing_engineering', label: 'Ongoing engineering' },
  { value: 'custom', label: 'Custom' },
]

export function OperatorReviewForm({
  scopeReviewId,
  initialDecision,
  initialSummary = '',
  initialInformation = '',
  initialInternalNotes = '',
}: {
  scopeReviewId: string
  initialDecision?: ScopeDecision
  initialSummary?: string
  initialInformation?: string
  initialInternalNotes?: string
}) {
  const [decision, setDecision] = useState<ScopeDecision>(initialDecision ?? 'no_paid_work')
  const [summary, setSummary] = useState(initialSummary)
  const [information, setInformation] = useState(initialInformation)
  const [title, setTitle] = useState('')
  const [included, setIncluded] = useState('')
  const [exclusions, setExclusions] = useState('')
  const [deliveryWindow, setDeliveryWindow] = useState('')
  const [amount, setAmount] = useState(defaultAmount(decision))
  const [billing, setBilling] = useState<ScopeOfferBilling>(defaultBilling(decision))
  const [internalNotes, setInternalNotes] = useState(initialInternalNotes)
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const paid = isPaidScopeDecision(decision)

  function changeDecision(next: ScopeDecision) {
    setDecision(next)
    setAmount(defaultAmount(next))
    setBilling(defaultBilling(next))
    setState('idle')
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setState('sending')
    setMessage('')
    const offerAmount = parseOptionalOfferAmount(amount)
    try {
      const response = await fetch(`/internal/production-check/review/${encodeURIComponent(scopeReviewId)}/decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision,
          recommendationSummary: summary,
          informationRequested: information,
          title,
          includedItems: lines(included),
          exclusions: lines(exclusions),
          deliveryWindow,
          ...(paid ? {
            ...(offerAmount !== undefined ? { amount: offerAmount } : {}),
            billing,
          } : {}),
          internalNotes,
        }),
      })
      const body = await response.json() as { ok?: boolean; status?: string; offerUrl?: string; notification?: string; error?: { message?: string } }
      if (!response.ok && response.status !== 202) throw new Error(body.error?.message ?? 'Decision could not be saved.')
      setState('sent')
      if (decision === 'needs_information') {
        trackProductionCheck('scope_more_info_requested', { scope_review_id: scopeReviewId })
      }
      setMessage(body.notification === 'delayed'
        ? 'Saved. Customer email is delayed; retry from this page.'
        : body.offerUrl
          ? `Offer sent: ${body.offerUrl}`
          : 'Decision saved and sent.')
    } catch (error) {
      setState('error')
      setMessage(error instanceof Error ? error.message : 'Decision could not be saved.')
    }
  }

  return (
    <form onSubmit={submit} className="mt-step-4 space-y-step-3 rounded-2xl border border-greige/55 bg-vanilla p-step-3 text-bordeaux sm:p-step-4">
      <div>
        <label className={labelClass} htmlFor="operator-decision">Outcome</label>
        <select id="operator-decision" value={decision} onChange={(event) => changeDecision(event.target.value as ScopeDecision)} className={fieldClass}>
          {decisions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      </div>
      <div>
        <label className={labelClass} htmlFor="operator-summary">Recommendation summary</label>
        <textarea id="operator-summary" required maxLength={2000} rows={5} value={summary} onChange={(event) => setSummary(event.target.value)} className={fieldClass} />
      </div>
      {decision === 'needs_information' ? (
        <div>
          <label className={labelClass} htmlFor="operator-information">Exact information needed</label>
          <textarea id="operator-information" required maxLength={2000} rows={4} value={information} onChange={(event) => setInformation(event.target.value)} className={fieldClass} />
          <p className="mt-1 text-xs text-bordeaux/60">Do not request passwords or credentials.</p>
        </div>
      ) : null}
      {paid ? (
        <fieldset className="space-y-step-3 border-t border-greige/60 pt-step-3">
          <legend className="font-display text-xl">Scoped offer</legend>
          <div><label className={labelClass} htmlFor="operator-title">Custom title (optional for packages)</label><input id="operator-title" maxLength={120} value={title} onChange={(event) => setTitle(event.target.value)} className={fieldClass} /></div>
          <div><label className={labelClass} htmlFor="operator-included">Specific included items · one per line</label><textarea id="operator-included" required rows={5} value={included} onChange={(event) => setIncluded(event.target.value)} className={fieldClass} /></div>
          <div><label className={labelClass} htmlFor="operator-exclusions">Specific exclusions · one per line</label><textarea id="operator-exclusions" rows={4} value={exclusions} onChange={(event) => setExclusions(event.target.value)} className={fieldClass} /></div>
          <div><label className={labelClass} htmlFor="operator-delivery">Delivery window</label><input id="operator-delivery" maxLength={160} value={deliveryWindow} onChange={(event) => setDeliveryWindow(event.target.value)} className={fieldClass} placeholder="2–3 business days" /></div>
          <div className="grid gap-step-2 sm:grid-cols-2">
            <div><label className={labelClass} htmlFor="operator-amount">Price in USD</label><input id="operator-amount" type="number" min={0} step={1} value={amount} onChange={(event) => setAmount(event.target.value)} className={fieldClass} /></div>
            <div><label className={labelClass} htmlFor="operator-billing">Billing</label><select id="operator-billing" value={billing} onChange={(event) => setBilling(event.target.value as ScopeOfferBilling)} className={fieldClass}><option value="one_time">One time</option><option value="monthly">Monthly</option><option value="custom">Custom</option></select></div>
          </div>
        </fieldset>
      ) : null}
      <div><label className={labelClass} htmlFor="operator-notes">Internal note (never customer-visible)</label><textarea id="operator-notes" maxLength={4000} rows={4} value={internalNotes} onChange={(event) => setInternalNotes(event.target.value)} className={fieldClass} /></div>
      {message ? <p role="status" className={`text-sm ${state === 'error' ? 'text-cherry' : 'text-bordeaux/70'}`}>{message}</p> : null}
      <button type="submit" disabled={state === 'sending'} className="min-h-12 rounded-full bg-cherry px-step-4 font-mono text-xs font-semibold text-vanilla disabled:opacity-60">{state === 'sending' ? 'SAVING…' : 'SAVE AND SEND DECISION'}</button>
    </form>
  )
}

function defaultAmount(decision: ScopeDecision): string {
  if (decision === 'launch_blocker_fix') return String(LAUNCH_BLOCKER_FIX_PRICE_USD)
  if (decision === 'production_harden') return String(PRODUCTION_HARDEN_PRICE_USD)
  if (decision === 'ongoing_engineering') return String(PRODUCTION_ENGINEERING_PRICE_USD)
  return ''
}
function defaultBilling(decision: ScopeDecision): ScopeOfferBilling {
  if (decision === 'ongoing_engineering') return 'monthly'
  if (decision === 'custom') return 'custom'
  return 'one_time'
}
function lines(value: string): string[] { return value.split('\n').map((line) => line.trim()).filter(Boolean) }
const labelClass = 'font-mono text-xs font-semibold tracking-[0.04em]'
const fieldClass = 'mt-step-1 min-h-12 w-full rounded-xl border border-bordeaux/30 bg-oat px-step-2 py-step-2 text-base outline-none focus-visible:ring-2 focus-visible:ring-cherry/25'
