import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

import { aiAppAuditPostHogProperties } from '../../src/campaign/analytics-properties'
import {
  protectPostHogEvent,
  sanitizePostHogUrl,
} from '../../src/production-check/analytics-privacy'

test('campaign PostHog properties retain funnel context and drop customer data', () => {
  const properties = aiAppAuditPostHogProperties({
    cta_location: 'hero',
    notification: 'sent',
    http_status: 200,
    name: 'Ada Founder',
    email: 'ada@example.com',
    app: 'https://private.example',
    worry: 'private concern',
    attributionToken: 'signed-secret',
    metaEventId: 'lead_abcdefghijklmnopqrstuvwxyzABCDEF',
  })
  assert.deepEqual(properties, {
    cta_location: 'hero',
    notification: 'sent',
    http_status: 200,
  })
})

test('autocapture masks text while replay preserves UI structure and masks input values', () => {
  const booking = readFileSync('components/campaign/Booking.tsx', 'utf8')
  const instrumentation = readFileSync('instrumentation-client.ts', 'utf8')
  assert.doesNotMatch(booking, /ph-no-capture/)
  assert.match(instrumentation, /mask_all_text:\s*true/)
  assert.match(instrumentation, /capture_copied_text:\s*false/)
  assert.match(instrumentation, /session_recording:\s*{\s*maskAllInputs:\s*true/)
})

test('delayed delivery remains retryable with retained form values', () => {
  const booking = readFileSync('components/campaign/Booking.tsx', 'utf8')
  assert.match(booking, /onClick=\{\(\) => void sendInquiry\('retry'\)\}/)
  assert.match(booking, /RETRY NOTIFICATION/)
  assert.match(booking, /body: JSON\.stringify\(\{ \.\.\.values, website, attributionToken \}\)/)
})

test('honeypot acknowledgements bypass browser analytics', () => {
  const booking = readFileSync('components/campaign/Booking.tsx', 'utf8')
  assert.match(booking, /attempt === 'initial' && !website/)
  assert.match(booking, /if \(result\.kind === 'generic'\)[\s\S]*setState\('acknowledged'\)[\s\S]*return/)
})

test('AI App Audit URLs drop query parameters and fragments at the PostHog boundary', () => {
  assert.equal(
    sanitizePostHogUrl(
      'https://www.engisols.com/ai-app-audit?utm_source=meta&email=private%40example.com#form',
    ),
    'https://www.engisols.com/ai-app-audit',
  )
  assert.equal(
    sanitizePostHogUrl('/ai-app-audit/?utm_campaign=private#booking'),
    '/ai-app-audit/',
  )
})

test('PostHog recursively sanitizes AI App Audit URL properties without changing safe URLs', () => {
  const safeUrl = 'https://www.engisols.com/services?category=ai#details'
  const dirtyUrl = 'https://www.engisols.com/ai-app-audit?email=private%40example.com#form'
  const event = protectPostHogEvent(
    {
      uuid: 'event-uuid',
      event: 'ai_audit_inquiry_opened',
      properties: {
        $current_url: dirtyUrl,
        $pathname: '/ai-app-audit',
        nested: {
          destination: dirtyUrl,
          safe: safeUrl,
        },
      },
      $set: { last_campaign_url: dirtyUrl },
      $set_once: { first_safe_url: safeUrl },
    },
    dirtyUrl,
  )

  assert.ok(event)
  assert.equal(event.properties.$current_url, 'https://www.engisols.com/ai-app-audit')
  assert.deepEqual(event.properties.nested, {
    destination: 'https://www.engisols.com/ai-app-audit',
    safe: safeUrl,
  })
  assert.deepEqual(event.$set, {
    last_campaign_url: 'https://www.engisols.com/ai-app-audit',
  })
  assert.deepEqual(event.$set_once, { first_safe_url: safeUrl })
  assert.equal(sanitizePostHogUrl(safeUrl), safeUrl)
})
