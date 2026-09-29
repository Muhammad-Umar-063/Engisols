import assert from 'node:assert/strict'
import test from 'node:test'

import { createGrowthOutcomeEventFactory } from '../../src/growth/outcome-events'
import { MemoryGrowthOutboxStore, UpstashGrowthOutboxStore } from '../../src/growth/outbox-store'
import { GROWTH_OUTBOX_MAX_ATTEMPTS } from '../../src/growth/outbox-types'
import {
  MemoryLeadStore,
  MemoryScopeOfferStore,
  MemoryScopeReviewStore,
  UpstashLeadStore,
  type MemoryGrowthStoreOptions,
} from '../../src/production-check/store'
import { createProductionScopeOffer, createProductionScopeReview } from '../../src/production-check/scope-review'
import type { ProductionCheckLead } from '../../src/production-check/types'

const KEY = 'growth-outbox-unit-test-key-0123456789abcdef'
const START = new Date('2026-09-18T10:00:00.000Z')

function lead(): ProductionCheckLead {
  return {
    id: 'lead_abcdefghijklmnopqrstuvwx',
    scanId: 'rpt_abcdefghijklmnopqrstuvwx',
    createdAt: START.toISOString(),
    updatedAt: START.toISOString(),
    expiresAt: '2027-09-18T10:00:00.000Z',
    name: 'Private Founder',
    email: 'private@example.com',
    company: 'Private Company',
    appUrl: 'https://private.example/app',
    builder: 'cursor',
    launchStage: 'preparing_to_launch',
    helpNeeded: 'fix',
    timeline: 'now',
    shippingContext: 'private free text',
    attribution: {
      source: 'meta',
      medium: 'paid_social',
      campaign: 'qa_campaign',
      metaCampaignId: '1234567890',
      metaAdsetId: '2345678901',
      metaAdId: '3456789012',
    },
    score: 8,
    segment: 'qualified',
    status: 'new',
    scanSummary: { publicRisk: 2, fixNow: 2, review: 1, expected: 4, exposureBand: 'medium' },
    notification: { status: 'pending' },
  }
}

function growth(outbox: MemoryGrowthOutboxStore): MemoryGrowthStoreOptions {
  return { outbox, events: createGrowthOutcomeEventFactory(KEY) }
}

test('commits every durable lead, review, and offer transition to one sanitized ledger', async () => {
  let now = new Date(START)
  const clock = () => new Date(now)
  const outbox = new MemoryGrowthOutboxStore(clock)
  const options = growth(outbox)
  const leads = new MemoryLeadStore(clock, options)
  const reviews = new MemoryScopeReviewStore(clock, options)
  const offers = new MemoryScopeOfferStore(clock, options)

  const createdLead = await leads.createOrGet(lead())
  const review = createProductionScopeReview({
    lead: createdLead.lead,
    concern: 'launch_readiness',
    accessWillingness: 'yes_after_review',
  }, clock)
  await reviews.createOrGet(review)
  now = new Date('2026-09-18T10:05:00.000Z')
  await reviews.save({
    ...review,
    status: 'offer_prepared',
    decision: 'launch_blocker_fix',
    reviewedAt: now.toISOString(),
    updatedAt: now.toISOString(),
  })
  const decidedReview = await reviews.get(review.id)
  assert.ok(decidedReview)
  const offer = createProductionScopeOffer({
    review: decidedReview,
    type: 'launch_blocker_fix',
    summary: 'Bounded scope',
    includedItems: ['Correct authorization'],
    exclusions: [],
    amount: 500,
    createId: () => 'offer_abcdefghijklmnopqrstuvwx',
  }, clock)
  await offers.claimForReview(offer)
  now = new Date('2026-09-18T10:06:00.000Z')
  await offers.markSent(offer.id, now.toISOString())
  now = new Date('2026-09-18T10:07:00.000Z')
  await offers.transitionDecision(offer.id, 'accepted', now.toISOString())

  const ledger = await outbox.listLedger(0, 100)
  assert.deepEqual(ledger.map(({ event }) => event.eventType), [
    'lead.created',
    'lead.segmented',
    'scope_review.requested',
    'scope_review.decision_recorded',
    'offer.created',
    'offer.sent',
    'offer.accepted',
  ])
  assert.deepEqual(ledger.map(({ sequence }) => sequence), [1, 2, 3, 4, 5, 6, 7])
  const serialized = JSON.stringify(ledger)
  for (const forbidden of ['Private Founder', 'private@example.com', 'Private Company', 'private.example', 'private free text']) {
    assert.doesNotMatch(serialized, new RegExp(forbidden.replace('.', '\\.')))
  }
  assert.doesNotMatch(serialized, /payment\.received|revenue\.recorded/)
  const accepted = ledger.at(-1)?.event
  assert.equal(accepted?.eventType, 'offer.accepted')
  if (accepted?.eventType === 'offer.accepted') {
    assert.equal(accepted.outcome.amountMinor, 50_000)
    assert.match(accepted.subject.scanId ?? '', /^scan_v1_/)
    assert.match(accepted.subject.offerId, /^offer_v1_/)
    assert.notEqual(accepted.subject.offerId, offer.id)
  }
})

for (const failurePoint of ['before_business', 'after_business', 'after_ledger'] as const) {
  test(`rolls back business and event state when memory commit fails at ${failurePoint}`, async () => {
    let injected = false
    const outbox = new MemoryGrowthOutboxStore(() => START, (point) => {
      if (!injected && point === failurePoint) {
        injected = true
        throw new Error('injected atomic failure')
      }
    })
    const store = new MemoryLeadStore(() => START, growth(outbox))
    await assert.rejects(store.createOrGet(lead()), /injected atomic failure/)
    assert.equal(await store.get(lead().id), null)
    assert.deepEqual(await outbox.listLedger(), [])
  })
}

test('concurrent identical transitions reuse event IDs while later review decisions use a new revision', async () => {
  const outbox = new MemoryGrowthOutboxStore(() => START)
  const options = growth(outbox)
  const leads = new MemoryLeadStore(() => START, options)
  const reviews = new MemoryScopeReviewStore(() => START, options)
  const [first, retry] = await Promise.all([leads.createOrGet(lead()), leads.createOrGet(lead())])
  assert.equal(Number(first.created) + Number(retry.created), 1)
  assert.equal((await outbox.listLedger()).length, 2)

  const review = createProductionScopeReview({
    lead: lead(), concern: 'payments', accessWillingness: 'not_yet',
  }, () => START)
  await reviews.createOrGet(review)
  await Promise.all([
    reviews.save({ ...review, status: 'needs_information', decision: 'needs_information', reviewedAt: START.toISOString() }),
    reviews.save({ ...review, status: 'needs_information', decision: 'needs_information', reviewedAt: START.toISOString() }),
  ])
  const afterFirst = await reviews.get(review.id)
  assert.equal(afterFirst?.growthEventRevisions?.decisionRecorded, 1)
  await reviews.save({
    ...afterFirst!,
    status: 'no_paid_work',
    decision: 'no_paid_work',
    reviewedAt: '2026-09-18T11:00:00.000Z',
    updatedAt: '2026-09-18T11:00:00.000Z',
  })
  const decisions = (await outbox.listLedger()).filter(({ event }) => event.eventType === 'scope_review.decision_recorded')
  assert.equal(decisions.length, 2)
  assert.notEqual(decisions[0]?.event.eventId, decisions[1]?.event.eventId)
  assert.equal((await reviews.get(review.id))?.growthEventRevisions?.decisionRecorded, 2)
})

test('leases, retries with bounded backoff, reclaims stale delivery, and dead-letters at exhaustion', async () => {
  let now = new Date(START)
  const outbox = new MemoryGrowthOutboxStore(() => new Date(now))
  const event = createGrowthOutcomeEventFactory(KEY).leadCreated(lead())
  outbox.commit([{ event, retainedUntil: lead().expiresAt }], () => undefined)
  const firstEventId = event.eventId

  let claimed = await outbox.claimDue(now, 60_000, 1)
  assert.equal(claimed[0]?.outbox.state, 'delivering')
  now = new Date(now.getTime() + 60_001)
  assert.equal(await outbox.reclaimStale(now), 1)
  assert.equal((await outbox.getOutbox(firstEventId))?.state, 'failed')

  for (let attempt = 2; attempt <= GROWTH_OUTBOX_MAX_ATTEMPTS; attempt += 1) {
    claimed = await outbox.claimDue(now, 60_000, 1)
    assert.equal(claimed[0]?.outbox.attemptCount, attempt)
    const failed = await outbox.markFailed(firstEventId, now, 'network')
    if (attempt < GROWTH_OUTBOX_MAX_ATTEMPTS) {
      assert.equal(failed?.state, 'failed')
      assert.ok(Date.parse(failed!.nextAttemptAt) > now.getTime())
      now = new Date(failed!.nextAttemptAt)
    } else {
      assert.equal(failed?.state, 'dead_letter')
    }
  }
  assert.equal((await outbox.claimDue(new Date('2027-09-01T00:00:00.000Z'), 60_000, 10)).some(({ outbox: item }) => item.eventId === firstEventId), false)
  assert.ok(await outbox.getLedger(firstEventId), 'dead-letter event remains exportable')
  assert.deepEqual(await outbox.getDeliveryHealth(now), {
    asOf: now.toISOString(),
    failed: 0,
    deadLetter: 1,
  })
})

test('delivery health counts only retained failed and dead-letter records', async () => {
  let now = START
  const outbox = new MemoryGrowthOutboxStore(() => now)
  const events = createGrowthOutcomeEventFactory(KEY)
  const failedEvent = events.leadCreated({ ...lead(), id: 'lead_aaaaaaaaaaaaaaaaaaaaaaaa' })
  const deadLetterEvent = events.leadCreated({ ...lead(), id: 'lead_bbbbbbbbbbbbbbbbbbbbbbbb' })
  outbox.commit([
    { event: failedEvent, retainedUntil: '2026-09-19T12:00:00.000Z' },
    { event: deadLetterEvent, retainedUntil: '2026-09-19T12:00:00.000Z' },
  ], () => undefined)

  await outbox.claimDue(now, 60_000, 2)
  await outbox.markFailed(failedEvent.eventId, now, 'network')
  await outbox.markFailed(deadLetterEvent.eventId, now, 'provider_4xx', true)

  assert.deepEqual(await outbox.getDeliveryHealth(now), {
    asOf: now.toISOString(),
    failed: 1,
    deadLetter: 1,
  })

  now = new Date('2026-09-20T12:00:00.000Z')
  assert.deepEqual(await outbox.getDeliveryHealth(now), {
    asOf: now.toISOString(),
    failed: 0,
    deadLetter: 0,
  })
})

test('Upstash delivery health prunes expired state-index members without scanning records', async () => {
  const originalFetch = globalThis.fetch
  let command: string[] = []
  globalThis.fetch = async (_input, init) => {
    command = JSON.parse(String(init?.body)) as string[]
    return Response.json({ result: [3, 2] })
  }
  try {
    const outbox = new UpstashGrowthOutboxStore('https://redis.example', 'private-token')
    assert.deepEqual(await outbox.getDeliveryHealth(START), {
      asOf: START.toISOString(),
      failed: 3,
      deadLetter: 2,
    })
    assert.equal(command[0], 'EVAL')
    assert.match(command[1] ?? '', /ZREMRANGEBYSCORE[\s\S]*ZCARD/)
    assert.doesNotMatch(command[1] ?? '', /redis\.call\(['"](?:SCAN|KEYS)['"]/)
    assert.ok(command.includes('engisols:growth:outbox:state:failed'))
    assert.ok(command.includes('engisols:growth:outbox:state:dead_letter'))
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('Upstash ledger pagination uses one bounded Redis round trip in sequence order', async () => {
  const originalFetch = globalThis.fetch
  const requests: string[][] = []
  const events = createGrowthOutcomeEventFactory(KEY)
  const first = events.leadCreated({ ...lead(), id: 'lead_cccccccccccccccccccccccc' })
  const second = events.leadCreated({ ...lead(), id: 'lead_dddddddddddddddddddddddd' })
  globalThis.fetch = async (_input, init) => {
    requests.push(JSON.parse(String(init?.body)) as string[])
    return Response.json({
      result: [
        '4', JSON.stringify(first), 'a'.repeat(64), START.toISOString(), '2027-09-18T10:00:00.000Z',
        '5', JSON.stringify(second), 'b'.repeat(64), START.toISOString(), '2027-09-18T10:00:00.000Z',
      ],
    })
  }
  try {
    const outbox = new UpstashGrowthOutboxStore('https://redis.example', 'private-token')
    const records = await outbox.listLedger(3, 2, 5)
    assert.deepEqual(records.map(({ sequence, event }) => [sequence, event.eventId]), [
      [4, first.eventId],
      [5, second.eventId],
    ])
    assert.equal(requests.length, 1)
    assert.equal(requests[0]?.[0], 'EVAL')
    assert.match(requests[0]?.[1] ?? '', /ZRANGEBYSCORE[\s\S]*HMGET/)
    assert.ok(requests[0]?.includes('2'), 'the requested page bound is passed to Redis')
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('delivered terminal records remain in the immutable export ledger', async () => {
  const outbox = new MemoryGrowthOutboxStore(() => START)
  await new MemoryLeadStore(() => START, growth(outbox)).createOrGet(lead())
  const claimed = await outbox.claimDue(START, 60_000, 1)
  const eventId = claimed[0]!.outbox.eventId
  assert.equal((await outbox.markDelivered(eventId, START))?.state, 'delivered')
  assert.equal((await outbox.markFailed(eventId, START, 'unknown'))?.state, 'delivered')
  assert.ok((await outbox.listLedger()).some(({ event }) => event.eventId === eventId))
})

test('an expired offer transition records the real expiry outcome without a decision or revenue event', async () => {
  let now = new Date(START)
  const clock = () => new Date(now)
  const outbox = new MemoryGrowthOutboxStore(clock)
  const options = growth(outbox)
  const review = createProductionScopeReview({
    lead: lead(), concern: 'reliability_bugs', accessWillingness: 'yes_after_review',
  }, clock)
  const offer = createProductionScopeOffer({
    review,
    type: 'production_harden',
    summary: 'Bounded hardening scope',
    includedItems: ['Harden one production path'],
    exclusions: [],
    createId: () => 'offer_zyxwvutsrqponmlkjihgfedc',
  }, clock)
  const offers = new MemoryScopeOfferStore(clock, options)
  await offers.claimForReview(offer)
  await offers.markSent(offer.id, START.toISOString())
  now = new Date(offer.expiresAt)
  const expired = await offers.transitionDecision(offer.id, 'accepted', now.toISOString())
  assert.equal(expired?.status, 'expired')
  const eventTypes = (await outbox.listLedger()).map(({ event }) => event.eventType)
  assert.deepEqual(eventTypes, ['offer.created', 'offer.sent', 'offer.expired'])
  assert.doesNotMatch(JSON.stringify(await outbox.listLedger()), /payment\.received|revenue\.recorded/)
})

test('the scheduler materializes an expired offer without a customer decision', async () => {
  let now = new Date(START)
  const clock = () => new Date(now)
  const outbox = new MemoryGrowthOutboxStore(clock)
  const options = growth(outbox)
  const leads = new MemoryLeadStore(clock, options)
  const reviews = new MemoryScopeReviewStore(clock, options)
  const offers = new MemoryScopeOfferStore(clock, options)
  const persistedLead = (await leads.createOrGet(lead())).lead
  const review = createProductionScopeReview({
    lead: persistedLead,
    concern: 'launch_readiness',
    accessWillingness: 'yes_after_review',
  }, clock)
  await reviews.createOrGet(review)
  const offer = createProductionScopeOffer({
    review,
    type: 'launch_blocker_fix',
    summary: 'Bounded scope',
    includedItems: ['Correct authorization'],
    exclusions: [],
    createId: () => 'offer_schedulerabcdefghijklmnop',
  }, clock)
  await offers.claimForReview(offer)
  await offers.markSent(offer.id, START.toISOString())
  now = new Date(Date.parse(offer.expiresAt) + 1)

  assert.equal(await offers.materializeExpired(now, 10), 1)
  assert.equal((await offers.get(offer.id))?.status, 'expired')
  assert.equal((await outbox.listLedger()).filter(({ event }) => event.eventType === 'offer.expired').length, 1)
  assert.equal(await offers.materializeExpired(now, 10), 0, 'repeat sweeps are idempotent')
})

test('Upstash lead transition writes business state, two events, indexes, and TTLs in one EVAL', async () => {
  const originalFetch = globalThis.fetch
  const commands: string[][] = []
  globalThis.fetch = async (_input, init) => {
    const command = JSON.parse(String(init?.body)) as string[]
    commands.push(command)
    return Response.json({ result: [1, JSON.stringify(lead())] })
  }
  try {
    const store = new UpstashLeadStore(
      'https://redis.example',
      'redis-token-never-persisted',
      () => START,
      { events: createGrowthOutcomeEventFactory(KEY) },
    )
    await store.createOrGet(lead())
    assert.equal(commands.length, 1)
    const command = commands[0]!
    assert.equal(command[0], 'EVAL')
    assert.match(command[1] ?? '', /existingDigest0[\s\S]*HSET[\s\S]*INCR[\s\S]*ZADD/)
    assert.match(command[1] ?? '', /existingDigest1/)
    assert.ok(command.includes('engisols:growth:ledger:sequence'))
    assert.ok(command.includes('engisols:growth:ledger:index'))
    assert.ok(command.includes('engisols:growth:outbox:due'))
    const eventPayloads = command.filter((value) => value.includes('"schemaVersion":"engisols-growth-event\/v1"'))
    assert.equal(eventPayloads.length, 2)
    assert.doesNotMatch(eventPayloads.join('\n'), /Private Founder|private@example\.com|redis-token/)
  } finally {
    globalThis.fetch = originalFetch
  }
})
