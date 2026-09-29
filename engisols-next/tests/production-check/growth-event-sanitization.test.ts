import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  ENGISOLS_GROWTH_EVENT_SCHEMA_VERSION,
  ENGISOLS_GROWTH_EVENT_SOURCE,
  createEngisolsGrowthEventId,
} from '../../src/growth/event-contract'
import { parseEngisolsGrowthEvent } from '../../src/growth/event-schema'

const key = 'test-growth-analytics-key-32-bytes-minimum'
const base = {
  schemaVersion: ENGISOLS_GROWTH_EVENT_SCHEMA_VERSION,
  eventId: createEngisolsGrowthEventId({ eventType: 'lead.created', primarySubjectId: 'lead_abcdefghijklmnopqrstuvwx', transitionRevision: 1 }, key),
  eventType: 'lead.created',
  occurredAt: '2026-09-18T12:00:00.000Z',
  source: ENGISOLS_GROWTH_EVENT_SOURCE,
  subject: { leadId: 'lead_abcdefghijklmnopqrstuvwx' },
  outcome: { builder: 'cursor', launchStage: 'has_users' },
}

describe('growth event privacy boundary', () => {
  for (const [label, extra] of [
    ['name', { outcome: { ...base.outcome, name: 'Alice Example' } }],
    ['email', { outcome: { ...base.outcome, email: 'alice@example.com' } }],
    ['company', { company: 'Private Company' }],
    ['application URL', { appUrl: 'https://customer.example/private' }],
    ['free text', { outcome: { ...base.outcome, context: 'customer notes' } }],
    ['scanner evidence', { outcome: { ...base.outcome, scannerEvidence: 'raw finding' } }],
    ['operator token', { outcome: { ...base.outcome, operatorToken: 'secret' } }],
  ] as const) {
    it(`rejects ${label} rather than stripping it`, () => {
      assert.throws(() => parseEngisolsGrowthEvent({ ...base, ...extra }))
    })
  }

  for (const attribution of [
    { utmSource: 'alice@example.com' },
    { utmCampaign: 'https://customer.example/path' },
    { utmContent: 'sk_abcdefghijklmnopqrst' },
    { metaAdId: 'not-a-meta-id' },
    { metaPlacement: 'customer explained everything' },
  ]) {
    it(`rejects unsafe attribution ${JSON.stringify(attribution)}`, () => {
      assert.throws(() => parseEngisolsGrowthEvent({ ...base, attribution }))
    })
  }

  it('requires paired integer minor-unit money and uppercase ISO currency', () => {
    const offer = {
      ...base,
      eventId: createEngisolsGrowthEventId({ eventType: 'offer.created', primarySubjectId: 'offer_abcdefghijklmnopqrstuvwx', transitionRevision: 1 }, key),
      eventType: 'offer.created',
      subject: { leadId: 'lead_abcdefghijklmnopqrstuvwx', scopeReviewId: 'scope_abcdefghijklmnopqrstuvwx', offerId: 'offer_abcdefghijklmnopqrstuvwx' },
      outcome: { offerType: 'custom', offerStatus: 'draft' },
    }
    assert.throws(() => parseEngisolsGrowthEvent({ ...offer, outcome: { ...offer.outcome, amountMinor: 1_000 } }))
    assert.throws(() => parseEngisolsGrowthEvent({ ...offer, outcome: { ...offer.outcome, amountMinor: 10.5, currency: 'USD' } }))
    assert.throws(() => parseEngisolsGrowthEvent({ ...offer, outcome: { ...offer.outcome, amountMinor: 1_000, currency: 'usd' } }))
  })
})
