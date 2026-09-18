import {
  ENGISOLS_GROWTH_EVENT_SCHEMA_VERSION,
  ENGISOLS_GROWTH_EVENT_SOURCE,
  createEngisolsGrowthEventId,
  createGrowthAnalyticsOfferId,
  createGrowthAnalyticsScanId,
  type EngisolsGrowthAttribution,
  type EngisolsGrowthEvent,
  type EngisolsGrowthEventType,
} from './event-contract'
import { parseEngisolsGrowthEvent } from './event-schema'
import type {
  ProductionCheckAttribution,
  ProductionCheckLead,
  ProductionScopeOffer,
  ProductionScopeReview,
} from '../production-check/types'

export interface GrowthOutcomeEventFactory {
  leadCreated(lead: ProductionCheckLead): EngisolsGrowthEvent
  leadSegmented(lead: ProductionCheckLead): EngisolsGrowthEvent
  scopeReviewRequested(review: ProductionScopeReview): EngisolsGrowthEvent
  scopeReviewDecision(review: ProductionScopeReview, revision: number): EngisolsGrowthEvent
  offerCreated(offer: ProductionScopeOffer): EngisolsGrowthEvent
  offerSent(offer: ProductionScopeOffer): EngisolsGrowthEvent
  offerDecision(offer: ProductionScopeOffer): EngisolsGrowthEvent
  offerExpired(offer: ProductionScopeOffer, expiredAt: string): EngisolsGrowthEvent
}

export function createGrowthOutcomeEventFactory(analyticsIdKey: string): GrowthOutcomeEventFactory {
  const base = <T extends EngisolsGrowthEventType>(
    eventType: T,
    primarySubjectId: string,
    transitionRevision: number,
    occurredAt: string,
  ) => ({
    schemaVersion: ENGISOLS_GROWTH_EVENT_SCHEMA_VERSION,
    eventId: createEngisolsGrowthEventId({ eventType, primarySubjectId, transitionRevision }, analyticsIdKey),
    eventType,
    occurredAt,
    source: ENGISOLS_GROWTH_EVENT_SOURCE,
  } as const)

  const scanId = (capabilityId: string) => createGrowthAnalyticsScanId(capabilityId, analyticsIdKey)
  const offerId = (capabilityId: string) => createGrowthAnalyticsOfferId(capabilityId, analyticsIdKey)
  const subject = (leadId: string, scanCapabilityId: string) => ({
    scanId: scanId(scanCapabilityId),
    leadId,
  })
  const attribution = (value: ProductionCheckAttribution | undefined) =>
    value ? sanitizeAttribution(value) : undefined
  const validate = (event: unknown): EngisolsGrowthEvent => parseEngisolsGrowthEvent(event)
  const money = (offer: ProductionScopeOffer) => offer.amount === undefined
    ? {}
    : { amountMinor: offer.amount * 100, currency: offer.currency }

  return {
    leadCreated(lead) {
      return validate({
        ...base('lead.created', lead.id, 1, lead.createdAt),
        subject: subject(lead.id, lead.scanId),
        attribution: attribution(lead.attribution),
        outcome: {
          ...(lead.builder ? { builder: lead.builder } : {}),
          ...(lead.launchStage ? { launchStage: lead.launchStage } : {}),
        },
      })
    },
    leadSegmented(lead) {
      return validate({
        ...base('lead.segmented', lead.id, 1, lead.createdAt),
        subject: subject(lead.id, lead.scanId),
        attribution: attribution(lead.attribution),
        outcome: { leadSegment: lead.segment },
      })
    },
    scopeReviewRequested(review) {
      return validate({
        ...base('scope_review.requested', review.id, 1, review.requestedAt),
        subject: { ...subject(review.leadId, review.scanId), scopeReviewId: review.id },
        attribution: attribution(review.growthContext?.attribution),
        outcome: { scopeReviewStatus: 'pending_review' },
      })
    },
    scopeReviewDecision(review, revision) {
      if (!review.decision || review.status === 'pending_review') {
        throw new Error('A durable scope-review decision is required')
      }
      return validate({
        ...base('scope_review.decision_recorded', review.id, revision, review.reviewedAt ?? review.updatedAt),
        subject: { ...subject(review.leadId, review.scanId), scopeReviewId: review.id },
        attribution: attribution(review.growthContext?.attribution),
        outcome: { scopeReviewStatus: review.status, scopeDecision: review.decision },
      })
    },
    offerCreated(offer) {
      return validate({
        ...base('offer.created', offer.id, 1, offer.createdAt),
        subject: { ...subject(offer.leadId, offer.scanId), scopeReviewId: offer.scopeReviewId, offerId: offerId(offer.id) },
        attribution: attribution(offer.growthContext?.attribution),
        outcome: { offerType: offer.type, offerStatus: 'draft', ...money(offer) },
      })
    },
    offerSent(offer) {
      if (!offer.sentAt) throw new Error('A sent timestamp is required')
      return validate({
        ...base('offer.sent', offer.id, 1, offer.sentAt),
        subject: { ...subject(offer.leadId, offer.scanId), scopeReviewId: offer.scopeReviewId, offerId: offerId(offer.id) },
        attribution: attribution(offer.growthContext?.attribution),
        outcome: { offerType: offer.type, offerStatus: 'sent', sentAt: offer.sentAt, ...money(offer) },
      })
    },
    offerDecision(offer) {
      if (offer.status !== 'accepted' && offer.status !== 'declined') throw new Error('A terminal offer decision is required')
      const occurredAt = offer.status === 'accepted' ? offer.acceptedAt : offer.declinedAt
      if (!occurredAt) throw new Error('An offer decision timestamp is required')
      const timestamp = offer.status === 'accepted' ? { acceptedAt: occurredAt } : { declinedAt: occurredAt }
      return validate({
        ...base(`offer.${offer.status}`, offer.id, 1, occurredAt),
        subject: { ...subject(offer.leadId, offer.scanId), scopeReviewId: offer.scopeReviewId, offerId: offerId(offer.id) },
        attribution: attribution(offer.growthContext?.attribution),
        outcome: { offerType: offer.type, offerStatus: offer.status, ...timestamp, ...money(offer) },
      } as EngisolsGrowthEvent)
    },
    offerExpired(offer, expiredAt) {
      return validate({
        ...base('offer.expired', offer.id, 1, expiredAt),
        subject: { ...subject(offer.leadId, offer.scanId), scopeReviewId: offer.scopeReviewId, offerId: offerId(offer.id) },
        attribution: attribution(offer.growthContext?.attribution),
        outcome: { offerType: offer.type, offerStatus: 'expired', expiredAt, ...money(offer) },
      })
    },
  }
}

function sanitizeAttribution(value: ProductionCheckAttribution): EngisolsGrowthAttribution | undefined {
  const sanitized: EngisolsGrowthAttribution = {
    ...(value.source ? { utmSource: value.source } : {}),
    ...(value.medium ? { utmMedium: value.medium } : {}),
    ...(value.campaign ? { utmCampaign: value.campaign } : {}),
    ...(value.content ? { utmContent: value.content } : {}),
    ...(value.term ? { utmTerm: value.term } : {}),
    ...(value.metaCampaignId ? { metaCampaignId: value.metaCampaignId } : {}),
    ...(value.metaAdsetId ? { metaAdsetId: value.metaAdsetId } : {}),
    ...(value.metaAdId ? { metaAdId: value.metaAdId } : {}),
    ...(value.metaPlacement ? { metaPlacement: value.metaPlacement } : {}),
    ...(value.metaSource ? { metaSource: value.metaSource } : {}),
  }
  return Object.keys(sanitized).length ? sanitized : undefined
}
