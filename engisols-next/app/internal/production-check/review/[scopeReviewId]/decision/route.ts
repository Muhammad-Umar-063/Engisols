import { authorizeOperatorRequest } from '../../../../../../src/production-check/operator-session.server'
import {
  isPaidScopeDecision,
  needsInformationEmailText,
  noPaidWorkEmailText,
  parseOperatorDecisionSubmission,
  scopeOfferEmailText,
} from '../../../../../../src/production-check/operator-review'
import { productionOfferPath } from '../../../../../../src/production-check/paths'
import { readLimitedJson } from '../../../../../../src/production-check/request'
import { sendCustomerScopeEmail, type CustomerScopeEmailSender } from '../../../../../../src/production-check/scope-email'
import {
  createProductionScopeOffer,
  isValidScopeReviewId,
} from '../../../../../../src/production-check/scope-review'
import {
  getLeadStore,
  getScopeOfferStore,
  getScopeReviewStore,
} from '../../../../../../src/production-check/store'
import type {
  LeadStore,
  ProductionScopeOffer,
  ProductionScopeReview,
  ScopeOfferStore,
  ScopeReviewStore,
} from '../../../../../../src/production-check/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type RouteContext = { params: Promise<{ scopeReviewId: string }> }

interface Dependencies {
  reviews?: ScopeReviewStore
  offers?: ScopeOfferStore
  leads?: LeadStore
  authorize?: (request: Request, scopeReviewId: string) => boolean
  sendCustomer?: CustomerScopeEmailSender
  now?: () => Date
  createOfferId?: () => string
}

export function createOperatorDecisionPostHandler({
  reviews,
  offers,
  leads,
  authorize = authorizeOperatorRequest,
  sendCustomer = sendCustomerScopeEmail,
  now = () => new Date(),
  createOfferId,
}: Dependencies = {}) {
  return async function POST(request: Request, context: RouteContext): Promise<Response> {
    const { scopeReviewId } = await context.params
    if (!isValidScopeReviewId(scopeReviewId) || !authorize(request, scopeReviewId)) {
      return jsonError(403, 'operator_access_denied', 'Operator access is invalid or expired.')
    }
    if (!isSameOrigin(request)) return jsonError(403, 'request_blocked', 'This request was blocked.')

    let parsed: unknown
    try { parsed = await readLimitedJson(request) } catch { return jsonError(400, 'invalid_request', 'Check the review form.') }
    const submission = parseOperatorDecisionSubmission(parsed)
    if (!submission) return jsonError(400, 'invalid_request', 'Check the review form.')

    const reviewStore = reviews ?? getScopeReviewStore()
    const offerStore = offers ?? getScopeOfferStore()
    const leadStore = leads ?? getLeadStore()
    const review = await reviewStore.get(scopeReviewId).catch(() => null)
    if (!review) return jsonError(404, 'review_not_found', 'This scope review is unavailable.')
    const lead = await leadStore.get(review.leadId).catch(() => null)
    if (!lead) return jsonError(404, 'lead_not_found', 'The associated lead is unavailable.')

    if (isPaidScopeDecision(submission.decision)) {
      return preparePaidOffer({ request, review, lead, submission, reviews: reviewStore, offers: offerStore, sendCustomer, now, createOfferId })
    }

    const reviewedAt = now()
    const updated: ProductionScopeReview = {
      ...review,
      status: submission.decision,
      decision: submission.decision,
      recommendationSummary: submission.recommendationSummary,
      ...(submission.decision === 'needs_information'
        ? { informationRequested: submission.informationRequested }
        : { informationRequested: undefined }),
      ...(submission.internalNotes ? { internalNotes: submission.internalNotes } : {}),
      reviewedAt: reviewedAt.toISOString(),
      updatedAt: reviewedAt.toISOString(),
      decisionNotification: { status: 'pending' },
    }
    await reviewStore.save(updated)
    const message = submission.decision === 'no_paid_work'
      ? noPaidWorkEmailText(updated, submission.recommendationSummary)
      : needsInformationEmailText(updated, submission.recommendationSummary, submission.informationRequested)
    try {
      await sendCustomer({
        to: lead.email,
        subject: submission.decision === 'no_paid_work'
          ? 'Your Production Check engineer review'
          : 'More information needed for your Production Check',
        text: message,
        idempotencyKey: `production-check/decision/${review.id}/${submission.decision}`,
      })
      await reviewStore.save({
        ...updated,
        decisionNotification: { status: 'sent', attemptedAt: now().toISOString() },
      })
      return Response.json({ ok: true, status: submission.decision }, { headers: noStoreHeaders })
    } catch {
      await reviewStore.save({
        ...updated,
        decisionNotification: { status: 'failed', attemptedAt: now().toISOString() },
      }).catch(() => undefined)
      return Response.json({ ok: true, status: submission.decision, notification: 'delayed' }, { status: 202, headers: noStoreHeaders })
    }
  }
}

async function preparePaidOffer({
  request, review, lead, submission, reviews, offers, sendCustomer, now, createOfferId,
}: {
  request: Request
  review: ProductionScopeReview
  lead: Awaited<ReturnType<LeadStore['get']>> & {}
  submission: NonNullable<ReturnType<typeof parseOperatorDecisionSubmission>>
  reviews: ScopeReviewStore
  offers: ScopeOfferStore
  sendCustomer: CustomerScopeEmailSender
  now: () => Date
  createOfferId?: () => string
}): Promise<Response> {
  const linkedOffer = review.offerId ? await offers.get(review.offerId) : null
  let proposedOffer: ProductionScopeOffer
  try {
    proposedOffer = createProductionScopeOffer({
      review,
      type: submission.decision as ProductionScopeOffer['type'],
      ...(submission.title ? { title: submission.title } : {}),
      summary: submission.recommendationSummary,
      includedItems: submission.includedItems,
      exclusions: submission.exclusions,
      ...(submission.amount !== undefined ? { amount: submission.amount } : {}),
      ...(submission.billing ? { billing: submission.billing } : {}),
      deliveryWindow: submission.deliveryWindow,
      createId: linkedOffer ? () => linkedOffer.id : createOfferId,
    }, now)
  } catch {
    return jsonError(400, 'invalid_offer', 'Check the offer fields.')
  }
  const claimed = await offers.claimForReview(linkedOffer ?? proposedOffer)
  const offer = claimed.offer
  if (!matchesCommercialScope(offer, proposedOffer)) {
    if (offer.status !== 'draft') {
      return jsonError(409, 'offer_immutable', 'This scoped offer was already sent and cannot be changed.')
    }
    return jsonError(409, 'offer_already_claimed', 'This review already has a different scoped offer. Reload the review before continuing.')
  }
  if (offer.status === 'accepted' || offer.status === 'declined' || offer.status === 'expired') {
    return jsonError(409, 'offer_immutable', 'This scoped offer is no longer editable.')
  }
  const preparedAt = now()
  const preparedReview: ProductionScopeReview = {
    ...review,
    decision: offer.type,
    status: offer.status === 'sent' ? 'offer_sent' : 'offer_prepared',
    recommendationSummary: offer.summary,
    ...(submission.internalNotes ? { internalNotes: submission.internalNotes } : {}),
    offerId: offer.id,
    reviewedAt: review.reviewedAt ?? preparedAt.toISOString(),
    updatedAt: preparedAt.toISOString(),
  }
  await reviews.save(preparedReview)
  const offerUrl = new URL(productionOfferPath(offer.id), request.url).toString()
  if (offer.status === 'sent') {
    return Response.json({ ok: true, status: 'offer_sent', offerId: offer.id, offerUrl }, { headers: noStoreHeaders })
  }
  try {
    await sendCustomer({
      to: lead.email,
      subject: `Your Engisols scope — ${offer.title}`,
      text: scopeOfferEmailText(offer, offerUrl),
      idempotencyKey: `production-check/offer/${offer.id}`,
    })
  } catch {
    await offers.markSendFailed(offer.id, now().toISOString()).catch(() => undefined)
    return Response.json({ ok: true, status: 'offer_prepared', offerId: offer.id, offerUrl, notification: 'delayed' }, { status: 202, headers: noStoreHeaders })
  }
  const sentAt = now()
  let sentOffer: ProductionScopeOffer | null = null
  try {
    sentOffer = await offers.markSent(offer.id, sentAt.toISOString())
  } catch {
    sentOffer = await offers.markSendFailed(offer.id, sentAt.toISOString()).catch(() => null)
  }
  if (sentOffer?.status !== 'sent') {
    return Response.json({ ok: true, status: 'offer_prepared', offerId: offer.id, offerUrl, notification: 'delayed' }, { status: 202, headers: noStoreHeaders })
  }
  try {
    await reviews.save({ ...preparedReview, status: 'offer_sent', updatedAt: sentAt.toISOString() })
  } catch {
    return Response.json({ ok: true, status: 'offer_sent', offerId: offer.id, offerUrl, reconciliation: 'delayed' }, { status: 202, headers: noStoreHeaders })
  }
  return Response.json({ ok: true, status: 'offer_sent', offerId: offer.id, offerUrl }, { headers: noStoreHeaders })
}

function matchesCommercialScope(existing: ProductionScopeOffer, proposed: ProductionScopeOffer): boolean {
  return existing.scopeReviewId === proposed.scopeReviewId
    && existing.leadId === proposed.leadId
    && existing.scanId === proposed.scanId
    && existing.type === proposed.type
    && existing.title === proposed.title
    && existing.summary === proposed.summary
    && existing.amount === proposed.amount
    && existing.currency === proposed.currency
    && existing.billing === proposed.billing
    && existing.deliveryWindow === proposed.deliveryWindow
    && JSON.stringify(existing.includedItems) === JSON.stringify(proposed.includedItems)
    && JSON.stringify(existing.exclusions) === JSON.stringify(proposed.exclusions)
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

export const POST = createOperatorDecisionPostHandler()
