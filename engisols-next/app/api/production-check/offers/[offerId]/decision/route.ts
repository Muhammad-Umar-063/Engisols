import { productionReportPath } from '../../../../../../src/production-check/paths'
import { readLimitedJson } from '../../../../../../src/production-check/request'
import { sendReviewEmail, type ReviewEmailSender } from '../../../../../../src/production-check/review-email'
import { isValidScopeOfferId } from '../../../../../../src/production-check/scope-review'
import {
  getLeadStore,
  getScopeOfferStore,
  getScopeReviewStore,
} from '../../../../../../src/production-check/store'
import type {
  LeadStore,
  ProductionScopeOffer,
  ScopeOfferStore,
  ScopeReviewStore,
} from '../../../../../../src/production-check/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type RouteContext = { params: Promise<{ offerId: string }> }

interface Dependencies {
  offers?: ScopeOfferStore
  reviews?: ScopeReviewStore
  leads?: LeadStore
  notify?: ReviewEmailSender
  now?: () => Date
}

export function createOfferDecisionPostHandler({
  offers,
  reviews,
  leads,
  notify = sendReviewEmail,
  now = () => new Date(),
}: Dependencies = {}) {
  return async function POST(request: Request, context: RouteContext): Promise<Response> {
    if (!isSameOrigin(request)) return jsonError(403, 'request_blocked', 'This request was blocked.')
    const { offerId } = await context.params
    if (!isValidScopeOfferId(offerId)) return jsonError(404, 'offer_not_found', 'This scope is unavailable.')
    let parsed: unknown
    try { parsed = await readLimitedJson(request) } catch { return jsonError(400, 'invalid_request', 'Choose approve or decline.') }
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed) || Object.keys(parsed).length !== 1) {
      return jsonError(400, 'invalid_request', 'Choose approve or decline.')
    }
    const action = (parsed as Record<string, unknown>).action
    if (action !== 'approve' && action !== 'decline') return jsonError(400, 'invalid_request', 'Choose approve or decline.')

    const offerStore = offers ?? getScopeOfferStore()
    const reviewStore = reviews ?? getScopeReviewStore()
    const leadStore = leads ?? getLeadStore()
    const existing = await offerStore.get(offerId).catch(() => null)
    if (!existing) return jsonError(404, 'offer_not_found', 'This scope is unavailable.')
    const desired = action === 'approve' ? 'accepted' : 'declined'
    if (existing.status === 'expired' || new Date(existing.expiresAt).getTime() <= now().getTime()) {
      await offerStore.transitionDecision(offerId, desired, now().toISOString()).catch(() => undefined)
      return jsonError(410, 'offer_expired', 'This scope has expired. Reply to the review email for an updated scope.')
    }
    if (existing.status === 'accepted' || existing.status === 'declined') {
      if (existing.status !== desired) return jsonError(409, 'decision_already_recorded', 'A different response was already recorded.')
      return reconcileCustomerDecision({
        request,
        decided: existing,
        decision: desired,
        offers: offerStore,
        reviews: reviewStore,
        leads: leadStore,
        notify,
        now,
      })
    }
    if (existing.status !== 'sent') return jsonError(409, 'offer_not_ready', 'This scope is not ready for approval.')

    const decidedAt = now()
    const decided = await offerStore.transitionDecision(offerId, desired, decidedAt.toISOString()).catch(() => null)
    if (!decided || decided.status !== desired) return jsonError(409, 'decision_failed', 'This response could not be recorded.')
    return reconcileCustomerDecision({
      request,
      decided,
      decision: desired,
      offers: offerStore,
      reviews: reviewStore,
      leads: leadStore,
      notify,
      now,
    })
  }
}

async function reconcileCustomerDecision({
  request, decided, decision, offers, reviews, leads, notify, now,
}: {
  request: Request
  decided: ProductionScopeOffer
  decision: 'accepted' | 'declined'
  offers: ScopeOfferStore
  reviews: ScopeReviewStore
  leads: LeadStore
  notify: ReviewEmailSender
  now: () => Date
}): Promise<Response> {
  const attemptedAt = now().toISOString()
  let reviewSynced = decided.decisionReviewSync?.status === 'synced'
  let notificationSent = decided.decisionNotification?.status === 'sent'

  if (!reviewSynced) {
    try {
      const review = await reviews.get(decided.scopeReviewId)
      if (!review) throw new Error('scope review unavailable')
      await reviews.save({
        ...review,
        status: decision,
        updatedAt: attemptedAt,
      })
      const recorded = await offers.recordDecisionReconciliation(
        decided.id,
        { reviewSync: 'synced' },
        attemptedAt,
      )
      reviewSynced = recorded?.decisionReviewSync?.status === 'synced'
    } catch {
      await offers.recordDecisionReconciliation(
        decided.id,
        { reviewSync: 'failed' },
        attemptedAt,
      ).catch(() => undefined)
    }
  }

  if (!notificationSent) {
    try {
      const lead = await leads.get(decided.leadId)
      if (!lead) throw new Error('lead unavailable')
      const reportUrl = new URL(productionReportPath(decided.scanId), request.url).toString()
      await notify({
        replyTo: lead.email,
        subject: `${decision === 'accepted' ? 'Scope approved' : 'Scope declined'} — ${decided.title}`,
        text: [
          `Scope ${decision}`, '',
          `Offer ID: ${decided.id}`,
          `Scope review ID: ${decided.scopeReviewId}`,
          `Customer: ${lead.name} <${lead.email}>`,
          `Offer: ${decided.title}`,
          `Report: ${reportUrl}`,
          '',
          decision === 'accepted'
            ? 'The customer approved the scope. Payment and onboarding have not started.'
            : 'The customer declined the scope.',
        ].join('\n'),
        idempotencyKey: `production-check/offer-decision/${decided.id}/${decision}`,
      })
      const recorded = await offers.recordDecisionReconciliation(
        decided.id,
        { notification: 'sent' },
        attemptedAt,
      )
      notificationSent = recorded?.decisionNotification?.status === 'sent'
    } catch {
      await offers.recordDecisionReconciliation(
        decided.id,
        { notification: 'failed' },
        attemptedAt,
      ).catch(() => undefined)
    }
  }

  return Response.json(
    {
      ok: true,
      status: decision,
      offerId: decided.id,
      ...(!reviewSynced || !notificationSent ? { reconciliation: 'delayed' } : {}),
    },
    { status: reviewSynced && notificationSent ? 200 : 202, headers: noStoreHeaders },
  )
}

function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get('origin')
  if (!origin) return false
  try { return new URL(origin).origin === new URL(request.url).origin } catch { return false }
}

const noStoreHeaders = { 'Cache-Control': 'no-store' }
function jsonError(status: number, code: string, message: string): Response {
  return Response.json({ ok: false, error: { code, message } }, { status, headers: noStoreHeaders })
}

export const POST = createOfferDecisionPostHandler()
