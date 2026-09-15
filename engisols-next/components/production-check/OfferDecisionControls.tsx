'use client'

import { useEffect, useState } from 'react'

import { trackProductionCheck } from '@/src/production-check/analytics'
import { productionOfferDecisionPath } from '@/src/production-check/paths'
import type { ScopeOfferStatus, ScopeOfferType } from '@/src/production-check/types'

export function OfferDecisionControls({
  offerId,
  scopeReviewId,
  offerType,
  amount,
  currency,
  initialStatus,
}: {
  offerId: string
  scopeReviewId: string
  offerType: ScopeOfferType
  amount?: number
  currency: 'USD'
  initialStatus: ScopeOfferStatus
}) {
  const [status, setStatus] = useState(initialStatus)
  const [pending, setPending] = useState<'approve' | 'decline' | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    trackProductionCheck('scope_offer_viewed', {
      scope_review_id: scopeReviewId,
      offer_type: offerType,
      ...(amount !== undefined ? { offer_amount: amount } : {}),
      currency,
    })
  }, [amount, currency, offerId, offerType, scopeReviewId])

  async function decide(action: 'approve' | 'decline') {
    setPending(action)
    setError('')
    try {
      const response = await fetch(productionOfferDecisionPath(offerId), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      const body = await response.json() as { ok?: boolean; status?: ScopeOfferStatus; error?: { message?: string } }
      if (!response.ok || !body.ok || !body.status) throw new Error(body.error?.message ?? 'Your response could not be saved.')
      setStatus(body.status)
      trackProductionCheck(action === 'approve' ? 'scope_offer_approved' : 'scope_offer_declined', {
        scope_review_id: scopeReviewId,
        offer_type: offerType,
        ...(amount !== undefined ? { offer_amount: amount } : {}),
        currency,
      })
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Your response could not be saved.')
    } finally {
      setPending(null)
    }
  }

  if (status === 'accepted') {
    return <div role="status" className="rounded-xl border border-cherry/30 bg-oat p-step-3"><p className="font-display text-xl">Scope approved</p><p className="mt-step-1 text-sm leading-relaxed text-bordeaux/70">No payment has been taken. Engisols will email payment and onboarding instructions separately.</p></div>
  }
  if (status === 'declined') {
    return <div role="status" className="rounded-xl border border-greige/60 bg-oat p-step-3"><p className="font-display text-xl">Scope declined</p><p className="mt-step-1 text-sm leading-relaxed text-bordeaux/70">Your response is saved. No work or payment has started.</p></div>
  }
  if (status === 'expired') return <p className="text-sm text-bordeaux/70">This scope has expired. Reply to your review email for an updated recommendation.</p>

  return (
    <div>
      <div className="flex flex-col gap-step-2 sm:flex-row sm:items-center">
        <button type="button" disabled={Boolean(pending)} onClick={() => decide('approve')} className="min-h-12 rounded-full bg-cherry px-step-4 font-mono text-xs font-semibold text-vanilla disabled:opacity-60">{pending === 'approve' ? 'APPROVING…' : 'APPROVE THIS SCOPE'}</button>
        <button type="button" disabled={Boolean(pending)} onClick={() => decide('decline')} className="min-h-12 rounded-full border border-bordeaux/35 px-step-4 font-mono text-xs text-bordeaux disabled:opacity-60">{pending === 'decline' ? 'SAVING…' : 'DECLINE THIS SCOPE'}</button>
      </div>
      <p className="mt-step-2 text-xs leading-relaxed text-bordeaux/60">Approval confirms the agreed scope only. It does not start checkout or mark anything paid.</p>
      {error ? <p role="alert" className="mt-step-2 text-sm text-cherry">{error}</p> : null}
    </div>
  )
}
