import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

import {
  protectProductionCheckPostHogEvent,
  sanitizePostHogUrl,
} from '../../src/production-check/analytics-privacy'
import { productionCheckPostHogProperties } from '../../src/production-check/analytics-properties'

test('PostHog scope properties keep only the approved non-sensitive fields', () => {
  const properties = productionCheckPostHogProperties({
    reportId: 'rpt_abcdefghijklmnopqrstuvwx',
    scope_review_id: 'scope_abcdefghijklmnopqrstuvwx',
    offer_type: 'launch_blocker_fix',
    offer_amount: 499,
    currency: 'USD',
    launch_stage: 'taking_payments',
    builder: 'lovable',
    lead_segment: 'qualified',
    findingId: 'finding_auth_boundary',
    label: 'FIX NOW',
    expanded: true,
    filter: 'ALL',
    lens: 'source',
    answer: 'taking_payments',
    layout: 'mobile_accordion',
    urgent: true,
    location: 'evidence_lens',
    metaEventId: 'lead_abcdefghijklmnopqrstuvwx',
    nextStep: 'engineer_scope_check',
    email: 'ada@example.com',
    name: 'Ada Founder',
    company: 'Private Co',
    app_url: 'https://private.example',
    scanner_evidence: 'secret evidence',
    internal_notes: 'private notes',
    operator_token: 'private token',
  })
  assert.deepEqual(properties, {
    scope_review_id: 'scope_abcdefghijklmnopqrstuvwx',
    offer_type: 'launch_blocker_fix',
    offer_amount: 499,
    currency: 'USD',
    launch_stage: 'taking_payments',
    builder: 'lovable',
    lead_segment: 'qualified',
    findingId: 'finding_auth_boundary',
    label: 'FIX NOW',
    expanded: true,
    filter: 'ALL',
    lens: 'source',
    answer: 'taking_payments',
    layout: 'mobile_accordion',
    urgent: true,
    location: 'evidence_lens',
    nextStep: 'engineer_scope_check',
  })
  assert.doesNotMatch(
    JSON.stringify(properties),
    /ada@|Private Co|private\.example|secret evidence|private notes|private token/,
  )
})

test('PostHog suppresses automatic events and redacts manual events on offer capability routes', () => {
  const offerId = 'offer_abcdefghijklmnopqrstuvwx'
  const offerUrl = `https://www.engisols.com/production-check/offer/${offerId}?utm_source=email`
  const pageView = postHogEvent('$pageview', offerUrl, offerId)
  const snapshot = postHogEvent('$snapshot', offerUrl, offerId)

  assert.equal(protectProductionCheckPostHogEvent(pageView, offerUrl), null)
  assert.equal(protectProductionCheckPostHogEvent(snapshot, offerUrl), null)

  const manual = protectProductionCheckPostHogEvent(
    postHogEvent('scope_offer_viewed', offerUrl, offerId),
    offerUrl,
  )
  assert.ok(manual)
  assert.match(String(manual.properties.$current_url), /\/production-check\/offer\/redacted/)
  assert.match(String(manual.properties.$pathname), /\/production-check\/offer\/redacted/)
  assert.doesNotMatch(JSON.stringify(manual), new RegExp(offerId))
})

test('PostHog redacts report and active-scan capabilities from URLs and nested properties', () => {
  const reportId = 'rpt_abcdefghijklmnopqrstuvwx'
  const reportUrl = `https://www.engisols.com/production-check/report/${reportId}?view=source`
  const scanUrl = `https://www.engisols.com/production-check?scanId=${reportId}&view=summary`

  assert.equal(
    sanitizePostHogUrl(reportUrl),
    'https://www.engisols.com/production-check/report/redacted?view=source',
  )
  assert.equal(
    sanitizePostHogUrl(scanUrl),
    'https://www.engisols.com/production-check?scanId=redacted&view=summary',
  )

  const protectedEvent = protectProductionCheckPostHogEvent(
    {
      ...postHogEvent('report_viewed', reportUrl, reportId),
      properties: {
        ...postHogEvent('report_viewed', reportUrl, reportId).properties,
        activeScan: scanUrl,
      },
    },
    reportUrl,
  )
  assert.ok(protectedEvent)
  assert.doesNotMatch(JSON.stringify(protectedEvent), new RegExp(reportId))
})

test('PostHog initialization applies offer privacy at the SDK boundary', () => {
  const instrumentation = readFileSync('instrumentation-client.ts', 'utf8')
  assert.match(instrumentation, /before_send:\s*\(event\)[\s\S]*protectPostHogEvent/)
  assert.match(instrumentation, /url_ignorelist:\s*\[[\s\S]*PRODUCTION_CHECK_OFFER_URL_PATTERN[\s\S]*INTERNAL_PRODUCTION_CHECK_URL_PATTERN/)
  assert.match(instrumentation, /get_current_url:\s*sanitizePostHogUrl/)
})

test('offer decision code has no checkout or Meta commerce event', () => {
  const server = readFileSync('app/api/production-check/offers/[offerId]/decision/route.ts', 'utf8')
  const client = readFileSync('components/production-check/OfferDecisionControls.tsx', 'utf8')
  assert.doesNotMatch(`${server}${client}`, /Purchase|InitiateCheckout|startCheckout|PAY NOW/)
})

test('the report request flow no longer renders an automatic $499 action', () => {
  const intake = readFileSync('components/production-check/CodeReviewIntake.tsx', 'utf8')
  const actions = readFileSync('components/production-check/ReportActions.tsx', 'utf8')
  assert.match(`${intake}${actions}`, /REQUEST FREE ENGINEER SCOPE CHECK/)
  assert.doesNotMatch(`${intake}${actions}`, /Launch Blocker Fix|\$499|ASK ABOUT THE FIX|BUY NOW|START THE FIX/)
})

test('operator secret is absent from every client component', () => {
  const operatorClient = readFileSync('components/production-check/OperatorReviewForm.tsx', 'utf8')
  const offerClient = readFileSync('components/production-check/OfferDecisionControls.tsx', 'utf8')
  assert.doesNotMatch(`${operatorClient}${offerClient}`, /PRODUCTION_CHECK_OPERATOR_SECRET|operator-token\.server/)
})

function postHogEvent(event: string, offerUrl: string, offerId: string) {
  return {
    uuid: 'event-uuid',
    event,
    properties: {
      $current_url: offerUrl,
      $pathname: new URL(offerUrl).pathname,
      nested: { destination: `/production-check/offer/${offerId}` },
      scope_review_id: 'scope_abcdefghijklmnopqrstuvwx',
    },
  }
}
