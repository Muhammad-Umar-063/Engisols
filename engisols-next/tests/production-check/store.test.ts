import assert from 'node:assert/strict'
import test from 'node:test'

import {
  MemoryLeadStore,
  MemoryScanStore,
  UpstashLeadStore,
  UpstashScanStore,
  UpstashScopeOfferStore,
} from '../../src/production-check/store'
import type { PersistedScan, ProductionCheckLead } from '../../src/production-check/types'
import { createProductionScopeOffer, createProductionScopeReview } from '../../src/production-check/scope-review'

function queuedScan(): PersistedScan {
  return {
    publicId: 'rpt_abcdefghijklmnopqrstuvwx',
    status: 'queued',
    requestedUrl: 'https://app.example/',
    progress: {
      phase: 'validating',
      progress: 0,
      message: 'Waiting to start',
      events: [],
    },
    answers: {},
    attribution: {},
    createdAt: '2026-09-07T10:00:00.000Z',
    expiresAt: '2026-09-14T10:00:00.000Z',
  }
}

function lead(): ProductionCheckLead {
  return {
    id: 'lead_abcdefghijklmnopqrstuvwx',
    scanId: 'rpt_abcdefghijklmnopqrstuvwx',
    createdAt: '2026-09-07T10:00:00.000Z',
    updatedAt: '2026-09-07T10:00:00.000Z',
    expiresAt: '2027-09-07T10:00:00.000Z',
    name: 'Ada Founder',
    email: 'ada@example.com',
    appUrl: 'https://app.example/',
    helpNeeded: 'verify',
    timeline: 'month',
    attribution: { source: 'meta' },
    score: 2,
    segment: 'nurture',
    status: 'new',
    scanSummary: { publicRisk: 0, fixNow: 0, review: 1, expected: 0, exposureBand: 'low' },
    notification: { status: 'pending' },
  }
}

test('persists qualification answers independently from progress updates', async () => {
  const store = new MemoryScanStore(() => new Date('2026-09-07T11:00:00.000Z'))
  const scan = queuedScan()
  await store.create(scan)
  await Promise.all([
    store.updateProgress(scan.publicId, {
      phase: 'fetching', progress: 12, message: 'Reaching the app', events: [],
    }),
    store.updateAnswers(scan.publicId, { builder: 'lovable', launchStage: 'taking_payments' }),
  ])

  const persisted = await store.get(scan.publicId)
  assert.equal(persisted?.progress.phase, 'fetching')
  assert.deepEqual(persisted?.answers, { builder: 'lovable', launchStage: 'taking_payments' })
})

test('expired report records are not returned', async () => {
  const store = new MemoryScanStore(() => new Date('2026-09-15T10:00:00.000Z'))
  await store.create(queuedScan())
  assert.equal(
    await store.updateAnswers('rpt_abcdefghijklmnopqrstuvwx', { builder: 'cursor' }),
    false,
  )
  assert.equal(await store.get('rpt_abcdefghijklmnopqrstuvwx'), null)
})

test('answer updates report whether the record still exists', async () => {
  const store = new MemoryScanStore(() => new Date('2026-09-07T11:00:00.000Z'))
  const scan = queuedScan()
  await store.create(scan)
  assert.equal(await store.updateAnswers(scan.publicId, { builder: 'cursor' }), true)
  assert.equal(
    await store.updateAnswers('rpt_missingrecordxxxxxxxxx', { builder: 'cursor' }),
    false,
  )
})

test('sets the scan TTL once from expiresAt and never refreshes it on updates', async () => {
  const originalFetch = globalThis.fetch
  const commands: string[][] = []
  globalThis.fetch = async (_input, init) => {
    const command = JSON.parse(String(init?.body)) as string[]
    commands.push(command)
    return Response.json({ result: 1 })
  }

  try {
    const now = new Date('2026-09-07T11:00:00.000Z')
    const store = new UpstashScanStore('https://redis.example', 'secret', () => now)
    const scan = queuedScan()
    await store.create(scan)
    await store.updateStatus(scan.publicId, 'running')
    await store.updateAnswers(scan.publicId, { builder: 'cursor' })
    await store.updateMetaTracking(scan.publicId, {
      consent: 'granted',
      identifiers: {},
      eventSourceUrl: 'https://engisols.com/production-check',
      scanStartedEventId: 'scanstart_abcdefghijklmnopqrstuvwxyzABCDEF',
      scanCompleted: {
        eventId: 'scancomplete_abcdefghijklmnopqrstuvwxyzABCDEF',
        attemptedAt: now.toISOString(),
      },
    })

    assert.equal(commands.length, 4)
    assert.match(commands[0]?.[1] ?? '', /HSET.*EXPIRE/)
    assert.equal(
      commands[0]?.at(-1),
      String(Math.ceil((new Date(scan.expiresAt).getTime() - now.getTime()) / 1_000)),
    )
    for (const command of commands.slice(1)) {
      assert.equal(command[0], 'EVAL')
      assert.doesNotMatch(command[1] ?? '', /EXPIRE/)
    }
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('does not return an expired Upstash scan even if Redis still has the key', async () => {
  const originalFetch = globalThis.fetch
  const scan = queuedScan()
  globalThis.fetch = async () => Response.json({
    result: Object.entries({
      publicId: scan.publicId,
      status: scan.status,
      requestedUrl: scan.requestedUrl,
      progress: JSON.stringify(scan.progress),
      attribution: JSON.stringify(scan.attribution),
      createdAt: scan.createdAt,
      expiresAt: scan.expiresAt,
    }).flat(),
  })

  try {
    const store = new UpstashScanStore(
      'https://redis.example',
      'secret',
      () => new Date('2026-09-15T10:00:00.000Z'),
    )
    assert.equal(await store.get(scan.publicId), null)
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('stores leads under a retention policy distinct from report expiry', async () => {
  const store = new MemoryLeadStore(() => new Date('2026-12-01T10:00:00.000Z'))
  await store.save(lead())
  assert.equal((await store.get('lead_abcdefghijklmnopqrstuvwx'))?.email, 'ada@example.com')
})

test('evicts expired in-memory leads while saving new records', async () => {
  let currentTime = new Date('2026-12-01T10:00:00.000Z')
  const store = new MemoryLeadStore(() => currentTime)
  await store.save(lead())

  currentTime = new Date('2027-09-08T10:00:00.000Z')
  const replacement = {
    ...lead(),
    id: 'lead_zyxwvutsrqponmlkjihgfedc',
    createdAt: currentTime.toISOString(),
    updatedAt: currentTime.toISOString(),
    expiresAt: '2028-09-07T10:00:00.000Z',
  }
  await store.save(replacement)

  assert.equal(await store.get('lead_abcdefghijklmnopqrstuvwx'), null)
  assert.equal((await store.get(replacement.id))?.email, 'ada@example.com')
})

test('atomically creates and updates Upstash leads with their remaining retention TTL', async () => {
  const originalFetch = globalThis.fetch
  const commands: string[][] = []
  globalThis.fetch = async (_input, init) => {
    const command = JSON.parse(String(init?.body)) as string[]
    commands.push(command)
    return Response.json({ result: [1, JSON.stringify(lead())] })
  }

  try {
    let now = new Date('2026-12-01T10:00:00.000Z')
    const store = new UpstashLeadStore(
      'https://redis.example',
      'secret',
      () => now,
    )
    await store.createOrGet(lead())
    now = new Date('2027-01-01T10:00:00.000Z')
    await store.save({
      ...lead(),
      updatedAt: now.toISOString(),
      notification: { status: 'sent', attemptedAt: now.toISOString() },
    })

    assert.equal(commands.length, 2)
    for (const command of commands) {
      assert.equal(command[0], 'EVAL')
      assert.match(command[1] ?? '', /HSET.*EXPIRE/)
    }
    assert.equal(
      commands[1]?.at(-1),
      String(Math.ceil((new Date(lead().expiresAt).getTime() - now.getTime()) / 1_000)),
    )
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('does not downgrade a sent in-memory lead back to pending', async () => {
  const store = new MemoryLeadStore(() => new Date('2026-12-01T10:00:00.000Z'))
  const sent: ProductionCheckLead = {
    ...lead(),
    notification: { status: 'sent', attemptedAt: '2026-12-01T10:00:00.000Z' },
  }
  await store.save(sent)
  await store.save({ ...sent, notification: { status: 'pending' } })
  assert.equal((await store.get(sent.id))?.notification.status, 'sent')
})

test('claims an Upstash offer with one atomic review-and-offer operation', async () => {
  const originalFetch = globalThis.fetch
  const commands: string[][] = []
  globalThis.fetch = async (_input, init) => {
    const command = JSON.parse(String(init?.body)) as string[]
    commands.push(command)
    return Response.json({ result: [1, command[5]] })
  }

  try {
    const claimedAt = new Date('2026-12-01T10:00:00.000Z')
    const review = createProductionScopeReview({
      lead: lead(),
      concern: 'payments',
      accessWillingness: 'yes_after_review',
    }, () => claimedAt)
    const offer = createProductionScopeOffer({
      review,
      type: 'launch_blocker_fix',
      summary: 'A bounded production scope.',
      includedItems: ['Correct authorization'],
      exclusions: [],
    }, () => claimedAt)
    const store = new UpstashScopeOfferStore('https://redis.example', 'secret', () => claimedAt)
    const result = await store.claimForReview(offer)

    assert.equal(result.created, true)
    assert.equal(result.offer.id, offer.id)
    assert.equal(commands.length, 1)
    assert.equal(commands[0]?.[0], 'EVAL')
    assert.equal(commands[0]?.[2], '2')
    assert.match(commands[0]?.[3] ?? '', /scope-offer-review:/)
    assert.match(commands[0]?.[4] ?? '', /scope-offer:/)
    assert.match(commands[0]?.[1] ?? '', /claimedId.*SET.*KEYS\[2\].*SET.*KEYS\[1\]/)
  } finally {
    globalThis.fetch = originalFetch
  }
})
