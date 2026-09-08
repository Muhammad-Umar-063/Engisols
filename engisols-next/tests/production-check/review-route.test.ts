import assert from 'node:assert/strict'
import test from 'node:test'

import { createReviewRequestPostHandler } from '../../app/api/production-check/review/route'
import { ReviewEmailConfigurationError, type ReviewEmailMessage } from '../../src/production-check/review-email'
import type { PersistedScan } from '../../src/production-check/types'
import { scanResult } from './fixtures'

const publicId = 'rpt_DemoPartialReport0000001'
const validBody = {
  reportId: publicId,
  name: 'Ada Founder',
  email: 'ada@example.com',
  help: 'verify',
  timeline: 'month',
  context: 'Preparing the first paid launch.',
  website: '',
}

function completedScan(overrides: Partial<PersistedScan> = {}): PersistedScan {
  return {
    publicId,
    status: 'completed',
    requestedUrl: 'https://app.example/',
    progress: { phase: 'complete', progress: 100, message: 'Complete', events: [] },
    answers: { builder: 'lovable', launchStage: 'taking_payments' },
    result: scanResult(),
    createdAt: '2026-09-08T10:00:00.000Z',
    expiresAt: '2026-09-15T10:00:00.000Z',
    ...overrides,
  }
}

function request(body: unknown, origin = 'https://engisols.com'): Request {
  return new Request('https://engisols.com/api/production-check/review', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: origin },
    body: JSON.stringify(body),
  })
}

test('sends a validated review request with server-derived report context', async () => {
  const messages: ReviewEmailMessage[] = []
  const handler = createReviewRequestPostHandler({
    load: async () => completedScan(),
    send: async (message) => { messages.push(message) },
  })

  const response = await handler(request(validBody))
  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), { ok: true })
  assert.equal(messages.length, 1)
  assert.equal(messages[0]?.replyTo, validBody.email)
  assert.match(messages[0]?.text ?? '', /Report: https:\/\/engisols\.com\/production-check\/report\//)
  assert.match(messages[0]?.text ?? '', /Builder: lovable/)
  assert.match(messages[0]?.idempotencyKey ?? '', new RegExp(`^production-check/${publicId}/[a-f0-9]{32}$`))
})

test('rejects malformed, unexpected, and cross-origin submissions without sending', async () => {
  let sends = 0
  const handler = createReviewRequestPostHandler({
    load: async () => completedScan(),
    send: async () => { sends += 1 },
  })
  const malformed = await handler(request({ ...validBody, help: 'anything' }))
  const unexpected = await handler(request({ ...validBody, privileged: true }))
  const crossOrigin = await handler(request(validBody, 'https://attacker.example'))
  assert.equal(malformed.status, 400)
  assert.equal(unexpected.status, 400)
  assert.equal(crossOrigin.status, 403)
  assert.equal(sends, 0)
})

test('requires a current completed report before sending', async () => {
  const missing = createReviewRequestPostHandler({ load: async () => null, send: async () => undefined })
  const running = createReviewRequestPostHandler({
    load: async () => completedScan({ status: 'running', result: undefined }),
    send: async () => undefined,
  })
  assert.equal((await missing(request(validBody))).status, 404)
  assert.equal((await running(request(validBody))).status, 409)
})

test('silently accepts a honeypot submission without loading or sending', async () => {
  let loads = 0
  let sends = 0
  const handler = createReviewRequestPostHandler({
    load: async () => { loads += 1; return completedScan() },
    send: async () => { sends += 1 },
  })
  const response = await handler(request({ ...validBody, website: 'https://bot.example' }))
  assert.equal(response.status, 200)
  assert.equal(loads, 0)
  assert.equal(sends, 0)
})

test('returns a safe recoverable error when delivery is not configured', async () => {
  const handler = createReviewRequestPostHandler({
    load: async () => completedScan(),
    send: async () => { throw new ReviewEmailConfigurationError('private setup detail') },
  })
  const response = await handler(request(validBody))
  const serialized = JSON.stringify(await response.json())
  assert.equal(response.status, 503)
  assert.match(serialized, /not configured yet/)
  assert.doesNotMatch(serialized, /private setup detail/)
})
