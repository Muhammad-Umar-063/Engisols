import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  ENGISOLS_GROWTH_EVENT_SCHEMA_VERSION,
  ENGISOLS_GROWTH_EVENT_SOURCE,
  createEngisolsGrowthEventId,
  createGrowthAnalyticsScanId,
  growthEventPayloadDigest,
} from '../../src/growth/event-contract'
import { parseEngisolsGrowthEvent } from '../../src/growth/event-schema'

const occurredAt = '2026-09-18T12:00:00.000Z'
const key = 'test-growth-analytics-key-32-bytes-minimum'
const subject = {
  scanId: createGrowthAnalyticsScanId('rpt_capability-do-not-export', key),
  leadId: 'lead_abcdefghijklmnopqrstuvwx',
  scopeReviewId: 'scope_abcdefghijklmnopqrstuvwx',
  offerId: 'offer_abcdefghijklmnopqrstuvwx',
}

function event(eventType: string, outcome: Record<string, unknown>, revision = 1): unknown {
  const eventSubject = eventType.startsWith('offer.')
    ? subject
    : eventType.startsWith('scope_review.')
      ? { scanId: subject.scanId, leadId: subject.leadId, scopeReviewId: subject.scopeReviewId }
      : { scanId: subject.scanId, leadId: subject.leadId }
  return {
    schemaVersion: ENGISOLS_GROWTH_EVENT_SCHEMA_VERSION,
    eventId: createEngisolsGrowthEventId({ eventType, primarySubjectId: subject.offerId, transitionRevision: revision }, key),
    eventType,
    occurredAt,
    source: ENGISOLS_GROWTH_EVENT_SOURCE,
    subject: eventSubject,
    attribution: {
      utmSource: 'meta_test', utmMedium: 'qa', utmCampaign: 'growth_copilot_join_test',
      utmContent: 'controlled_test', utmTerm: 'controlled_adset',
      metaCampaignId: '120000000000001', metaAdsetId: '120000000000002', metaAdId: '120000000000003',
      metaPlacement: 'facebook_feed', metaSource: 'facebook',
    },
    outcome,
  }
}

describe('engisols-growth-event/v1', () => {
  for (const [eventType, outcome] of [
    ['lead.created', { builder: 'cursor', launchStage: 'has_users' }],
    ['lead.segmented', { leadSegment: 'qualified' }],
    ['scope_review.requested', { scopeReviewStatus: 'pending_review' }],
    ['scope_review.decision_recorded', { scopeReviewStatus: 'offer_prepared', scopeDecision: 'production_harden' }],
    ['offer.created', { offerType: 'production_harden', offerStatus: 'draft', amountMinor: 125_000, currency: 'USD' }],
    ['offer.sent', { offerType: 'production_harden', offerStatus: 'sent', sentAt: occurredAt, amountMinor: 125_000, currency: 'USD' }],
    ['offer.accepted', { offerType: 'production_harden', offerStatus: 'accepted', acceptedAt: occurredAt }],
    ['offer.declined', { offerType: 'production_harden', offerStatus: 'declined', declinedAt: occurredAt }],
    ['offer.expired', { offerType: 'production_harden', offerStatus: 'expired', expiredAt: occurredAt }],
  ] as const) {
    it(`accepts the typed ${eventType} outcome`, () => {
      assert.equal(parseEngisolsGrowthEvent(event(eventType, outcome)).eventType, eventType)
    })
  }

  it('reserves payment and revenue without allowing emission', () => {
    for (const eventType of ['payment.received', 'revenue.recorded']) {
      assert.throws(() => parseEngisolsGrowthEvent(event(eventType, { amountMinor: 1, currency: 'USD' })))
    }
  })

  it('uses transition revision for stable opaque IDs and never exports a report capability', () => {
    const once = createEngisolsGrowthEventId({ eventType: 'offer.accepted', primarySubjectId: subject.offerId, transitionRevision: 7 }, key)
    const retry = createEngisolsGrowthEventId({ eventType: 'offer.accepted', primarySubjectId: subject.offerId, transitionRevision: 7 }, key)
    const later = createEngisolsGrowthEventId({ eventType: 'offer.accepted', primarySubjectId: subject.offerId, transitionRevision: 8 }, key)
    assert.equal(once, retry)
    assert.notEqual(later, once)
    assert.match(once, /^evt_v1_[A-Za-z0-9_-]{43}$/)
    assert.match(subject.scanId, /^scan_v1_[A-Za-z0-9_-]{43}$/)
    assert.equal(subject.scanId.includes('rpt_capability'), false)
  })

  it('digests exact payload bytes for collision detection', () => {
    assert.equal(growthEventPayloadDigest('{"a":1}'), growthEventPayloadDigest(Buffer.from('{"a":1}')))
    assert.notEqual(growthEventPayloadDigest('{"a":1}'), growthEventPayloadDigest('{"a":1 }'))
  })

  it('requires a dedicated high-entropy analytical identity key', () => {
    assert.throws(() => createGrowthAnalyticsScanId('rpt_capability', 'too-short'), /at least 32 bytes/)
    assert.throws(
      () => createEngisolsGrowthEventId({ eventType: 'lead.created', primarySubjectId: subject.leadId, transitionRevision: 0 }, key),
      /positive safe integer/,
    )
  })
})
