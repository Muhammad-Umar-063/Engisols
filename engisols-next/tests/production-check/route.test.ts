import assert from 'node:assert/strict'
import test from 'node:test'

import { createScansPostHandler } from '../../app/api/scans/route'
import {
  signAttributionToken,
  verifyAttributionToken,
} from '../../src/production-check/attribution-token.server'
import { MemoryScanStore } from '../../src/production-check/store'
import { scanResult } from './fixtures'

const attributionSecret = 'production-check-route-test-secret-0123456789'

function request(body: string): Request {
  return new Request('https://engisols.com/api/scans', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  })
}

test('creates one high-entropy scan and schedules the scanner exactly once', async () => {
  const store = new MemoryScanStore()
  const tasks: Array<() => Promise<void>> = []
  let scanCalls = 0
  const handler = createScansPostHandler({
    store,
    schedule: (task) => tasks.push(task),
    scan: async () => {
      scanCalls += 1
      return scanResult()
    },
  })

  const response = await handler(request('{"url":"https://app.example/path?token=private"}'))
  const body = (await response.json()) as { ok: boolean; scanId: string }

  assert.equal(response.status, 202)
  assert.equal(body.ok, true)
  assert.match(body.scanId, /^rpt_[A-Za-z0-9_-]{24}$/)
  assert.deepEqual(Object.keys(body).sort(), ['ok', 'scanId'])
  assert.equal(tasks.length, 1)
  assert.equal(scanCalls, 0)
  assert.equal((await store.get(body.scanId))?.requestedUrl, 'https://app.example/path')
  assert.deepEqual((await store.get(body.scanId))?.attribution, {})

  await tasks[0]?.()
  assert.equal(scanCalls, 1)
  assert.equal((await store.get(body.scanId))?.status, 'completed')
})

test('persists validated attribution with the scan record', async () => {
  const store = new MemoryScanStore()
  const tasks: Array<() => Promise<void>> = []
  const handler = createScansPostHandler({
    store,
    schedule: (task) => tasks.push(task),
    scan: async () => scanResult(),
    verifyAttributionToken: (token) => verifyAttributionToken(token, {
      secret: attributionSecret,
      now: new Date('2026-09-09T12:00:00.000Z'),
    }),
  })
  const attributionToken = signAttributionToken(
    { source: 'meta', medium: 'paid-social', campaign: 'launch' },
    { secret: attributionSecret, now: new Date('2026-09-09T10:00:00.000Z') },
  )
  const response = await handler(request(JSON.stringify({
    url: 'https://app.example/',
    attributionToken,
  })))
  const body = (await response.json()) as { scanId: string }
  assert.deepEqual((await store.get(body.scanId))?.attribution, {
    source: 'meta', medium: 'paid-social', campaign: 'launch',
  })
})

test('rejects raw attribution spoofing and tampered attribution tokens', async () => {
  const tasks: Array<() => Promise<void>> = []
  const handler = createScansPostHandler({
    store: new MemoryScanStore(),
    schedule: (task) => tasks.push(task),
    verifyAttributionToken: (token) => verifyAttributionToken(token, {
      secret: attributionSecret,
      now: new Date('2026-09-09T12:00:00.000Z'),
    }),
  })
  const token = signAttributionToken(
    { source: 'meta' },
    { secret: attributionSecret, now: new Date('2026-09-09T10:00:00.000Z') },
  )
  const [payload, signature] = token.split('.')

  const rawSpoof = await handler(request(JSON.stringify({
    url: 'https://app.example/',
    attribution: { source: 'attacker-controlled' },
  })))
  const tampered = await handler(request(JSON.stringify({
    url: 'https://app.example/',
    attributionToken: `${payload}A.${signature}`,
  })))

  assert.equal(rawSpoof.status, 400)
  assert.equal(tampered.status, 400)
  assert.equal(tasks.length, 0)
})

test('rejects malformed requests without scheduling work', async () => {
  const tasks: Array<() => Promise<void>> = []
  const handler = createScansPostHandler({
    store: new MemoryScanStore(),
    schedule: (task) => tasks.push(task),
  })
  const response = await handler(request('{"url":42}'))
  assert.equal(response.status, 400)
  assert.equal(tasks.length, 0)
})

test('preserves the bounded per-instance scan capacity', async () => {
  const tasks: Array<() => Promise<void>> = []
  const handler = createScansPostHandler({
    store: new MemoryScanStore(),
    schedule: (task) => tasks.push(task),
    scan: async () => scanResult(),
  })
  const accepted = await Promise.all(
    Array.from({ length: 4 }, () =>
      handler(request('{"url":"https://app.example"}')),
    ),
  )
  const saturated = await handler(request('{"url":"https://app.example"}'))
  assert.equal(accepted.every(({ status }) => status === 202), true)
  assert.equal(saturated.status, 503)
  await Promise.all(tasks.map((task) => task()))
})
