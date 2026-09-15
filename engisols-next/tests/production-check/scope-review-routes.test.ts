import assert from 'node:assert/strict'
import test from 'node:test'

import { createOfferDecisionPostHandler } from '../../app/api/production-check/offers/[offerId]/decision/route'
import { createOperatorAccessGetHandler } from '../../app/internal/production-check/review/[scopeReviewId]/access/route'
import { createOperatorDecisionPostHandler } from '../../app/internal/production-check/review/[scopeReviewId]/decision/route'
import type { ReviewEmailMessage } from '../../src/production-check/review-email'
import { createProductionScopeOffer, createProductionScopeReview } from '../../src/production-check/scope-review'
import { createOperatorToken } from '../../src/production-check/operator-token.server'
import {
  MemoryLeadStore,
  MemoryScopeOfferStore,
  MemoryScopeReviewStore,
} from '../../src/production-check/store'
import type {
  ProductionCheckLead,
  ProductionScopeReview,
  ScopeReviewStore,
} from '../../src/production-check/types'

const now = new Date('2026-09-14T10:00:00.000Z')

function lead(): ProductionCheckLead {
  return {
    id: 'lead_abcdefghijklmnopqrstuvwx',
    scanId: 'rpt_abcdefghijklmnopqrstuvwx',
    createdAt: now.toISOString(), updatedAt: now.toISOString(), expiresAt: '2027-09-14T10:00:00.000Z',
    name: 'Ada Founder', email: 'ada@example.com', appUrl: 'https://app.example/',
    builder: 'lovable', launchStage: 'taking_payments', helpNeeded: 'ongoing', timeline: 'now',
    attribution: {}, score: 11, segment: 'qualified', status: 'new',
    scanSummary: { publicRisk: 12, fixNow: 1, review: 2, expected: 3, exposureBand: 'medium' },
    notification: { status: 'sent', attemptedAt: now.toISOString() },
  }
}

async function fixture() {
  const leads = new MemoryLeadStore(() => now)
  const reviews = new MemoryScopeReviewStore(() => now)
  const offers = new MemoryScopeOfferStore(() => now)
  const review = createProductionScopeReview({
    lead: lead(), concern: 'payments', accessWillingness: 'yes_after_review',
  }, () => now)
  await leads.save(lead())
  await reviews.createOrGet(review)
  return { leads, reviews, offers, review }
}

function operatorRequest(review: ProductionScopeReview, body: unknown) {
  return new Request(`https://engisols.com/internal/production-check/review/${review.id}/decision`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: 'https://engisols.com' },
    body: JSON.stringify(body),
  })
}

function paidDecision(overrides: Record<string, unknown> = {}) {
  return {
    decision: 'launch_blocker_fix',
    recommendationSummary: 'Validated scope.',
    includedItems: ['Move one credential server-side'],
    exclusions: ['New product features'],
    deliveryWindow: '2 business days',
    amount: 499,
    billing: 'one_time',
    title: '',
    internalNotes: '',
    ...overrides,
  }
}

test('operator can send no-paid-work and needs-information outcomes without an offer', async () => {
  for (const body of [
    { decision: 'no_paid_work', recommendationSummary: 'Nothing currently justifies paid engineering. Monitor auth logs and re-scan after launch.', internalNotes: '' },
    { decision: 'needs_information', recommendationSummary: 'The public result is inconclusive.', informationRequested: 'Please send screenshots of the relevant RLS policies.', internalNotes: '' },
  ] as const) {
    const state = await fixture()
    const customerMessages: Array<{ to: string; text: string }> = []
    const handler = createOperatorDecisionPostHandler({
      reviews: state.reviews, offers: state.offers, leads: state.leads,
      authorize: () => true, now: () => now,
      sendCustomer: async (message) => { customerMessages.push(message) },
    })
    const response = await handler(operatorRequest(state.review, body), { params: Promise.resolve({ scopeReviewId: state.review.id }) })
    assert.equal(response.status, 200)
    const saved = await state.reviews.get(state.review.id)
    assert.equal(saved?.decision, body.decision)
    assert.equal(saved?.status, body.decision)
    assert.equal(saved?.offerId, undefined)
    assert.equal(customerMessages[0]?.to, lead().email)
    assert.match(customerMessages[0]?.text ?? '', body.decision === 'no_paid_work' ? /Nothing currently justifies/ : /RLS policies/)
  }
})

test('operator prepares the three known packages and a custom offer with editable server-validated prices', async () => {
  const cases = [
    ['launch_blocker_fix', 499, 'one_time'],
    ['production_harden', 1999, 'one_time'],
    ['ongoing_engineering', 2000, 'monthly'],
    ['custom', 2750, 'custom'],
  ] as const
  for (const [decision, defaultAmount, billing] of cases) {
    const state = await fixture()
    const handler = createOperatorDecisionPostHandler({
      reviews: state.reviews, offers: state.offers, leads: state.leads,
      authorize: () => true, now: () => now, createOfferId: () => `offer_${decision.padEnd(24, 'x').slice(0, 24)}`,
      sendCustomer: async () => undefined,
    })
    const amount = decision === 'custom' ? 2750 : defaultAmount
    const response = await handler(operatorRequest(state.review, {
      decision,
      title: decision === 'custom' ? 'Custom release support' : '',
      recommendationSummary: 'This is the smallest validated scope.',
      includedItems: ['Correct the authorization path'],
      exclusions: ['New product features'],
      deliveryWindow: '2–3 business days',
      amount,
      billing,
      internalNotes: 'Private operator note',
    }), { params: Promise.resolve({ scopeReviewId: state.review.id }) })
    assert.equal(response.status, 200)
    const body = await response.json() as { offerId: string; offerUrl: string }
    const offer = await state.offers.get(body.offerId)
    assert.equal(offer?.status, 'sent')
    assert.equal(offer?.amount, amount)
    assert.equal(offer?.billing, billing)
    assert.doesNotMatch(JSON.stringify(offer), /Private operator note/)
    assert.match(body.offerUrl, /\/production-check\/offer\/offer_/)
  }
})

test('a Resend failure preserves a prepared offer and review for retry', async () => {
  const state = await fixture()
  const handler = createOperatorDecisionPostHandler({
    reviews: state.reviews, offers: state.offers, leads: state.leads,
    authorize: () => true, now: () => now,
    sendCustomer: async () => { throw new Error('resend unavailable') },
  })
  const response = await handler(operatorRequest(state.review, paidDecision({ exclusions: [] })), { params: Promise.resolve({ scopeReviewId: state.review.id }) })
  assert.equal(response.status, 202)
  const savedReview = await state.reviews.get(state.review.id)
  assert.equal(savedReview?.status, 'offer_prepared')
  assert.ok(savedReview?.offerId)
  assert.equal((await state.offers.get(savedReview.offerId))?.status, 'draft')
})

test('concurrent operator submissions claim one offer per scope review', async () => {
  const state = await fixture()
  let nextId = 0
  const customerMessages: Array<{ text: string }> = []
  const handler = createOperatorDecisionPostHandler({
    reviews: state.reviews,
    offers: state.offers,
    leads: state.leads,
    authorize: () => true,
    now: () => now,
    createOfferId: () => `offer_concurrent${String(++nextId).padStart(14, 'x')}`,
    sendCustomer: async (message) => { customerMessages.push(message) },
  })
  const context = { params: Promise.resolve({ scopeReviewId: state.review.id }) }
  const responses = await Promise.all([
    handler(operatorRequest(state.review, paidDecision()), context),
    handler(operatorRequest(state.review, paidDecision()), context),
  ])
  const bodies = await Promise.all(responses.map((response) => response.json() as Promise<{ offerId: string; offerUrl: string }>))

  assert.equal(new Set(bodies.map((body) => body.offerId)).size, 1)
  assert.equal(new Set(bodies.map((body) => body.offerUrl)).size, 1)
  assert.equal(new Set(customerMessages.map((message) => message.text.match(/\/production-check\/offer\/(offer_[A-Za-z0-9_-]+)/)?.[1])).size, 1)
  assert.equal((await state.reviews.get(state.review.id))?.offerId, bodies[0]?.offerId)
})

test('a sent offer is immutable and rejects changed operator resubmissions', async () => {
  const state = await fixture()
  let customerMessages = 0
  const handler = createOperatorDecisionPostHandler({
    reviews: state.reviews,
    offers: state.offers,
    leads: state.leads,
    authorize: () => true,
    now: () => now,
    sendCustomer: async () => { customerMessages += 1 },
  })
  const context = { params: Promise.resolve({ scopeReviewId: state.review.id }) }
  assert.equal((await handler(operatorRequest(state.review, paidDecision()), context)).status, 200)
  const changed = await handler(operatorRequest(state.review, paidDecision({ amount: 799 })), context)

  assert.equal(changed.status, 409)
  assert.equal((await changed.json() as { error: { code: string } }).error.code, 'offer_immutable')
  const offerId = (await state.reviews.get(state.review.id))?.offerId
  assert.ok(offerId)
  assert.equal((await state.offers.get(offerId))?.amount, 499)
  assert.equal(customerMessages, 1)
})

test('a review save failure after offer delivery never rolls the sent offer back', async () => {
  const state = await fixture()
  let failSentReviewSave = true
  const reviews: ScopeReviewStore = {
    createOrGet: (review) => state.reviews.createOrGet(review),
    get: (id) => state.reviews.get(id),
    save: async (review) => {
      if (failSentReviewSave && review.status === 'offer_sent') throw new Error('review persistence unavailable')
      await state.reviews.save(review)
    },
  }
  let customerMessages = 0
  const handler = createOperatorDecisionPostHandler({
    reviews,
    offers: state.offers,
    leads: state.leads,
    authorize: () => true,
    now: () => now,
    sendCustomer: async () => { customerMessages += 1 },
  })
  const context = { params: Promise.resolve({ scopeReviewId: state.review.id }) }
  const first = await handler(operatorRequest(state.review, paidDecision()), context)
  const firstBody = await first.json() as { offerId: string; status: string; reconciliation?: string }

  assert.equal(first.status, 202)
  assert.equal(firstBody.status, 'offer_sent')
  assert.equal(firstBody.reconciliation, 'delayed')
  assert.equal((await state.offers.get(firstBody.offerId))?.status, 'sent')
  assert.equal((await state.reviews.get(state.review.id))?.status, 'offer_prepared')

  failSentReviewSave = false
  const retry = await handler(operatorRequest(state.review, paidDecision()), context)
  assert.equal(retry.status, 200)
  assert.equal((await state.offers.get(firstBody.offerId))?.status, 'sent')
  assert.equal((await state.reviews.get(state.review.id))?.status, 'offer_sent')
  assert.equal(customerMessages, 1)
})

test('operator endpoint rejects unauthorized and cross-origin decisions', async () => {
  const state = await fixture()
  const denied = createOperatorDecisionPostHandler({
    reviews: state.reviews, offers: state.offers, leads: state.leads,
    authorize: () => false, sendCustomer: async () => undefined,
  })
  assert.equal((await denied(operatorRequest(state.review, { decision: 'no_paid_work' }), { params: Promise.resolve({ scopeReviewId: state.review.id }) })).status, 403)
  const crossOrigin = operatorRequest(state.review, { decision: 'no_paid_work' })
  crossOrigin.headers.set('Origin', 'https://attacker.example')
  const allowed = createOperatorDecisionPostHandler({
    reviews: state.reviews, offers: state.offers, leads: state.leads,
    authorize: () => true, sendCustomer: async () => undefined,
  })
  assert.equal((await allowed(crossOrigin, { params: Promise.resolve({ scopeReviewId: state.review.id }) })).status, 403)
})

test('signed access exchanges the URL token for an HttpOnly cookie and removes it from the redirect', async () => {
  const state = await fixture()
  const secret = 'operator-secret-that-is-long-enough-for-tests'
  const token = createOperatorToken(state.review.id, secret, { now: () => now })
  const handler = createOperatorAccessGetHandler({ reviews: state.reviews, secret, now: () => now })
  const context = { params: Promise.resolve({ scopeReviewId: state.review.id }) }
  const response = await handler(new Request(`https://engisols.com/internal/production-check/review/${state.review.id}/access?token=${token}`), context)
  assert.equal(response.status, 303)
  assert.equal(response.headers.get('location'), `https://engisols.com/internal/production-check/review/${state.review.id}`)
  assert.doesNotMatch(response.headers.get('location') ?? '', /token=/)
  const cookie = response.headers.get('set-cookie') ?? ''
  assert.match(cookie, /HttpOnly/i)
  assert.match(cookie, /SameSite=strict/i)
  assert.match(cookie, /Secure/i)
  assert.equal(response.headers.get('referrer-policy'), 'no-referrer')

  const tampered = await handler(new Request(`https://engisols.com/internal/production-check/review/${state.review.id}/access?token=${token}x`), context)
  assert.equal(tampered.status, 403)
})

test('customer approval is idempotent, ignores browser price fields, and never marks payment', async () => {
  const state = await fixture()
  const draft = createProductionScopeOffer({
    review: state.review, type: 'launch_blocker_fix', summary: 'Validated scope.',
    includedItems: ['Correct auth'], exclusions: [], createId: () => 'offer_abcdefghijklmnopqrstuvwx',
  }, () => now)
  await state.offers.claimForReview({ ...draft, status: 'sent', sentAt: now.toISOString() })
  const messages: ReviewEmailMessage[] = []
  const handler = createOfferDecisionPostHandler({
    offers: state.offers, reviews: state.reviews, leads: state.leads, now: () => now,
    notify: async (message) => { messages.push(message) },
  })
  const url = `https://engisols.com/api/production-check/offers/${draft.id}/decision`
  const invalid = await handler(new Request(url, { method: 'POST', headers: { Origin: 'https://engisols.com', 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'approve', amount: 1 }) }), { params: Promise.resolve({ offerId: draft.id }) })
  assert.equal(invalid.status, 400)
  const approve = () => handler(new Request(url, { method: 'POST', headers: { Origin: 'https://engisols.com', 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'approve' }) }), { params: Promise.resolve({ offerId: draft.id }) })
  assert.equal((await approve()).status, 200)
  assert.equal((await approve()).status, 200)
  const accepted = await state.offers.get(draft.id)
  assert.equal(accepted?.status, 'accepted')
  assert.equal(accepted?.amount, 499)
  assert.doesNotMatch(JSON.stringify(accepted), /paid|payment|checkout/i)
  assert.equal(messages.length, 1)
})

test('customer decision retries reconcile failed review sync and operator notification', async () => {
  const state = await fixture()
  const draft = createProductionScopeOffer({
    review: state.review,
    type: 'launch_blocker_fix',
    summary: 'Validated scope.',
    includedItems: ['Correct auth'],
    exclusions: [],
    createId: () => 'offer_retryreconciliationxxxxx',
  }, () => now)
  await state.offers.claimForReview({ ...draft, status: 'sent', sentAt: now.toISOString() })
  let downstreamAvailable = false
  const reviews: ScopeReviewStore = {
    createOrGet: (review) => state.reviews.createOrGet(review),
    get: (id) => state.reviews.get(id),
    save: async (review) => {
      if (!downstreamAvailable && review.status === 'accepted') throw new Error('review unavailable')
      await state.reviews.save(review)
    },
  }
  let notifyAttempts = 0
  const handler = createOfferDecisionPostHandler({
    offers: state.offers,
    reviews,
    leads: state.leads,
    now: () => now,
    notify: async () => {
      notifyAttempts += 1
      if (!downstreamAvailable) throw new Error('email unavailable')
    },
  })
  const url = `https://engisols.com/api/production-check/offers/${draft.id}/decision`
  const approve = () => handler(new Request(url, {
    method: 'POST',
    headers: { Origin: 'https://engisols.com', 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'approve' }),
  }), { params: Promise.resolve({ offerId: draft.id }) })

  const first = await approve()
  assert.equal(first.status, 202)
  assert.equal((await first.json() as { reconciliation?: string }).reconciliation, 'delayed')
  const failed = await state.offers.get(draft.id)
  assert.equal(failed?.status, 'accepted')
  assert.equal(failed?.decisionReviewSync?.status, 'failed')
  assert.equal(failed?.decisionNotification?.status, 'failed')
  assert.equal((await state.reviews.get(state.review.id))?.status, 'pending_review')

  downstreamAvailable = true
  const retry = await approve()
  assert.equal(retry.status, 200)
  const reconciled = await state.offers.get(draft.id)
  assert.equal(reconciled?.decisionReviewSync?.status, 'synced')
  assert.equal(reconciled?.decisionNotification?.status, 'sent')
  assert.equal((await state.reviews.get(state.review.id))?.status, 'accepted')
  assert.equal(notifyAttempts, 2)
})

test('expired offers cannot be approved', async () => {
  const state = await fixture()
  const offer = createProductionScopeOffer({
    review: state.review, type: 'production_harden', summary: 'Validated scope.', includedItems: ['Harden production'], exclusions: [],
  }, () => new Date('2026-08-01T10:00:00.000Z'))
  await state.offers.claimForReview({ ...offer, status: 'sent', sentAt: '2026-08-01T10:00:00.000Z' })
  const handler = createOfferDecisionPostHandler({ offers: state.offers, reviews: state.reviews, leads: state.leads, now: () => now, notify: async () => undefined })
  const response = await handler(new Request(`https://engisols.com/api/production-check/offers/${offer.id}/decision`, { method: 'POST', headers: { Origin: 'https://engisols.com', 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'approve' }) }), { params: Promise.resolve({ offerId: offer.id }) })
  assert.equal(response.status, 410)
  assert.equal((await state.offers.get(offer.id))?.status, 'expired')
})
