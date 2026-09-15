import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import test, { afterEach } from 'node:test'

import { GET as metaNoscriptPageView } from '../../app/api/meta/page-view/route'
import {
  buildMetaCapiPayload,
  hashEmail,
  normalizeEmail,
  sendMetaConversion,
  type MetaConversionEvent,
} from '../../src/meta/capi.server'
import {
  bridgeAiAppAuditEvent,
  bridgeProductionCheckEvent,
  metaPageViewKey,
  metaPixel,
  resetMetaBrowserStateForTests,
} from '../../src/meta/browser'
import { resolveMetaConsent } from '../../src/meta/consent'
import { createMetaEventId } from '../../src/meta/event-id.server'
import {
  deriveFbc,
  normalizeMetaCookie,
  parseMetaIdentifiers,
} from '../../src/meta/identifiers'
import { clientIpFromHeaders, metaRequestContext } from '../../src/meta/request.server'

const pixelId = '1707563313639134'

afterEach(() => {
  resetMetaBrowserStateForTests()
  Reflect.deleteProperty(globalThis, 'window')
  Reflect.deleteProperty(globalThis, 'document')
  Reflect.deleteProperty(globalThis, 'navigator')
})

test('normalizes email exactly as Meta hashing expects', () => {
  assert.equal(normalizeEmail('  ADA@Example.COM  '), 'ada@example.com')
})

test('hashes normalized email with SHA-256', () => {
  const expected = createHash('sha256').update('ada@example.com').digest('hex')
  assert.equal(hashEmail(' ADA@EXAMPLE.COM '), expected)
})

test('does not double-hash an existing SHA-256 value', () => {
  const existing = 'A'.repeat(64)
  assert.equal(hashEmail(existing), existing.toLowerCase())
})

test('builds only the allowlisted CAPI payload fields', () => {
  const event = leadEvent() as MetaConversionEvent & Record<string, unknown>
  event.scannerResult = { finding: 'do not send' }
  Object.assign(event.userData, {
    builder: 'lovable',
    appUrl: 'https://customer.example/private',
    shippingContext: 'secret context',
  })
  const payload = buildMetaCapiPayload(event)
  const serialized = JSON.stringify(payload)
  assert.deepEqual(Object.keys(payload?.data[0] ?? {}).sort(), [
    'action_source',
    'event_id',
    'event_name',
    'event_source_url',
    'event_time',
    'user_data',
  ])
  assert.doesNotMatch(serialized, /finding|lovable|customer\.example|secret context/)
  assert.doesNotMatch(serialized, /ada@example\.com/)
})

test('keeps the CAPI token out of client tracking sources', () => {
  const browserSource = readFileSync('src/meta/browser.ts', 'utf8')
  const componentSource = readFileSync('components/meta/MetaPixel.tsx', 'utf8')
  assert.doesNotMatch(`${browserSource}${componentSource}`, /META_CONVERSIONS_API_TOKEN/)
})

test('includes test_event_code outside production only', () => {
  assert.equal(
    buildMetaCapiPayload(leadEvent(), {
      environment: 'test',
      testEventCode: 'TEST123',
    })?.test_event_code,
    'TEST123',
  )
  assert.equal(
    buildMetaCapiPayload(leadEvent(), {
      environment: 'production',
      testEventCode: 'TEST123',
    })?.test_event_code,
    undefined,
  )
})

test('missing configuration and denied consent safely skip CAPI', async () => {
  assert.deepEqual(
    await sendMetaConversion(leadEvent(), { env: { NODE_ENV: 'test' } }),
    { status: 'skipped', reason: 'not_configured' },
  )
  assert.deepEqual(
    await sendMetaConversion({ ...leadEvent(), consent: 'denied' }, {
      env: {
        NODE_ENV: 'test',
        META_DATASET_ID: pixelId,
        META_CONVERSIONS_API_TOKEN: 'private-token',
      },
    }),
    { status: 'skipped', reason: 'consent_denied' },
  )
})

test('CAPI network failure resolves safely and logs no customer data', async () => {
  const logs: Array<{ message: string; fields: Readonly<Record<string, string | number>> }> = []
  const result = await sendMetaConversion(leadEvent(), {
    env: {
      NODE_ENV: 'test',
      META_DATASET_ID: pixelId,
      META_CONVERSIONS_API_TOKEN: 'private-token',
    },
    fetch: async () => new Response(JSON.stringify({ error: { fbtrace_id: 'trace_123' } }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    }),
    log: (message, fields) => logs.push({ message, fields }),
  })
  assert.deepEqual(result, { status: 'failed', httpStatus: 500, traceId: 'trace_123' })
  assert.doesNotMatch(JSON.stringify(logs), /private-token|ada@example\.com|_fbp|cookie/i)
})

test('posts the allowlisted payload to the current dataset endpoint with token outside the body', async () => {
  let requestedUrl = ''
  let requestedBody = ''
  const result = await sendMetaConversion(leadEvent(), {
    env: {
      NODE_ENV: 'development',
      META_DATASET_ID: pixelId,
      META_CONVERSIONS_API_TOKEN: 'private-token',
      META_TEST_EVENT_CODE: 'TEST123',
    },
    fetch: async (input, init) => {
      requestedUrl = String(input)
      requestedBody = String(init?.body)
      return Response.json({ events_received: 1, fbtrace_id: 'trace_123' })
    },
    log: () => undefined,
  })
  const url = new URL(requestedUrl)
  assert.equal(url.pathname, `/v26.0/${pixelId}/events`)
  assert.equal(url.searchParams.get('access_token'), 'private-token')
  assert.doesNotMatch(requestedBody, /private-token/)
  assert.equal(JSON.parse(requestedBody).test_event_code, 'TEST123')
  assert.deepEqual(result, { status: 'sent', httpStatus: 200, traceId: 'trace_123' })
})

test('captures valid fbp and fbc cookies without preserving unrelated cookies', () => {
  assert.deepEqual(
    parseMetaIdentifiers('_fbp=fb.1.1725969600000.browser123; session=private; _fbc=fb.1.1725969600000.click_123'),
    {
      fbp: 'fb.1.1725969600000.browser123',
      fbc: 'fb.1.1725969600000.click_123',
    },
  )
})

test('derives fbc only from a valid fbclid using Meta format', () => {
  assert.equal(
    deriveFbc('IwZXh0bgNhZW0-test_123', new Date('2026-09-10T10:00:00.000Z')),
    'fb.1.1789034400000.IwZXh0bgNhZW0-test_123',
  )
  assert.equal(deriveFbc('bad click id', new Date()), undefined)
  assert.equal(deriveFbc(undefined, new Date()), undefined)
})

test('rejects malformed Meta identifiers and invalid forwarded IPs', () => {
  assert.equal(normalizeMetaCookie('fb.not-a-cookie'), undefined)
  assert.deepEqual(parseMetaIdentifiers('_fbp=javascript%3Aalert(1); _fbc=too-short'), {})
  assert.equal(clientIpFromHeaders(new Headers({ 'x-forwarded-for': 'not-an-ip' })), undefined)
})

test('request context preserves fbp and derives fbc from persisted fbclid', () => {
  const request = new Request('https://engisols.com/api/scans', {
    headers: {
      cookie: '_fbp=fb.1.1725969600000.browser123',
      'user-agent': 'Test Browser',
      'x-forwarded-for': '203.0.113.4, 10.0.0.1',
    },
  })
  const context = metaRequestContext(request, {
    fbclid: 'click_123',
    receivedAt: new Date('2026-09-10T10:00:00.000Z'),
  })
  assert.deepEqual(context, {
    consent: 'granted',
    identifiers: {
      fbp: 'fb.1.1725969600000.browser123',
      fbc: 'fb.1.1789034400000.click_123',
    },
    clientIp: '203.0.113.4',
    clientUserAgent: 'Test Browser',
  })
})

test('Global Privacy Control and explicit denial use the same consent decision', () => {
  assert.equal(resolveMetaConsent({ cookieHeader: 'engisols_meta_consent=denied' }), 'denied')
  assert.equal(resolveMetaConsent({ globalPrivacyControl: true }), 'denied')
  assert.equal(resolveMetaConsent({}), 'granted')
})

test('noscript fallback uses the configured Pixel ID and respects denial', () => {
  const previous = process.env.NEXT_PUBLIC_META_PIXEL_ID
  process.env.NEXT_PUBLIC_META_PIXEL_ID = pixelId
  try {
    const denied = metaNoscriptPageView(new Request('https://engisols.com/api/meta/page-view', {
      headers: { cookie: 'engisols_meta_consent=denied' },
    }))
    const granted = metaNoscriptPageView(new Request('https://engisols.com/api/meta/page-view'))
    const offerRoute = metaNoscriptPageView(new Request('https://engisols.com/api/meta/page-view', {
      headers: { referer: 'https://engisols.com/production-check/offer/offer_abcdefghijklmnopqrstuvwx' },
    }))
    const internalRoute = metaNoscriptPageView(new Request('https://engisols.com/api/meta/page-view', {
      headers: { referer: 'https://engisols.com/internal/production-check/review/operator_token' },
    }))
    const reportRoute = metaNoscriptPageView(new Request('https://engisols.com/api/meta/page-view', {
      headers: { referer: 'https://engisols.com/production-check/report/rpt_abcdefghijklmnopqrstuvwx' },
    }))
    const activeScanRoute = metaNoscriptPageView(new Request('https://engisols.com/api/meta/page-view', {
      headers: { referer: 'https://engisols.com/production-check?scanId=rpt_abcdefghijklmnopqrstuvwx' },
    }))
    assert.equal(denied.status, 204)
    assert.equal(granted.status, 307)
    assert.equal(offerRoute.status, 204)
    assert.equal(internalRoute.status, 204)
    assert.equal(reportRoute.status, 204)
    assert.equal(activeScanRoute.status, 204)
    assert.equal(new URL(granted.headers.get('location') ?? '').searchParams.get('id'), pixelId)
  } finally {
    if (previous === undefined) delete process.env.NEXT_PUBLIC_META_PIXEL_ID
    else process.env.NEXT_PUBLIC_META_PIXEL_ID = previous
  }
})

test('PageView uses pathname semantics and never duplicates on rerender or query replacement', () => {
  const calls = installBrowser()
  assert.equal(metaPixel.init(pixelId), true)
  assert.equal(metaPixel.pageView('/'), true)
  assert.equal(metaPixel.pageView('/'), false)
  assert.equal(metaPixel.pageView('/?render=2'), false)
  assert.equal(metaPixel.pageView('/ai-app-audit'), true)
  assert.equal(metaPixel.pageView('/production-check?scanId=abc'), false)
  assert.equal(metaPixel.pageView('/production-check'), true)
  assert.equal(metaPixel.pageView('/production-check/report/rpt_abc'), false)
  assert.equal(metaPixel.pageView('/production-check/offer/offer_abcdefghijklmnopqrstuvwx'), false)
  assert.equal(metaPixel.pageView('https://engisols.com/production-check/offer/offer_zyxwvutsrqponmlkjihgfedc'), false)
  assert.equal(metaPixel.pageView('/internal/production-check/review/operator_token'), false)
  assert.equal(calls.filter(([command, event]) => command === 'track' && event === 'PageView').length, 3)
  assert.equal(metaPageViewKey('/ai-app-audit?utm_source=meta'), '/ai-app-audit')
})

test('production-check bridge allowlists events and sends each business event ID once', () => {
  const calls = installBrowser()
  metaPixel.init(pixelId)
  const startedId = createMetaEventId('ScanStarted', 'rpt_abcdefghijklmnopqrstuvwx')
  const completedId = createMetaEventId('ScanCompleted', 'rpt_abcdefghijklmnopqrstuvwx')
  const leadId = createMetaEventId('Lead', 'lead_abcdefghijklmnopqrstuvwx')
  assert.equal(bridgeProductionCheckEvent({ event: 'scan_started', metaEventId: startedId }), true)
  assert.equal(bridgeProductionCheckEvent({ event: 'scan_started', metaEventId: startedId }), false)
  assert.equal(bridgeProductionCheckEvent({ event: 'scan_completed', metaEventId: completedId }), true)
  assert.equal(bridgeProductionCheckEvent({ event: 'scan_completed', metaEventId: completedId }), false)
  assert.equal(bridgeProductionCheckEvent({ event: 'lead_created', metaEventId: leadId }), true)
  assert.equal(bridgeProductionCheckEvent({ event: 'finding_selected', metaEventId: startedId }), false)
  assert.equal(calls.filter(([command]) => command === 'trackCustom').length, 2)
  const browserLead = calls.find(([command, eventName]) => command === 'track' && eventName === 'Lead')
  assert.deepEqual(browserLead?.[3], { eventID: leadId })
})

test('AI app audit bridge sends one Lead for sent or delayed durable inquiries only', () => {
  const calls = installBrowser()
  const sentId = createMetaEventId('Lead', 'audit_lead_abcdefghijklmnopqrstuvwx')
  const delayedId = createMetaEventId('Lead', 'audit_lead_zyxwvutsrqponmlkjihgfedc')
  assert.equal(bridgeAiAppAuditEvent({ event: 'inquiry_sent', metaEventId: sentId }), true)
  assert.equal(bridgeAiAppAuditEvent({ event: 'inquiry_sent', metaEventId: sentId }), false)
  assert.equal(bridgeAiAppAuditEvent({ event: 'inquiry_delayed', metaEventId: delayedId }), true)
  assert.equal(bridgeAiAppAuditEvent({ event: 'inquiry_opened', metaEventId: delayedId }), false)
  assert.equal(calls.filter(([command, event]) => command === 'track' && event === 'Lead').length, 2)
})

test('business event IDs are stable, high entropy, and distinct by event name', () => {
  const durableId = 'lead_abcdefghijklmnopqrstuvwx'
  const lead = createMetaEventId('Lead', durableId)
  const retry = createMetaEventId('Lead', durableId)
  const qualified = createMetaEventId('QualifiedLead', durableId)
  assert.equal(lead, retry)
  assert.match(lead, /^lead_[A-Za-z0-9_-]{32}$/)
  assert.match(qualified, /^ql_[A-Za-z0-9_-]{32}$/)
  assert.notEqual(lead, qualified)
})

function leadEvent(): MetaConversionEvent {
  return {
    eventName: 'Lead',
    eventId: createMetaEventId('Lead', 'lead_abcdefghijklmnopqrstuvwx'),
    eventTime: new Date('2026-09-10T10:00:00.000Z'),
    eventSourceUrl: 'https://engisols.com/production-check',
    actionSource: 'website',
    consent: 'granted',
    userData: {
      email: 'Ada@Example.com',
      clientIp: '203.0.113.4',
      clientUserAgent: 'Test Browser',
      identifiers: {
        fbp: 'fb.1.1725969600000.browser123',
        fbc: 'fb.1.1725969600000.click_123',
      },
    },
  }
}

function installBrowser(): unknown[][] {
  const storage = new Map<string, string>()
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: {
      localStorage: {
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: (key: string, value: string) => storage.set(key, value),
      },
    },
  })
  Object.defineProperty(globalThis, 'document', {
    configurable: true,
    value: { cookie: '' },
  })
  Object.defineProperty(globalThis, 'navigator', {
    configurable: true,
    value: {},
  })
  metaPixel.init(pixelId)
  return (window.fbq?.queue ?? []) as unknown[][]
}
