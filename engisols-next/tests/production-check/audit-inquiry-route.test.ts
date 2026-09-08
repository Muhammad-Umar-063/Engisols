import assert from 'node:assert/strict'
import test from 'node:test'

import { createAuditInquiryPostHandler } from '../../app/api/ai-app-audit/inquiry/route'
import { AuditInquiryEmailConfigurationError, type AuditInquiryEmailMessage } from '../../src/campaign/audit-inquiry-email'

const validBody = {
  name: 'Ada Founder',
  email: 'ada@example.com',
  app: 'https://app.example.com',
  worry: 'I need confidence in authentication and payments.',
  website: '',
}

function request(body: unknown, origin = 'https://engisols.com'): Request {
  return new Request('https://engisols.com/api/ai-app-audit/inquiry', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: origin },
    body: JSON.stringify(body),
  })
}

test('sends a validated audit inquiry', async () => {
  const messages: AuditInquiryEmailMessage[] = []
  const handler = createAuditInquiryPostHandler(async (message) => { messages.push(message) })
  const response = await handler(request(validBody))
  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), { ok: true })
  assert.equal(messages.length, 1)
  assert.equal(messages[0]?.replyTo, validBody.email)
  assert.match(messages[0]?.subject ?? '', /app\.example\.com/)
  assert.match(messages[0]?.idempotencyKey ?? '', /^ai-app-audit\/[a-f0-9]{32}$/)
})

test('rejects malformed and cross-origin submissions without sending', async () => {
  let sends = 0
  const handler = createAuditInquiryPostHandler(async () => { sends += 1 })
  assert.equal((await handler(request({ ...validBody, email: 'bad' }))).status, 400)
  assert.equal((await handler(request({ ...validBody, privileged: true }))).status, 400)
  assert.equal((await handler(request(validBody, 'https://attacker.example'))).status, 403)
  assert.equal(sends, 0)
})

test('silently accepts a honeypot submission without sending', async () => {
  let sends = 0
  const handler = createAuditInquiryPostHandler(async () => { sends += 1 })
  const response = await handler(request({ ...validBody, website: 'https://bot.example' }))
  assert.equal(response.status, 200)
  assert.equal(sends, 0)
})

test('returns a safe recoverable error when campaign delivery is unavailable', async () => {
  const handler = createAuditInquiryPostHandler(async () => {
    throw new AuditInquiryEmailConfigurationError('private setup detail')
  })
  const response = await handler(request(validBody))
  const serialized = JSON.stringify(await response.json())
  assert.equal(response.status, 503)
  assert.match(serialized, /not configured yet/)
  assert.doesNotMatch(serialized, /private setup detail/)
})
