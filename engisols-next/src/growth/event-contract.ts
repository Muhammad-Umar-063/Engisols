import { createHash, createHmac } from 'node:crypto'

export const ENGISOLS_GROWTH_EVENT_SCHEMA_VERSION = 'engisols-growth-event/v1' as const
export const ENGISOLS_GROWTH_EVENT_SOURCE = 'engisols-production-check' as const

export const ENGISOLS_GROWTH_EVENT_TYPES = [
  'lead.created',
  'lead.segmented',
  'scope_review.requested',
  'scope_review.decision_recorded',
  'offer.created',
  'offer.sent',
  'offer.accepted',
  'offer.declined',
  'offer.expired',
] as const

/** Reserved contract names. No v1 producer is permitted to emit these yet. */
export const ENGISOLS_RESERVED_GROWTH_EVENT_TYPES = [
  'payment.received',
  'revenue.recorded',
] as const

export type EngisolsGrowthEventType = (typeof ENGISOLS_GROWTH_EVENT_TYPES)[number]
export type ReservedEngisolsGrowthEventType = (typeof ENGISOLS_RESERVED_GROWTH_EVENT_TYPES)[number]
export type GrowthAnalyticsScanId = `scan_v1_${string}`
export type EngisolsGrowthEventId = `evt_v1_${string}`

export interface EngisolsGrowthEventSubject {
  readonly scanId?: GrowthAnalyticsScanId | undefined
  readonly leadId?: string | undefined
  readonly scopeReviewId?: string | undefined
  readonly offerId?: string | undefined
}

export interface EngisolsGrowthAttribution {
  readonly utmSource?: string | undefined
  readonly utmMedium?: string | undefined
  readonly utmCampaign?: string | undefined
  readonly utmContent?: string | undefined
  readonly utmTerm?: string | undefined
  readonly metaCampaignId?: string | undefined
  readonly metaAdsetId?: string | undefined
  readonly metaAdId?: string | undefined
  readonly metaPlacement?: string | undefined
  readonly metaSource?: string | undefined
}

export type GrowthBuilder = 'lovable' | 'bolt' | 'cursor' | 'v0' | 'replit' | 'claude_code' | 'other' | 'not_sure'
export type GrowthLaunchStage = 'experimenting' | 'preparing_to_launch' | 'has_users' | 'taking_payments'
export type GrowthLeadSegment = 'nurture' | 'maybe' | 'qualified'
export type GrowthScopeReviewStatus = 'pending_review' | 'needs_information' | 'no_paid_work' | 'offer_prepared' | 'offer_sent' | 'accepted' | 'declined'
export type GrowthScopeDecision = 'no_paid_work' | 'needs_information' | 'launch_blocker_fix' | 'production_harden' | 'ongoing_engineering' | 'custom'
export type GrowthOfferType = 'launch_blocker_fix' | 'production_harden' | 'ongoing_engineering' | 'custom'

export interface GrowthMoneyFields { readonly amountMinor?: number | undefined; readonly currency?: string | undefined }
export interface LeadCreatedOutcome { readonly builder?: GrowthBuilder | undefined; readonly launchStage?: GrowthLaunchStage | undefined }
export interface LeadSegmentedOutcome { readonly leadSegment: GrowthLeadSegment }
export interface ScopeReviewRequestedOutcome { readonly scopeReviewStatus: 'pending_review' }
export interface ScopeReviewDecisionOutcome {
  readonly scopeReviewStatus: Exclude<GrowthScopeReviewStatus, 'pending_review'>
  readonly scopeDecision: GrowthScopeDecision
}
export interface OfferCreatedOutcome extends GrowthMoneyFields { readonly offerType: GrowthOfferType; readonly offerStatus: 'draft' }
export interface OfferSentOutcome extends GrowthMoneyFields { readonly offerType: GrowthOfferType; readonly offerStatus: 'sent'; readonly sentAt: string }
export interface OfferAcceptedOutcome extends GrowthMoneyFields { readonly offerType: GrowthOfferType; readonly offerStatus: 'accepted'; readonly acceptedAt: string }
export interface OfferDeclinedOutcome extends GrowthMoneyFields { readonly offerType: GrowthOfferType; readonly offerStatus: 'declined'; readonly declinedAt: string }
export interface OfferExpiredOutcome extends GrowthMoneyFields { readonly offerType: GrowthOfferType; readonly offerStatus: 'expired'; readonly expiredAt: string }

interface EngisolsGrowthEventBase<TType extends EngisolsGrowthEventType, TOutcome, TSubject extends EngisolsGrowthEventSubject> {
  readonly schemaVersion: typeof ENGISOLS_GROWTH_EVENT_SCHEMA_VERSION
  readonly eventId: EngisolsGrowthEventId
  readonly eventType: TType
  readonly occurredAt: string
  readonly source: typeof ENGISOLS_GROWTH_EVENT_SOURCE
  readonly subject: TSubject
  readonly attribution?: EngisolsGrowthAttribution | undefined
  readonly outcome: TOutcome
}

type LeadSubject = EngisolsGrowthEventSubject & { readonly leadId: string }
type ScopeSubject = LeadSubject & { readonly scopeReviewId: string }
type OfferSubject = ScopeSubject & { readonly offerId: string }

export type EngisolsGrowthEvent =
  | EngisolsGrowthEventBase<'lead.created', LeadCreatedOutcome, LeadSubject>
  | EngisolsGrowthEventBase<'lead.segmented', LeadSegmentedOutcome, LeadSubject>
  | EngisolsGrowthEventBase<'scope_review.requested', ScopeReviewRequestedOutcome, ScopeSubject>
  | EngisolsGrowthEventBase<'scope_review.decision_recorded', ScopeReviewDecisionOutcome, ScopeSubject>
  | EngisolsGrowthEventBase<'offer.created', OfferCreatedOutcome, OfferSubject>
  | EngisolsGrowthEventBase<'offer.sent', OfferSentOutcome, OfferSubject>
  | EngisolsGrowthEventBase<'offer.accepted', OfferAcceptedOutcome, OfferSubject>
  | EngisolsGrowthEventBase<'offer.declined', OfferDeclinedOutcome, OfferSubject>
  | EngisolsGrowthEventBase<'offer.expired', OfferExpiredOutcome, OfferSubject>

export interface GrowthEventIdentityInput {
  readonly eventType: string
  readonly primarySubjectId: string
  /** Persisted transition revision, not an in-memory retry counter. */
  readonly transitionRevision: number
}

export function requireGrowthAnalyticsIdKey(environment: NodeJS.ProcessEnv = process.env): string {
  const key = environment.GROWTH_ANALYTICS_ID_KEY
  assertGrowthAnalyticsKey(key)
  return key
}

export function createGrowthAnalyticsScanId(
  reportCapabilityId: string,
  key: string = requireGrowthAnalyticsIdKey(),
): GrowthAnalyticsScanId {
  assertOpaqueIdentityInput(reportCapabilityId, 'report capability ID')
  return `scan_v1_${hmacIdentity('engisols-growth-analytics-scan/v1', reportCapabilityId, key)}`
}

export function createEngisolsGrowthEventId(
  input: GrowthEventIdentityInput,
  key: string = requireGrowthAnalyticsIdKey(),
): EngisolsGrowthEventId {
  assertOpaqueIdentityInput(input.eventType, 'event type')
  assertOpaqueIdentityInput(input.primarySubjectId, 'primary subject ID')
  if (!Number.isSafeInteger(input.transitionRevision) || input.transitionRevision < 1) {
    throw new Error('Growth event transition revision must be a positive safe integer')
  }
  return `evt_v1_${hmacIdentity(
    'engisols-growth-event-id/v1',
    `${input.eventType}\0${input.primarySubjectId}\0${input.transitionRevision}`,
    key,
  )}`
}

export function growthEventPayloadDigest(payload: string | Uint8Array): string {
  return createHash('sha256').update(payload).digest('hex')
}

function hmacIdentity(domain: string, value: string, key: string): string {
  assertGrowthAnalyticsKey(key)
  return createHmac('sha256', key).update(`${domain}\0${value}`).digest('base64url')
}

function assertGrowthAnalyticsKey(key: string | undefined): asserts key is string {
  if (key === undefined || Buffer.byteLength(key, 'utf8') < 32) {
    throw new Error('GROWTH_ANALYTICS_ID_KEY must contain at least 32 bytes')
  }
}

function assertOpaqueIdentityInput(value: string, label: string): void {
  const hasControlCharacter = Array.from(value).some((character) => {
    const code = character.charCodeAt(0)
    return code <= 31 || code === 127
  })
  if (value.length < 1 || value.length > 256 || hasControlCharacter) {
    throw new Error(`Growth ${label} is invalid`)
  }
}
