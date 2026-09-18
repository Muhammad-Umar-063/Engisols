import assert from 'node:assert/strict'
import test from 'node:test'

import {
  POSTHOG_FUNNEL_COMPATIBILITY,
  PRODUCTION_CHECK_CANONICAL_FUNNEL,
  stablePostHogInsertId,
  nextPostHogCaptureLedger,
} from '../../src/production-check/analytics'
import { productionCheckPostHogProperties } from '../../src/production-check/analytics-properties'
import {
  attributionFromSearchParams,
  isControlledQaAttribution,
  parseAttributionInput,
  toPostHogAttributionProperties,
} from '../../src/production-check/attribution'
import { captureProductionCheckServerEvent } from '../../src/production-check/posthog.server'

test('declares the evidenced canonical funnel and legacy offer compatibility', () => {
  assert.deepEqual(PRODUCTION_CHECK_CANONICAL_FUNNEL, [
    'landing viewed',
    'scan_started',
    'scan_completed',
    'report_viewed',
    'scope_review_requested',
    'lead_created',
    'lead_qualified',
    'offer_sent',
    'offer_accepted',
  ])
  assert.deepEqual(POSTHOG_FUNNEL_COMPATIBILITY, {
    offer_sent: ['scope_offer_viewed'],
    offer_accepted: ['scope_offer_approved'],
    offer_declined: ['scope_offer_declined'],
  })
})

test('allows requested safe analytical and attribution properties but excludes capabilities and PII', () => {
  const properties = productionCheckPostHogProperties({
    scan_id: 'scan_v1_abcdefghijklmnopqrstuvwxyz0123456789ABCDEFG',
    lead_id: 'lead_abcdefghijklmnopqrstuvwx',
    scope_review_id: 'scope_abcdefghijklmnopqrstuvwx',
    offer_id: 'offer_v1_abcdefghijklmnopqrstuvwxyz0123456789ABCDEFG',
    utm_source: 'meta',
    utm_medium: 'paid-social',
    utm_campaign: 'growth',
    utm_content: 'founders',
    utm_term: 'ai-app',
    meta_campaign_id: '12001',
    meta_adset_id: '12002',
    meta_ad_id: '12003',
    meta_placement: 'instagram_story',
    meta_source: 'ig',
    builder: 'lovable',
    launch_stage: 'taking_payments',
    lead_segment: 'qualified',
    offer_type: 'launch_blocker_fix',
    offer_amount: 49900,
    currency: 'USD',
    reportId: 'rpt_capability-do-not-send',
    scan_id_spoof: 'rpt_capability-do-not-send',
    metaEventId: 'meta-provider-id-do-not-send',
    email: 'founder@example.com',
  })

  assert.deepEqual(properties, {
    scan_id: 'scan_v1_abcdefghijklmnopqrstuvwxyz0123456789ABCDEFG',
    lead_id: 'lead_abcdefghijklmnopqrstuvwx',
    scope_review_id: 'scope_abcdefghijklmnopqrstuvwx',
    offer_id: 'offer_v1_abcdefghijklmnopqrstuvwxyz0123456789ABCDEFG',
    utm_source: 'meta',
    utm_medium: 'paid-social',
    utm_campaign: 'growth',
    utm_content: 'founders',
    utm_term: 'ai-app',
    meta_campaign_id: '12001',
    meta_adset_id: '12002',
    meta_ad_id: '12003',
    meta_placement: 'instagram_story',
    meta_source: 'ig',
    builder: 'lovable',
    launch_stage: 'taking_payments',
    lead_segment: 'qualified',
    offer_type: 'launch_blocker_fix',
    offer_amount: 49900,
    currency: 'USD',
  })
  assert.doesNotMatch(JSON.stringify(properties), /rpt_capability|founder@|meta-provider/)
})

test('rejects capability and PII values even when supplied under allowlisted keys', () => {
  assert.deepEqual(productionCheckPostHogProperties({
    scan_id: 'rpt_abcdefghijklmnopqrstuvwx',
    offer_id: 'offer_abcdefghijklmnopqrstuvwx',
    utm_campaign: 'founder@example.com',
    utm_content: 'https://customer.example/private',
    meta_ad_id: 'not-a-meta-id',
  }), {})
})

test('captures and maps the full first-touch Meta hierarchy', () => {
  const attribution = attributionFromSearchParams(new URLSearchParams({
    utm_source: 'meta',
    utm_medium: 'paid-social',
    utm_campaign: 'growth',
    utm_content: 'founders',
    utm_term: 'ai-app',
    meta_campaign_id: '12001',
    meta_adset_id: '12002',
    meta_ad_id: '12003',
    meta_placement: 'instagram_story',
    meta_source: 'ig',
  }))
  assert.deepEqual(toPostHogAttributionProperties(attribution), {
    utm_source: 'meta',
    utm_medium: 'paid-social',
    utm_campaign: 'growth',
    utm_content: 'founders',
    utm_term: 'ai-app',
    meta_campaign_id: '12001',
    meta_adset_id: '12002',
    meta_ad_id: '12003',
    meta_placement: 'instagram_story',
    meta_source: 'ig',
  })
})

test('rejects control, oversized, credential-shaped, and unknown attribution fields', () => {
  assert.equal(parseAttributionInput({ source: 'meta\nspoofed' }), null)
  assert.equal(parseAttributionInput({ metaAdId: 'x'.repeat(201) }), null)
  assert.equal(parseAttributionInput({ metaAdId: `ghp_${'A1b2'.repeat(12)}` }), null)
  assert.equal(parseAttributionInput({ metaAdId: 'not-a-meta-id' }), null)
  assert.equal(parseAttributionInput({ metaAdName: 'not-allowed' }), null)
})

test('controlled meta_test traffic is excluded from Meta conversion delivery', () => {
  assert.equal(isControlledQaAttribution({ source: 'meta_test' }), true)
  assert.equal(isControlledQaAttribution({ source: 'META_TEST' }), true)
  assert.equal(isControlledQaAttribution({ source: 'meta' }), false)
})

test('stable insert IDs are deterministic and reject capability subjects', () => {
  assert.equal(
    stablePostHogInsertId('landing viewed', 'landing-session-safe'),
    'production-check/v1/landing_viewed/landing-session-safe',
  )
  assert.equal(
    stablePostHogInsertId('report_viewed', 'scan_v1_safe-analytical-id'),
    stablePostHogInsertId('report_viewed', 'scan_v1_safe-analytical-id'),
  )
  assert.notEqual(
    stablePostHogInsertId('report_viewed', 'scan_v1_safe-analytical-id'),
    stablePostHogInsertId('scan_completed', 'scan_v1_safe-analytical-id'),
  )
  assert.throws(
    () => stablePostHogInsertId('report_viewed', 'rpt_capability-do-not-send'),
    /capability/i,
  )
})

test('the bounded browser ledger preserves one stable capture across remounts and refresh restoration', () => {
  const insertId = stablePostHogInsertId(
    'report_viewed',
    'scan_v1_abcdefghijklmnopqrstuvwxyz0123456789ABCDEFG',
  )
  const first = nextPostHogCaptureLedger([], insertId)
  const remount = nextPostHogCaptureLedger(first, insertId)
  assert.deepEqual(first, [insertId])
  assert.deepEqual(remount, [insertId])
  const bounded = Array.from({ length: 140 }, (_, index) => `event-${index}`)
    .reduce((ledger, value) => nextPostHogCaptureLedger(ledger, value), [] as string[])
  assert.equal(bounded.length, 128)
})

test('server capture sends only allowlisted properties with a stable insert ID', async () => {
  const previousHost = process.env.POSTHOG_HOST
  const previousToken = process.env.POSTHOG_PROJECT_TOKEN
  const previousFetch = globalThis.fetch
  let submitted: Record<string, unknown> | undefined
  process.env.POSTHOG_HOST = 'https://analytics.example'
  process.env.POSTHOG_PROJECT_TOKEN = 'phc_test_project_token'
  globalThis.fetch = async (_input, init) => {
    submitted = JSON.parse(String(init?.body)) as Record<string, unknown>
    return new Response('{}', { status: 200 })
  }
  try {
    const result = await captureProductionCheckServerEvent({
      event: 'lead_qualified',
      subjectId: 'lead_abcdefghijklmnopqrstuvwx',
      distinctId: 'scan_v1_abcdefghijklmnopqrstuvwxyz0123456789ABCDEFG',
      properties: {
        scan_id: 'scan_v1_abcdefghijklmnopqrstuvwxyz0123456789ABCDEFG',
        lead_id: 'lead_abcdefghijklmnopqrstuvwx',
        lead_segment: 'qualified',
        email: 'founder@example.com',
        reportId: 'rpt_capability-do-not-send',
      },
    })
    assert.equal(result, 'sent')
    assert.deepEqual(submitted, {
      api_key: 'phc_test_project_token',
      event: 'lead_qualified',
      properties: {
        distinct_id: 'scan_v1_abcdefghijklmnopqrstuvwxyz0123456789ABCDEFG',
        $insert_id: 'production-check/v1/lead_qualified/lead_abcdefghijklmnopqrstuvwx',
        scan_id: 'scan_v1_abcdefghijklmnopqrstuvwxyz0123456789ABCDEFG',
        lead_id: 'lead_abcdefghijklmnopqrstuvwx',
        lead_segment: 'qualified',
      },
    })
  } finally {
    if (previousHost === undefined) delete process.env.POSTHOG_HOST
    else process.env.POSTHOG_HOST = previousHost
    if (previousToken === undefined) delete process.env.POSTHOG_PROJECT_TOKEN
    else process.env.POSTHOG_PROJECT_TOKEN = previousToken
    globalThis.fetch = previousFetch
  }
})

test('PostHog unavailability returns a safe failure without throwing', async () => {
  const previousHost = process.env.POSTHOG_HOST
  const previousToken = process.env.POSTHOG_PROJECT_TOKEN
  const previousFetch = globalThis.fetch
  process.env.POSTHOG_HOST = 'https://analytics.example'
  process.env.POSTHOG_PROJECT_TOKEN = 'phc_test_project_token'
  globalThis.fetch = async () => { throw new Error('private provider failure') }
  try {
    assert.equal(await captureProductionCheckServerEvent({
      event: 'lead_created',
      subjectId: 'lead_abcdefghijklmnopqrstuvwx',
      distinctId: 'lead_abcdefghijklmnopqrstuvwx',
      properties: { lead_id: 'lead_abcdefghijklmnopqrstuvwx' },
    }), 'failed')
  } finally {
    if (previousHost === undefined) delete process.env.POSTHOG_HOST
    else process.env.POSTHOG_HOST = previousHost
    if (previousToken === undefined) delete process.env.POSTHOG_PROJECT_TOKEN
    else process.env.POSTHOG_PROJECT_TOKEN = previousToken
    globalThis.fetch = previousFetch
  }
})
