import assert from 'node:assert/strict'
import test from 'node:test'

import { createReviewRequestPostHandler } from '../../app/api/production-check/review/route'
import {
  ReviewEmailConfigurationError,
  ReviewEmailDeliveryError,
  type ReviewEmailMessage,
} from '../../src/production-check/review-email'
import { MemoryLeadStore } from '../../src/production-check/store'
import type { LeadStore, PersistedScan, ProductionCheckLead } from '../../src/production-check/types'
import { finding, scanResult } from './fixtures'

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
    attribution: { source: 'meta', campaign: 'paid-launch', content: 'proof-a' },
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
  const leads = new MemoryLeadStore()
  const handler = createReviewRequestPostHandler({
    load: async () => completedScan(),
    leads,
    send: async (message) => { messages.push(message) },
  })

  const response = await handler(request(validBody))
  assert.equal(response.status, 200)
  const body = await response.json() as {
    ok: boolean
    requestId: string
    nextStep: string
    notification: string
  }
  assert.equal(body.ok, true)
  assert.match(body.requestId, /^lead_[A-Za-z0-9_-]{24}$/)
  assert.equal(body.nextStep, 'senior_engineer_review')
  assert.equal(body.notification, 'sent')
  assert.equal(messages.length, 1)
  assert.equal(messages[0]?.replyTo, validBody.email)
  assert.match(messages[0]?.text ?? '', /Report: https:\/\/engisols\.com\/production-check\/report\//)
  assert.match(messages[0]?.text ?? '', /Builder: lovable/)
  assert.match(messages[0]?.text ?? '', /Lead ID: lead_/)
  assert.match(messages[0]?.text ?? '', /Score: 6/)
  assert.match(messages[0]?.text ?? '', /Segment: qualified/)
  assert.match(messages[0]?.text ?? '', /Source: meta/)
  assert.match(messages[0]?.idempotencyKey ?? '', /^production-check\/lead_[A-Za-z0-9_-]{24}$/)
  const lead = await leads.get(body.requestId)
  assert.deepEqual(lead?.attribution, completedScan().attribution)
  assert.equal(lead?.notification.status, 'sent')
})

test('persists the lead before attempting Resend', async () => {
  const events: string[] = []
  let persisted: ProductionCheckLead | undefined
  const leads: LeadStore = {
    createOrGet: async (lead) => {
      events.push(`save:${lead.notification.status}`)
      persisted = structuredClone(lead)
      return { lead: structuredClone(lead), created: true }
    },
    claimFailedNotification: async () => null,
    save: async (lead) => {
      events.push(`save:${lead.notification.status}`)
      persisted = structuredClone(lead)
    },
    get: async () => persisted ?? null,
  }
  const handler = createReviewRequestPostHandler({
    load: async () => completedScan(),
    leads,
    send: async () => { events.push('send') },
  })
  await handler(request(validBody))
  assert.deepEqual(events.slice(0, 2), ['save:pending', 'send'])
})

test('attempts Meta only after durable persistence and before Resend', async () => {
  const events: string[] = []
  const leads = new MemoryLeadStore()
  const handler = createReviewRequestPostHandler({
    load: async () => completedScan(),
    leads: {
      createOrGet: async (lead) => {
        events.push('persist')
        return leads.createOrGet(lead)
      },
      claimFailedNotification: (...args) => leads.claimFailedNotification(...args),
      save: (lead) => leads.save(lead),
      get: (id) => leads.get(id),
    },
    sendMeta: async ({ eventName }) => {
      events.push(`meta:${eventName}`)
      return { status: 'sent' }
    },
    send: async () => { events.push('resend') },
  })

  const response = await handler(request(validBody))
  assert.equal(response.status, 200)
  assert.deepEqual(events, ['persist', 'meta:Lead', 'meta:QualifiedLead', 'resend'])
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

test('keeps the saved lead when Resend is unavailable', async () => {
  const leads = new MemoryLeadStore()
  const handler = createReviewRequestPostHandler({
    load: async () => completedScan(),
    leads,
    send: async () => { throw new ReviewEmailConfigurationError('private setup detail') },
  })
  const response = await handler(request(validBody))
  const body = await response.json() as { requestId: string; notification: string; message: string }
  const serialized = JSON.stringify(body)
  assert.equal(response.status, 202)
  assert.equal(body.notification, 'delayed')
  assert.match(body.message, /saved/i)
  assert.doesNotMatch(serialized, /private setup detail/)
  assert.equal((await leads.get(body.requestId))?.notification.status, 'failed')
})

test('does not lose the lead when Resend rejects delivery', async () => {
  const leads = new MemoryLeadStore()
  const handler = createReviewRequestPostHandler({
    load: async () => completedScan(),
    leads,
    send: async () => { throw new ReviewEmailDeliveryError('provider detail') },
  })
  const response = await handler(request(validBody))
  const body = await response.json() as { requestId: string }
  assert.equal(response.status, 202)
  assert.ok(await leads.get(body.requestId))
})

test('never sends when durable lead persistence fails', async () => {
  let sends = 0
  let metaSends = 0
  const leads: LeadStore = {
    createOrGet: async () => { throw new Error('kv unavailable') },
    claimFailedNotification: async () => null,
    save: async () => { throw new Error('kv unavailable') },
    get: async () => null,
  }
  const handler = createReviewRequestPostHandler({
    load: async () => completedScan(),
    leads,
    send: async () => { sends += 1 },
    sendMeta: async () => { metaSends += 1; return { status: 'sent' } },
  })
  const response = await handler(request(validBody))
  assert.equal(response.status, 503)
  assert.equal(sends, 0)
  assert.equal(metaSends, 0)
})

test('sends QualifiedLead only for the qualified segment', async () => {
  async function metaEventsFor(scan: PersistedScan, body: typeof validBody) {
    const names: string[] = []
    await createReviewRequestPostHandler({
      load: async () => scan,
      leads: new MemoryLeadStore(),
      sendMeta: async ({ eventName }) => {
        names.push(eventName)
        return { status: 'sent' }
      },
      send: async () => undefined,
    })(request(body))
    return names
  }

  const nurture = await metaEventsFor(completedScan({
    result: { ...scanResult(), target: { requestedUrl: 'https://demo.vercel.app/', finalUrl: 'https://demo.vercel.app/', httpStatus: 200 } },
    answers: { launchStage: 'experimenting' },
  }), { ...validBody, timeline: 'exploring' })
  const maybe = await metaEventsFor(completedScan({
    result: scanResult([finding({ ruleId: 'credential.public', classification: 'actually_bad' })]),
    answers: { launchStage: 'experimenting' },
  }), { ...validBody, timeline: 'exploring' })
  const qualified = await metaEventsFor(completedScan(), validBody)

  assert.deepEqual(nurture, ['Lead'])
  assert.deepEqual(maybe, ['Lead'])
  assert.deepEqual(qualified, ['Lead', 'QualifiedLead'])
})

test('browser response and server Lead reuse the same event ID across retries', async () => {
  const leads = new MemoryLeadStore()
  const serverIds: string[] = []
  const handler = createReviewRequestPostHandler({
    load: async () => completedScan(),
    leads,
    sendMeta: async ({ eventName, eventId }) => {
      if (eventName === 'Lead') serverIds.push(eventId)
      return { status: 'sent' }
    },
    send: async () => undefined,
  })
  const first = await handler(request(validBody))
  const second = await handler(request(validBody))
  const firstBody = await first.json() as { metaEvents: { primary: string } }
  const secondBody = await second.json() as { metaEvents: { primary: string } }

  assert.equal(serverIds.length, 1)
  assert.equal(firstBody.metaEvents.primary, serverIds[0])
  assert.equal(secondBody.metaEvents.primary, serverIds[0])
})

test('Meta failure keeps one durable lead and does not prevent Resend', async () => {
  const leads = new MemoryLeadStore()
  let metaAttempts = 0
  let resendAttempts = 0
  const handler = createReviewRequestPostHandler({
    load: async () => completedScan(),
    leads,
    sendMeta: async () => {
      metaAttempts += 1
      throw new Error('Meta unavailable')
    },
    send: async () => { resendAttempts += 1 },
  })
  const first = await handler(request(validBody))
  const firstBody = await first.json() as { requestId: string }
  const retry = await handler(request(validBody))
  const retryBody = await retry.json() as { requestId: string }

  assert.equal(first.status, 200)
  assert.equal(retry.status, 200)
  assert.equal(firstBody.requestId, retryBody.requestId)
  assert.ok(await leads.get(firstBody.requestId))
  assert.equal(metaAttempts, 2)
  assert.equal(resendAttempts, 1)
})

test('rejects credential-like shipping context before lead persistence', async () => {
  let saves = 0
  const leads: LeadStore = {
    createOrGet: async (lead) => {
      saves += 1
      return { lead, created: true }
    },
    claimFailedNotification: async () => null,
    save: async () => { saves += 1 },
    get: async () => null,
  }
  const handler = createReviewRequestPostHandler({
    load: async () => completedScan(),
    leads,
    send: async () => undefined,
  })
  const response = await handler(request({
    ...validBody,
    context: `Deploy with ${'sk_live_' + 'A'.repeat(24)}`,
  }))
  assert.equal(response.status, 400)
  assert.equal(saves, 0)
})

test('reuses a sent lead and notification idempotency key on an identical retry', async () => {
  const leads = new MemoryLeadStore()
  const messages: ReviewEmailMessage[] = []
  const handler = createReviewRequestPostHandler({
    load: async () => completedScan(),
    leads,
    send: async (message) => { messages.push(message) },
  })

  const first = await handler(request(validBody))
  const second = await handler(request({ ...validBody }))
  const firstBody = await first.json() as { requestId: string; notification: string }
  const secondBody = await second.json() as { requestId: string; notification: string }

  assert.equal(first.status, 200)
  assert.equal(second.status, 200)
  assert.equal(firstBody.requestId, secondBody.requestId)
  assert.equal(secondBody.notification, 'sent')
  assert.equal(messages.length, 1)
})

test('atomically reuses a pending lead during concurrent identical submissions', async () => {
  const leads = new MemoryLeadStore()
  let releaseSend: (() => void) | undefined
  const sendGate = new Promise<void>((resolve) => { releaseSend = resolve })
  let sends = 0
  const handler = createReviewRequestPostHandler({
    load: async () => completedScan(),
    leads,
    send: async () => {
      sends += 1
      await sendGate
    },
  })

  const firstResponse = handler(request(validBody))
  await Promise.resolve()
  const second = await handler(request(validBody))
  const secondBody = await second.json() as { requestId: string; notification: string }
  releaseSend?.()
  const first = await firstResponse
  const firstBody = await first.json() as { requestId: string }

  assert.equal(first.status, 200)
  assert.equal(second.status, 202)
  assert.equal(firstBody.requestId, secondBody.requestId)
  assert.equal(secondBody.notification, 'delayed')
  assert.equal(sends, 1)
})

test('returns public next steps without exposing internal segment labels', async () => {
  async function nextStepFor(scan: PersistedScan, body: typeof validBody) {
    const response = await createReviewRequestPostHandler({
      load: async () => scan,
      leads: new MemoryLeadStore(),
      send: async () => undefined,
    })(request(body))
    return JSON.stringify(await response.json())
  }

  const nurture = await nextStepFor(completedScan({
    result: { ...scanResult(), target: { requestedUrl: 'https://demo.vercel.app/', finalUrl: 'https://demo.vercel.app/', httpStatus: 200 } },
    answers: { launchStage: 'experimenting' },
  }), { ...validBody, timeline: 'exploring' })
  const maybe = await nextStepFor(completedScan({
    result: scanResult([finding({ ruleId: 'credential.public', classification: 'actually_bad' })]),
    answers: { launchStage: 'experimenting' },
  }), { ...validBody, timeline: 'exploring' })
  const qualified = await nextStepFor(completedScan(), validBody)

  assert.match(nurture, /report_guidance/)
  assert.match(maybe, /launch_blocker_fix/)
  assert.match(qualified, /senior_engineer_review/)
  assert.doesNotMatch(`${nurture}${maybe}${qualified}`, /"segment"|nurture|qualified/)
})
