import assert from 'node:assert/strict'
import test from 'node:test'

import { createGrowthOutcomesGetHandler } from '../../app/api/internal/growth/outcomes/route'
import { createGrowthOutboxPostHandler } from '../../app/api/internal/growth/outbox/route'
import { createEngisolsGrowthEventId, type EngisolsGrowthEvent } from '../../src/growth/event-contract'
import { signGrowthExportCursor } from '../../src/growth/export-cursor'
import type { GrowthInternalRateLimiter } from '../../src/growth/export-rate-limit'
import { UpstashGrowthInternalRateLimiter } from '../../src/growth/export-rate-limit'
import { MemoryGrowthOutboxStore } from '../../src/growth/outbox-store'
import { MemoryScopeOfferStore } from '../../src/production-check/store'

const TOKEN = 'growth-export-test-token-0123456789abcdef'
const PREVIOUS_TOKEN = 'growth-export-previous-token-0123456789abcdef'
const CURSOR_SECRET = 'growth-export-cursor-secret-0123456789abcdef'
const CRON = 'growth-cron-test-secret-0123456789abcdef'
const ID_KEY = 'growth-export-id-key-0123456789abcdef'
const NOW = new Date('2026-09-18T12:00:00.000Z')

const allow: GrowthInternalRateLimiter = { consume: async () => true }
const deny: GrowthInternalRateLimiter = { consume: async () => false }

function event(revision: number, occurredAt: string): EngisolsGrowthEvent {
  const leadId = `lead_${String(revision).padStart(24, 'a')}`
  return {
    schemaVersion: 'engisols-growth-event/v1',
    eventId: createEngisolsGrowthEventId({ eventType: 'lead.created', primarySubjectId: leadId, transitionRevision: 1 }, ID_KEY),
    eventType: 'lead.created',
    occurredAt,
    source: 'engisols-production-check',
    subject: { leadId },
    outcome: {},
  }
}

function append(store: MemoryGrowthOutboxStore, item: EngisolsGrowthEvent): void {
  store.commit([{ event: item, retainedUntil: '2027-09-18T12:00:00.000Z' }], () => undefined)
}

function request(url: string, token = TOKEN): Request {
  return new Request(url, { headers: { Authorization: `Bearer ${token}` } })
}

test('exports a frozen snapshot with signed interruption-safe pagination and no gaps', async () => {
  const store = new MemoryGrowthOutboxStore(() => NOW)
  append(store, event(1, '2026-09-18T10:00:00.000Z'))
  append(store, event(2, '2026-09-18T10:01:00.000Z'))
  const handler = createGrowthOutcomesGetHandler({
    environment: { NODE_ENV: 'test' as const, GROWTH_COPILOT_EXPORT_TOKEN: TOKEN, GROWTH_COPILOT_EXPORT_TOKEN_PREVIOUS: PREVIOUS_TOKEN, GROWTH_COPILOT_EXPORT_CURSOR_SECRET: CURSOR_SECRET },
    now: () => NOW,
    outbox: store,
    limiter: allow,
    audit: () => undefined,
  })
  const base = 'https://engisols.example/api/internal/growth/outcomes?since=2026-09-18T09:00:00.000Z&until=2026-09-18T11:00:00.000Z&limit=1'
  const first = await handler(request(base))
  assert.equal(first.status, 200)
  const firstBody = await first.json() as { events: EngisolsGrowthEvent[]; nextCursor: string; checkpointCursor: string }
  assert.equal(firstBody.events.length, 1)
  append(store, event(3, '2026-09-18T10:02:00.000Z'))

  const second = await handler(request(`${base}&cursor=${encodeURIComponent(firstBody.nextCursor)}`))
  const secondBody = await second.json() as { events: EngisolsGrowthEvent[]; nextCursor: null; checkpointCursor: string }
  assert.equal(second.status, 200)
  assert.equal(secondBody.events.length, 1)
  assert.equal(secondBody.nextCursor, null)
  assert.deepEqual([...firstBody.events, ...secondBody.events].map((item) => item.subject.leadId), [
    event(1, '').subject.leadId,
    event(2, '').subject.leadId,
  ])

  // A completed checkpoint establishes a new high-water mark and retrieves
  // records appended after the interrupted snapshot without replaying old rows.
  const third = await handler(request(`${base}&cursor=${encodeURIComponent(secondBody.checkpointCursor)}`))
  const thirdBody = await third.json() as { events: EngisolsGrowthEvent[]; nextCursor: null }
  assert.equal(third.status, 200)
  assert.deepEqual(thirdBody.events.map((item) => item.subject.leadId), [event(3, '').subject.leadId])
})

test('rejects ordinary browsers, tampered/cross-range cursors, invalid ranges, limits, and rate excess', async () => {
  const store = new MemoryGrowthOutboxStore(() => NOW)
  append(store, event(1, '2026-09-18T10:00:00.000Z'))
  const dependencies = {
    environment: { NODE_ENV: 'test' as const, GROWTH_COPILOT_EXPORT_TOKEN: TOKEN, GROWTH_COPILOT_EXPORT_TOKEN_PREVIOUS: PREVIOUS_TOKEN, GROWTH_COPILOT_EXPORT_CURSOR_SECRET: CURSOR_SECRET },
    now: () => NOW,
    outbox: store,
    limiter: allow,
    audit: () => undefined,
  }
  const handler = createGrowthOutcomesGetHandler(dependencies)
  assert.equal((await handler(new Request('https://engisols.example/api/internal/growth/outcomes'))).status, 401)
  assert.equal((await handler(request('https://engisols.example/api/internal/growth/outcomes?since=2026-01-01T00:00:00Z&until=2026-09-18T00:00:00Z'))).status, 400)
  assert.equal((await handler(request('https://engisols.example/api/internal/growth/outcomes?limit=501'))).status, 400)

  const first = await handler(request('https://engisols.example/api/internal/growth/outcomes?since=2026-09-18T09:00:00Z&until=2026-09-18T11:00:00Z&limit=1'))
  const body = await first.json() as { checkpointCursor: string }
  assert.equal((await handler(request(`https://engisols.example/api/internal/growth/outcomes?cursor=${encodeURIComponent(`${body.checkpointCursor}x`)}`))).status, 400)
  const bearerForgedCursor = signGrowthExportCursor({
    version: 1,
    afterSequence: 0,
    snapshotMaxSequence: 1,
    since: '2026-09-18T09:00:00.000Z',
    until: '2026-09-18T11:00:00.000Z',
    complete: false,
  }, TOKEN)
  assert.equal((await handler(request(`https://engisols.example/api/internal/growth/outcomes?cursor=${encodeURIComponent(bearerForgedCursor)}`))).status, 400)
  assert.equal((await handler(request(`https://engisols.example/api/internal/growth/outcomes?since=2026-09-18T08:00:00Z&until=2026-09-18T11:00:00Z&cursor=${encodeURIComponent(body.checkpointCursor)}`))).status, 400)

  const limited = createGrowthOutcomesGetHandler({ ...dependencies, limiter: deny })
  assert.equal((await limited(request('https://engisols.example/api/internal/growth/outcomes'))).status, 429)
  const unavailable = createGrowthOutcomesGetHandler({
    ...dependencies,
    limiter: { consume: async () => { throw new Error('redis unavailable') } },
  })
  assert.equal((await unavailable(request('https://engisols.example/api/internal/growth/outcomes'))).status, 503)
})

test('accepts rotated credentials and keeps cron output aggregate-only', async () => {
  const handler = createGrowthOutboxPostHandler({
    environment: {
      NODE_ENV: 'test',
      GROWTH_COPILOT_OUTBOX_CRON_SECRET: CRON,
      GROWTH_COPILOT_OUTBOX_CRON_SECRET_PREVIOUS: `${CRON}-previous`,
    },
    now: () => NOW,
    outbox: new MemoryGrowthOutboxStore(() => NOW),
    offers: new MemoryScopeOfferStore(() => NOW),
    limiter: allow,
    deliver: async () => ({ claimed: 2, delivered: 1, failed: 1, deadLettered: 0 }),
  })
  assert.equal((await handler(new Request('https://engisols.example/api/internal/growth/outbox', { method: 'POST' }))).status, 401)
  const response = await handler(new Request('https://engisols.example/api/internal/growth/outbox', {
    method: 'POST',
    headers: { Authorization: `Bearer ${CRON}-previous` },
  }))
  assert.equal(response.status, 200)
  const serialized = JSON.stringify(await response.json())
  assert.match(serialized, /"claimed":2/)
  assert.doesNotMatch(serialized, /evt_v1_|secret|token/i)
})

test('uses one atomic Redis counter per credential-version window', async () => {
  const originalFetch = globalThis.fetch
  let command: unknown
  globalThis.fetch = async (_input, init) => {
    command = JSON.parse(String(init?.body))
    return Response.json({ result: 1 })
  }
  try {
    const limiter = new UpstashGrowthInternalRateLimiter('https://redis.example', 'private-token')
    assert.equal(await limiter.consume('export', 'previous', NOW), true)
    assert.deepEqual(command, [
      'EVAL',
      "local count = redis.call('INCR', KEYS[1]); if count == 1 then redis.call('EXPIRE', KEYS[1], 120) end; return count",
      '1',
      `engisols:growth:rate:export:previous:${Math.floor(NOW.getTime() / 60_000)}`,
    ])
    assert.doesNotMatch(JSON.stringify(command), new RegExp(TOKEN))
  } finally {
    globalThis.fetch = originalFetch
  }
})
