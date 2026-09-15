import assert from 'node:assert/strict'
import test from 'node:test'

import { createAuditInquiryPostHandler } from '../../app/api/ai-app-audit/inquiry/route'
import { AuditInquiryEmailConfigurationError, type AuditInquiryEmailMessage } from '../../src/campaign/audit-inquiry-email'
import { AUDIT_INQUIRY_NOTIFICATION_LEASE_MS } from '../../src/campaign/audit-inquiry-lead'
import { MemoryAuditInquiryLeadStore } from '../../src/campaign/audit-inquiry-store'
import type { AuditInquiryLeadStore } from '../../src/campaign/audit-inquiry-lead'

const validBody = {
  name: 'Ada Founder',
  email: 'ada@example.com',
  app: 'https://app.example.com',
  worry: 'I need confidence in authentication and payments.',
  website: '',
  attributionToken: 'signed-attribution-token',
}

function request(
  body: unknown,
  origin = 'https://engisols.com',
  extraHeaders: Record<string, string> = {},
): Request {
  return new Request('https://engisols.com/api/ai-app-audit/inquiry', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: origin,
      Cookie: '_fbp=fb.1.1725969600000.browser123',
      'User-Agent': 'Test Browser',
      'X-Forwarded-For': '203.0.113.4',
      ...extraHeaders,
    },
    body: JSON.stringify(body),
  })
}

test('persists attributed inquiry before deduplicated Meta and email delivery', async () => {
  const events: string[] = []
  const messages: AuditInquiryEmailMessage[] = []
  const baseStore = new MemoryAuditInquiryLeadStore()
  const leads: AuditInquiryLeadStore = {
    createOrGet: async (lead) => {
      events.push('persist')
      return baseStore.createOrGet(lead)
    },
    claimNotification: (...args) => baseStore.claimNotification(...args),
    save: (lead) => baseStore.save(lead),
    get: (id) => baseStore.get(id),
  }
  const handler = createAuditInquiryPostHandler({
    leads,
    verifyAttribution: () => ({ source: 'meta', campaign: 'audit-founders', fbclid: 'click_123' }),
    sendMeta: async ({ eventName, eventId, eventSourceUrl, userData }) => {
      events.push(`meta:${eventName}`)
      assert.match(eventId, /^lead_[A-Za-z0-9_-]{32}$/)
      assert.equal(eventSourceUrl, 'https://engisols.com/ai-app-audit')
      assert.equal(userData.email, validBody.email)
      assert.deepEqual(userData.identifiers, {
        fbp: 'fb.1.1725969600000.browser123',
        fbc: 'fb.1.1789430400000.click_123',
      })
      return { status: 'sent' }
    },
    send: async (message) => {
      events.push('resend')
      messages.push(message)
    },
    now: () => new Date('2026-09-15T00:00:00.000Z'),
  })

  const response = await handler(request(validBody))
  const body = await response.json() as {
    ok: boolean
    leadId: string
    notification: string
    metaEvents: { primary: string }
  }
  assert.equal(response.status, 200)
  assert.equal(body.ok, true)
  assert.match(body.leadId, /^audit_lead_[A-Za-z0-9_-]{24}$/)
  assert.equal(body.notification, 'sent')
  assert.match(body.metaEvents.primary, /^lead_[A-Za-z0-9_-]{32}$/)
  assert.deepEqual(events, ['persist', 'meta:Lead', 'resend'])
  assert.equal(messages.length, 1)
  assert.equal(messages[0]?.replyTo, validBody.email)
  assert.match(messages[0]?.subject ?? '', /app\.example\.com/)
  assert.equal(messages[0]?.idempotencyKey, `ai-app-audit/${body.leadId}`)
  assert.match(messages[0]?.text ?? '', new RegExp(`Lead ID: ${body.leadId}`))
  assert.match(messages[0]?.text ?? '', /Source: meta/)
  assert.deepEqual((await leads.get(body.leadId))?.attribution, {
    source: 'meta', campaign: 'audit-founders', fbclid: 'click_123',
  })
  assert.equal((await leads.get(body.leadId))?.notification.status, 'sent')
})

test('passes denied browser consent through the inquiry CAPI boundary', async () => {
  let receivedConsent: string | undefined
  const handler = createAuditInquiryPostHandler({
    leads: new MemoryAuditInquiryLeadStore(),
    verifyAttribution: () => ({}),
    sendMeta: async ({ consent }) => {
      receivedConsent = consent
      return { status: 'skipped' }
    },
    send: async () => undefined,
  })

  const response = await handler(request(validBody, 'https://engisols.com', {
    Cookie: '_fbp=fb.1.1725969600000.browser123; engisols_meta_consent=denied',
    'Sec-GPC': '1',
  }))

  assert.equal(response.status, 200)
  assert.equal(receivedConsent, 'denied')
})

test('reuses one durable lead, Meta event ID, and email on an identical retry', async () => {
  const leads = new MemoryAuditInquiryLeadStore()
  const metaEventIds: string[] = []
  let sends = 0
  const handler = createAuditInquiryPostHandler({
    leads,
    verifyAttribution: () => ({ source: 'meta' }),
    sendMeta: async ({ eventId }) => {
      metaEventIds.push(eventId)
      return { status: 'sent' }
    },
    send: async () => { sends += 1 },
  })

  const first = await handler(request(validBody))
  const retry = await handler(request(validBody))
  const firstBody = await first.json() as { leadId: string; metaEvents: { primary: string } }
  const retryBody = await retry.json() as { leadId: string; metaEvents: { primary: string } }
  assert.equal(first.status, 200)
  assert.equal(retry.status, 200)
  assert.equal(retryBody.leadId, firstBody.leadId)
  assert.equal(retryBody.metaEvents.primary, firstBody.metaEvents.primary)
  assert.deepEqual(metaEventIds, [firstBody.metaEvents.primary])
  assert.equal(sends, 1)
})

test('does not duplicate delivery while an identical request holds a fresh lease', async () => {
  const leads = new MemoryAuditInquiryLeadStore()
  let releaseSend: (() => void) | undefined
  let markSendStarted: (() => void) | undefined
  const sendStarted = new Promise<void>((resolve) => { markSendStarted = resolve })
  const sendGate = new Promise<void>((resolve) => { releaseSend = resolve })
  let sends = 0
  const handler = createAuditInquiryPostHandler({
    leads,
    verifyAttribution: () => ({}),
    sendMeta: async () => ({ status: 'sent' }),
    send: async () => {
      sends += 1
      markSendStarted?.()
      await sendGate
    },
    now: () => new Date('2026-09-15T00:00:00.000Z'),
  })

  const activeRequest = handler(request(validBody))
  await sendStarted
  const concurrentResponse = await handler(request(validBody))
  assert.equal(concurrentResponse.status, 202)
  assert.equal((await concurrentResponse.json() as { notification: string }).notification, 'delayed')
  assert.equal(sends, 1)

  releaseSend?.()
  assert.equal((await activeRequest).status, 200)
  assert.equal(sends, 1)
})

test('reclaims a stale pending delivery after its final-state save was lost', async () => {
  let current = new Date('2026-09-15T00:00:00.000Z')
  const baseStore = new MemoryAuditInquiryLeadStore(() => current)
  let loseNextSave = true
  const leads: AuditInquiryLeadStore = {
    createOrGet: (lead) => baseStore.createOrGet(lead),
    claimNotification: (...args) => baseStore.claimNotification(...args),
    save: async (lead) => {
      if (loseNextSave) {
        loseNextSave = false
        throw new Error('lost final-state save')
      }
      await baseStore.save(lead)
    },
    get: (id) => baseStore.get(id),
  }
  const idempotencyKeys: string[] = []
  const handler = createAuditInquiryPostHandler({
    leads,
    verifyAttribution: () => ({}),
    sendMeta: async () => ({ status: 'sent' }),
    send: async ({ idempotencyKey }) => { idempotencyKeys.push(idempotencyKey) },
    now: () => current,
  })

  const firstResponse = await handler(request(validBody))
  const firstBody = await firstResponse.json() as { leadId: string }
  assert.equal(firstResponse.status, 200)
  assert.equal((await leads.get(firstBody.leadId))?.notification.status, 'pending')

  current = new Date(current.getTime() + AUDIT_INQUIRY_NOTIFICATION_LEASE_MS - 1)
  assert.equal((await handler(request(validBody))).status, 202)
  assert.equal(idempotencyKeys.length, 1)

  current = new Date(current.getTime() + 1)
  assert.equal((await handler(request(validBody))).status, 200)
  assert.deepEqual(idempotencyKeys, [
    `ai-app-audit/${firstBody.leadId}`,
    `ai-app-audit/${firstBody.leadId}`,
  ])
  assert.equal((await leads.get(firstBody.leadId))?.notification.status, 'sent')
})

test('keeps a saved lead and conversion when email delivery is delayed', async () => {
  const leads = new MemoryAuditInquiryLeadStore()
  let metaSends = 0
  let emailAttempts = 0
  const idempotencyKeys: string[] = []
  const handler = createAuditInquiryPostHandler({
    leads,
    verifyAttribution: () => ({}),
    sendMeta: async () => { metaSends += 1; return { status: 'sent' } },
    send: async ({ idempotencyKey }) => {
      emailAttempts += 1
      idempotencyKeys.push(idempotencyKey)
      if (emailAttempts === 1) {
        throw new AuditInquiryEmailConfigurationError('private setup detail')
      }
    },
  })
  const response = await handler(request(validBody))
  const body = await response.json() as { leadId: string; notification: string; message: string }
  assert.equal(response.status, 202)
  assert.equal(body.notification, 'delayed')
  assert.match(body.message, /saved/i)
  assert.doesNotMatch(JSON.stringify(body), /private setup detail/)
  assert.equal((await leads.get(body.leadId))?.notification.status, 'failed')
  assert.equal(metaSends, 1)

  const retry = await handler(request(validBody))
  const retryBody = await retry.json() as { leadId: string; notification: string }
  assert.equal(retry.status, 200)
  assert.equal(retryBody.leadId, body.leadId)
  assert.equal(retryBody.notification, 'sent')
  assert.deepEqual(idempotencyKeys, [
    `ai-app-audit/${body.leadId}`,
    `ai-app-audit/${body.leadId}`,
  ])
  assert.equal((await leads.get(body.leadId))?.notification.status, 'sent')
  assert.equal(metaSends, 1)
})

test('never sends analytics or email when durable persistence fails', async () => {
  let metaSends = 0
  let emailSends = 0
  const leads: AuditInquiryLeadStore = {
    createOrGet: async () => { throw new Error('kv unavailable') },
    claimNotification: async () => null,
    save: async () => { throw new Error('kv unavailable') },
    get: async () => null,
  }
  const response = await createAuditInquiryPostHandler({
    leads,
    verifyAttribution: () => ({}),
    sendMeta: async () => { metaSends += 1; return { status: 'sent' } },
    send: async () => { emailSends += 1 },
  })(request(validBody))
  assert.equal(response.status, 503)
  assert.equal(metaSends, 0)
  assert.equal(emailSends, 0)
})

test('rejects malformed, tampered-attribution, and cross-origin submissions without side effects', async () => {
  let sends = 0
  const handler = createAuditInquiryPostHandler({
    leads: new MemoryAuditInquiryLeadStore(),
    verifyAttribution: () => null,
    send: async () => { sends += 1 },
  })
  assert.equal((await handler(request({ ...validBody, email: 'bad' }))).status, 400)
  assert.equal((await handler(request({ ...validBody, privileged: true }))).status, 400)
  assert.equal((await handler(request(validBody))).status, 400)
  assert.equal((await handler(request(validBody, 'https://attacker.example'))).status, 403)
  assert.equal(sends, 0)
})

test('silently accepts a honeypot submission without persistence or delivery', async () => {
  let saves = 0
  let sends = 0
  const leads: AuditInquiryLeadStore = {
    createOrGet: async (lead) => { saves += 1; return { lead, created: true } },
    claimNotification: async () => null,
    save: async () => { saves += 1 },
    get: async () => null,
  }
  const response = await createAuditInquiryPostHandler({
    leads,
    verifyAttribution: () => ({}),
    send: async () => { sends += 1 },
  })(request({ ...validBody, website: 'https://bot.example' }))
  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), { ok: true })
  assert.equal(saves, 0)
  assert.equal(sends, 0)
})
