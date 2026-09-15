import assert from 'node:assert/strict'
import test from 'node:test'

import { formatProductionScopeOfferPrice } from '../../src/production-check/config'
import {
  approveScopeOffer,
  createProductionScopeOffer,
  createProductionScopeReview,
  createScopeOfferId,
  createScopeReviewId,
  declineScopeOffer,
} from '../../src/production-check/scope-review'
import {
  createOperatorToken,
  verifyOperatorToken,
} from '../../src/production-check/operator-token.server'
import { parseOptionalOfferAmount } from '../../src/production-check/operator-review'
import {
  MemoryScopeOfferStore,
  MemoryScopeReviewStore,
} from '../../src/production-check/store'
import type { ProductionCheckLead } from '../../src/production-check/types'

const now = new Date('2026-09-14T10:00:00.000Z')

function lead(): ProductionCheckLead {
  return {
    id: 'lead_abcdefghijklmnopqrstuvwx',
    scanId: 'rpt_abcdefghijklmnopqrstuvwx',
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    expiresAt: '2027-09-14T10:00:00.000Z',
    name: 'Ada Founder',
    email: 'ada@example.com',
    appUrl: 'https://app.example/',
    launchStage: 'taking_payments',
    helpNeeded: 'ongoing',
    timeline: 'now',
    attribution: {},
    score: 11,
    segment: 'qualified',
    status: 'new',
    scanSummary: { publicRisk: 0, fixNow: 0, review: 1, expected: 2, exposureBand: 'low' },
    notification: { status: 'sent', attemptedAt: now.toISOString() },
  }
}

test('creates one pending review per durable lead and scan', async () => {
  const store = new MemoryScopeReviewStore(() => now)
  const first = createProductionScopeReview({
    lead: lead(),
    concern: 'payments',
    accessWillingness: 'yes_after_review',
  }, () => now)
  const duplicate = createProductionScopeReview({
    lead: lead(),
    concern: 'payments',
    accessWillingness: 'yes_after_review',
  }, () => now)

  assert.equal(first.id, duplicate.id)
  assert.match(first.id, /^scope_[A-Za-z0-9_-]{24}$/)
  assert.equal(first.status, 'pending_review')
  assert.equal(first.concern, 'payments')
  assert.equal(first.accessWillingness, 'yes_after_review')
  assert.equal(first.leadId, lead().id)
  assert.equal(first.scanId, lead().scanId)
  assert.equal(first.expiresAt, '2027-09-14T10:00:00.000Z')

  const created = await Promise.all([store.createOrGet(first), store.createOrGet(duplicate)])
  assert.equal(created.filter((result) => result.created).length, 1)
  assert.equal(created[0]?.review.id, created[1]?.review.id)
})

test('derives stable non-sequential review ids and high-entropy offer ids', () => {
  assert.equal(createScopeReviewId(lead().id, lead().scanId), createScopeReviewId(lead().id, lead().scanId))
  assert.notEqual(createScopeReviewId(lead().id, lead().scanId), createScopeReviewId(`${lead().id}x`, lead().scanId))
  const offerIds = new Set(Array.from({ length: 50 }, createScopeOfferId))
  assert.equal(offerIds.size, 50)
  for (const id of offerIds) assert.match(id, /^offer_[A-Za-z0-9_-]{24}$/)
})

test('operator tokens are review-bound, tamper resistant, and expiring', () => {
  const secret = 'operator-secret-that-is-long-enough-for-tests'
  const reviewId = createScopeReviewId(lead().id, lead().scanId)
  const token = createOperatorToken(reviewId, secret, {
    now: () => now,
    lifetimeMs: 60_000,
  })
  assert.equal(verifyOperatorToken(token, reviewId, secret, () => now), true)
  assert.equal(verifyOperatorToken(token, `${reviewId}x`, secret, () => now), false)
  assert.equal(verifyOperatorToken(`${token.slice(0, -1)}x`, reviewId, secret, () => now), false)
  assert.equal(
    verifyOperatorToken(token, reviewId, secret, () => new Date(now.getTime() + 60_001)),
    false,
  )
})

test('creates server-owned fixed, monthly, and custom offers', () => {
  const review = createProductionScopeReview({
    lead: lead(),
    concern: 'payments',
    accessWillingness: 'not_yet',
  }, () => now)
  const shared = {
    review,
    summary: 'We validated a bounded implementation scope.',
    includedItems: ['Move the payment credential server-side'],
    exclusions: ['New product features'],
    deliveryWindow: '2–3 business days',
  }
  const launch = createProductionScopeOffer({ ...shared, type: 'launch_blocker_fix' }, () => now)
  const harden = createProductionScopeOffer({ ...shared, type: 'production_harden' }, () => now)
  const monthly = createProductionScopeOffer({ ...shared, type: 'ongoing_engineering' }, () => now)
  const custom = createProductionScopeOffer({
    ...shared,
    type: 'custom',
    title: 'Custom release support',
    amount: 2750,
    billing: 'custom',
  }, () => now)

  assert.deepEqual([launch.amount, launch.billing], [499, 'one_time'])
  assert.deepEqual([harden.amount, harden.billing], [1999, 'one_time'])
  assert.deepEqual([monthly.amount, monthly.billing], [2000, 'monthly'])
  assert.deepEqual([custom.amount, custom.billing], [2750, 'custom'])
  assert.equal(launch.status, 'draft')
  assert.match(launch.id, /^offer_[A-Za-z0-9_-]{24}$/)
})

test('blank custom prices remain unset while named packages retain server defaults', () => {
  const review = createProductionScopeReview({
    lead: lead(),
    concern: 'payments',
    accessWillingness: 'not_yet',
  }, () => now)
  const shared = {
    review,
    summary: 'We validated a bounded implementation scope.',
    includedItems: ['Move the payment credential server-side'],
    exclusions: ['New product features'],
  }
  const customAmount = parseOptionalOfferAmount('   ')
  const custom = createProductionScopeOffer({
    ...shared,
    type: 'custom',
    ...(customAmount !== undefined ? { amount: customAmount } : {}),
  }, () => now)
  const launch = createProductionScopeOffer({
    ...shared,
    type: 'launch_blocker_fix',
  }, () => now)

  assert.equal(custom.amount, undefined)
  assert.equal(parseOptionalOfferAmount('499'), 499)
  assert.equal(launch.amount, 499)
  assert.equal(formatProductionScopeOfferPrice(custom.amount, custom.billing), 'Custom')
  assert.equal(formatProductionScopeOfferPrice(launch.amount, launch.billing), '$499 fixed')
})

test('offer decisions are idempotent, reject expiry, and never create payment state', async () => {
  const review = createProductionScopeReview({
    lead: lead(),
    concern: 'reliability_bugs',
    accessWillingness: 'yes_after_review',
  }, () => now)
  const offer = createProductionScopeOffer({
    review,
    type: 'launch_blocker_fix',
    summary: 'A small set of blockers was verified.',
    includedItems: ['Correct the admin authorization path'],
    exclusions: ['Architecture redesign'],
    deliveryWindow: '2–3 business days',
  }, () => now)
  const sent = { ...offer, status: 'sent' as const, sentAt: now.toISOString() }
  const store = new MemoryScopeOfferStore(() => now)
  await store.claimForReview(sent)

  const accepted = approveScopeOffer(sent, now)
  assert.ok(accepted)
  assert.equal(accepted.status, 'accepted')
  assert.equal(approveScopeOffer(accepted, now), accepted)
  assert.doesNotMatch(JSON.stringify(accepted), /paid|payment|checkout/i)
  assert.equal((await store.transitionDecision(sent.id, 'accepted', now.toISOString()))?.status, 'accepted')
  assert.equal((await store.transitionDecision(sent.id, 'accepted', now.toISOString()))?.status, 'accepted')
  assert.equal((await store.transitionDecision(sent.id, 'declined', now.toISOString()))?.status, 'accepted')
  assert.equal(declineScopeOffer({ ...sent, expiresAt: '2026-09-14T09:59:59.000Z' }, now), null)
})

test('offer notification failures cannot downgrade a sent offer', async () => {
  const review = createProductionScopeReview({
    lead: lead(),
    concern: 'launch_readiness',
    accessWillingness: 'yes_after_review',
  }, () => now)
  const offer = createProductionScopeOffer({
    review,
    type: 'launch_blocker_fix',
    summary: 'A bounded blocker fix.',
    includedItems: ['Correct production authorization'],
    exclusions: [],
  }, () => now)
  const store = new MemoryScopeOfferStore(() => now)
  await store.claimForReview(offer)
  assert.equal((await store.markSent(offer.id, now.toISOString()))?.status, 'sent')
  const afterLateFailure = await store.markSendFailed(offer.id, now.toISOString())
  assert.equal(afterLateFailure?.status, 'sent')
  assert.equal(afterLateFailure?.notification.status, 'sent')
})
