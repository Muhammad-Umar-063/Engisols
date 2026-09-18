import assert from 'node:assert/strict'
import { createHmac } from 'node:crypto'
import test from 'node:test'

import { createEngisolsGrowthEventId, type EngisolsGrowthEvent } from '../../src/growth/event-contract'
import { MemoryGrowthOutboxStore } from '../../src/growth/outbox-store'
import { GROWTH_OUTBOX_MAX_ATTEMPTS } from '../../src/growth/outbox-types'
import { deliverGrowthOutboxBatch } from '../../src/growth/webhook-delivery'
import { signGrowthWebhookBody } from '../../src/growth/webhook-signature'

const SECRET = 'growth-webhook-test-secret-0123456789abcdef'
const ID_KEY = 'growth-analytics-test-key-0123456789abcdef'
const START = new Date('2026-09-18T10:00:00.000Z')

function event(revision = 1): EngisolsGrowthEvent {
  return {
    schemaVersion: 'engisols-growth-event/v1',
    eventId: createEngisolsGrowthEventId({
      eventType: 'lead.created',
      primarySubjectId: 'lead_abcdefghijklmnopqrstuvwx',
      transitionRevision: revision,
    }, ID_KEY),
    eventType: 'lead.created',
    occurredAt: START.toISOString(),
    source: 'engisols-production-check',
    subject: { leadId: 'lead_abcdefghijklmnopqrstuvwx' },
    outcome: { builder: 'cursor', launchStage: 'preparing_to_launch' },
  }
}

function seed(store: MemoryGrowthOutboxStore, item = event()): void {
  store.commit([{ event: item, retainedUntil: '2027-09-18T10:00:00.000Z' }], () => undefined)
}

test('signs exact webhook bytes as v1=hex(timestamp.body)', () => {
  const body = '{"unicode":"✓","spaces":"kept exactly"}'
  const timestamp = '1789725600'
  const expected = createHmac('sha256', SECRET).update(timestamp).update('.').update(Buffer.from(body)).digest('hex')
  assert.equal(signGrowthWebhookBody(body, timestamp, SECRET), `v1=${expected}`)
  assert.notEqual(signGrowthWebhookBody(`${body}\n`, timestamp, SECRET), `v1=${expected}`)
})

test('keeps body and event ID stable while refreshing timestamp and signature on retry', async () => {
  let now = new Date(START)
  const store = new MemoryGrowthOutboxStore(() => new Date(now))
  seed(store)
  const requests: Array<{ body: string; eventId: string | null; timestamp: string | null; signature: string | null; redirect: RequestRedirect }> = []
  let status = 503
  const fetchMock: typeof fetch = async (_input, init) => {
    const headers = new Headers(init?.headers)
    requests.push({
      body: String(init?.body),
      eventId: headers.get('x-engisols-event-id'),
      timestamp: headers.get('x-engisols-timestamp'),
      signature: headers.get('x-engisols-signature'),
      redirect: init?.redirect ?? 'follow',
    })
    return new Response(null, { status })
  }
  const options = { store, configuration: { url: 'https://growth.example/api/webhooks/engisols/outcomes', secret: SECRET, production: true }, now: () => new Date(now), fetch: fetchMock }
  assert.deepEqual(await deliverGrowthOutboxBatch(options), { claimed: 1, delivered: 0, failed: 1, deadLettered: 0 })
  now = new Date(START.getTime() + 31_000)
  status = 200
  assert.deepEqual(await deliverGrowthOutboxBatch(options), { claimed: 1, delivered: 1, failed: 0, deadLettered: 0 })
  assert.equal(requests.length, 2)
  assert.equal(requests[0]?.body, requests[1]?.body)
  assert.equal(requests[0]?.eventId, requests[1]?.eventId)
  assert.notEqual(requests[0]?.timestamp, requests[1]?.timestamp)
  assert.notEqual(requests[0]?.signature, requests[1]?.signature)
  assert.deepEqual(requests.map((item) => item.redirect), ['error', 'error'])
})

test('isolates timeout, terminal 4xx, duplicate success, and retry exhaustion', async () => {
  let nowMs = START.getTime()
  const now = () => new Date(nowMs)
  const timeoutStore = new MemoryGrowthOutboxStore(now)
  seed(timeoutStore)
  await deliverGrowthOutboxBatch({
    store: timeoutStore,
    configuration: { url: 'https://growth.example/webhook', secret: SECRET, production: true },
    now,
    fetch: async () => { throw new DOMException('timed out', 'TimeoutError') },
  })
  assert.equal((await timeoutStore.getOutbox(event().eventId))?.lastSafeErrorCategory, 'timeout')

  nowMs += 31_000
  await deliverGrowthOutboxBatch({
    store: timeoutStore,
    configuration: { url: 'https://growth.example/webhook', secret: SECRET, production: true },
    now,
    fetch: async () => new Response(null, { status: 422 }),
  })
  assert.equal((await timeoutStore.getOutbox(event().eventId))?.state, 'dead_letter')

  const duplicateStore = new MemoryGrowthOutboxStore(now)
  seed(duplicateStore, event(2))
  await deliverGrowthOutboxBatch({
    store: duplicateStore,
    configuration: { url: 'https://growth.example/webhook', secret: SECRET, production: true },
    now,
    fetch: async () => Response.json({ ok: true, duplicate: true }),
  })
  assert.equal((await duplicateStore.getOutbox(event(2).eventId))?.state, 'delivered')

  const exhaustedStore = new MemoryGrowthOutboxStore(now)
  seed(exhaustedStore, event(3))
  for (let attempt = 1; attempt <= GROWTH_OUTBOX_MAX_ATTEMPTS; attempt += 1) {
    await deliverGrowthOutboxBatch({
      store: exhaustedStore,
      configuration: { url: 'https://growth.example/webhook', secret: SECRET, production: true },
      now,
      fetch: async () => new Response(null, { status: 503 }),
    })
    nowMs += Math.min(30_000 * (2 ** (attempt - 1)), 6 * 60 * 60 * 1_000) + 1
  }
  assert.equal((await exhaustedStore.getOutbox(event(3).eventId))?.state, 'dead_letter')
  assert.ok(await exhaustedStore.getLedger(event(3).eventId), 'dead-letter remains reconcilable')
})

test('stores only safe retry categories for throttling, server, and invalid responses', async () => {
  const cases = [
    { revision: 4, status: 429, category: 'rate_limited' },
    { revision: 5, status: 503, category: 'provider_5xx' },
    { revision: 6, status: 302, category: 'invalid_response' },
  ] as const
  for (const item of cases) {
    const store = new MemoryGrowthOutboxStore(() => START)
    seed(store, event(item.revision))
    await deliverGrowthOutboxBatch({
      store,
      configuration: { url: 'https://growth.example/webhook', secret: SECRET, production: true },
      now: () => START,
      fetch: async () => new Response(null, { status: item.status }),
    })
    const record = await store.getOutbox(event(item.revision).eventId)
    assert.equal(record?.lastSafeErrorCategory, item.category)
    assert.equal(record?.state, 'failed')
  }
})

test('rejects a non-HTTPS production webhook before claiming events', async () => {
  const store = new MemoryGrowthOutboxStore(() => START)
  seed(store)
  await assert.rejects(deliverGrowthOutboxBatch({
    store,
    configuration: { url: 'http://growth.example/webhook', secret: SECRET, production: true },
  }), /HTTPS/)
  assert.equal((await store.getOutbox(event().eventId))?.state, 'pending')
})
