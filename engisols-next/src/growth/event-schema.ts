import {
  ENGISOLS_GROWTH_EVENT_SCHEMA_VERSION,
  ENGISOLS_GROWTH_EVENT_SOURCE,
  type EngisolsGrowthEvent,
} from './event-contract'
import { assertNoForbiddenGrowthData } from './sanitize'

const EVENT_ID = /^evt_v1_[A-Za-z0-9_-]{43}$/
const SCAN_ID = /^scan_v1_[A-Za-z0-9_-]{43}$/
const LEAD_ID = /^lead_[A-Za-z0-9_-]{24,64}$/
const SCOPE_ID = /^scope_[A-Za-z0-9_-]{24,64}$/
const OFFER_ID = /^offer_[A-Za-z0-9_-]{24,64}$/
const ATTRIBUTION_LABEL = /^[A-Za-z0-9][A-Za-z0-9._~:+-]*$/
const META_ID = /^\d{5,40}$/
const INSTANT = /^\d{4}-\d{2}-\d{2}T.+(?:Z|[+-]\d{2}:\d{2})$/
const CREDENTIAL = /\b(?:Bearer\s+\S+|(?:sk|ghp|github_pat)_[A-Za-z0-9_-]{12,}|EA[A-Za-z0-9]{18,})\b/i

const BUILDERS = ['lovable', 'bolt', 'cursor', 'v0', 'replit', 'claude_code', 'other', 'not_sure'] as const
const LAUNCH_STAGES = ['experimenting', 'preparing_to_launch', 'has_users', 'taking_payments'] as const
const LEAD_SEGMENTS = ['nurture', 'maybe', 'qualified'] as const
const REVIEW_STATUSES = ['needs_information', 'no_paid_work', 'offer_prepared', 'offer_sent', 'accepted', 'declined'] as const
const SCOPE_DECISIONS = ['no_paid_work', 'needs_information', 'launch_blocker_fix', 'production_harden', 'ongoing_engineering', 'custom'] as const
const OFFER_TYPES = ['launch_blocker_fix', 'production_harden', 'ongoing_engineering', 'custom'] as const

export class GrowthEventValidationError extends Error {}

export function parseEngisolsGrowthEvent(input: unknown): EngisolsGrowthEvent {
  assertNoForbiddenGrowthData(input)
  const event = record(input, '$')
  exactKeys(event, ['schemaVersion', 'eventId', 'eventType', 'occurredAt', 'source', 'subject', 'attribution', 'outcome'], '$')
  exact(event.schemaVersion, ENGISOLS_GROWTH_EVENT_SCHEMA_VERSION, '$.schemaVersion')
  pattern(text(event.eventId, '$.eventId'), EVENT_ID, '$.eventId')
  const eventType = text(event.eventType, '$.eventType')
  instant(event.occurredAt, '$.occurredAt')
  exact(event.source, ENGISOLS_GROWTH_EVENT_SOURCE, '$.source')
  if (event.attribution !== undefined) validateAttribution(event.attribution)

  switch (eventType) {
    case 'lead.created':
      validateLeadSubject(event.subject)
      validateLeadCreated(event.outcome)
      break
    case 'lead.segmented':
      validateLeadSubject(event.subject)
      validateOutcome(event.outcome, ['leadSegment'], (outcome) => member(outcome.leadSegment, LEAD_SEGMENTS, '$.outcome.leadSegment'))
      break
    case 'scope_review.requested':
      validateScopeSubject(event.subject)
      validateOutcome(event.outcome, ['scopeReviewStatus'], (outcome) => exact(outcome.scopeReviewStatus, 'pending_review', '$.outcome.scopeReviewStatus'))
      break
    case 'scope_review.decision_recorded':
      validateScopeSubject(event.subject)
      validateOutcome(event.outcome, ['scopeReviewStatus', 'scopeDecision'], (outcome) => {
        member(outcome.scopeReviewStatus, REVIEW_STATUSES, '$.outcome.scopeReviewStatus')
        member(outcome.scopeDecision, SCOPE_DECISIONS, '$.outcome.scopeDecision')
      })
      break
    case 'offer.created':
      validateOffer(event.subject, event.outcome, 'draft')
      break
    case 'offer.sent':
      validateOffer(event.subject, event.outcome, 'sent', 'sentAt')
      break
    case 'offer.accepted':
      validateOffer(event.subject, event.outcome, 'accepted', 'acceptedAt')
      break
    case 'offer.declined':
      validateOffer(event.subject, event.outcome, 'declined', 'declinedAt')
      break
    case 'offer.expired':
      validateOffer(event.subject, event.outcome, 'expired', 'expiredAt')
      break
    default:
      throw invalid('$.eventType', 'unsupported or reserved event type')
  }
  return input as EngisolsGrowthEvent
}

function validateLeadCreated(input: unknown): void {
  validateOutcome(input, ['builder', 'launchStage'], (outcome) => {
    if (outcome.builder !== undefined) member(outcome.builder, BUILDERS, '$.outcome.builder')
    if (outcome.launchStage !== undefined) member(outcome.launchStage, LAUNCH_STAGES, '$.outcome.launchStage')
  })
}

function validateLeadSubject(input: unknown): void {
  const subject = record(input, '$.subject')
  exactKeys(subject, ['scanId', 'leadId'], '$.subject')
  pattern(text(subject.leadId, '$.subject.leadId'), LEAD_ID, '$.subject.leadId')
  if (subject.scanId !== undefined) pattern(text(subject.scanId, '$.subject.scanId'), SCAN_ID, '$.subject.scanId')
}

function validateScopeSubject(input: unknown): void {
  const subject = record(input, '$.subject')
  exactKeys(subject, ['scanId', 'leadId', 'scopeReviewId'], '$.subject')
  pattern(text(subject.leadId, '$.subject.leadId'), LEAD_ID, '$.subject.leadId')
  pattern(text(subject.scopeReviewId, '$.subject.scopeReviewId'), SCOPE_ID, '$.subject.scopeReviewId')
  if (subject.scanId !== undefined) pattern(text(subject.scanId, '$.subject.scanId'), SCAN_ID, '$.subject.scanId')
}

function validateOfferSubject(input: unknown): void {
  const subject = record(input, '$.subject')
  exactKeys(subject, ['scanId', 'leadId', 'scopeReviewId', 'offerId'], '$.subject')
  pattern(text(subject.leadId, '$.subject.leadId'), LEAD_ID, '$.subject.leadId')
  pattern(text(subject.scopeReviewId, '$.subject.scopeReviewId'), SCOPE_ID, '$.subject.scopeReviewId')
  pattern(text(subject.offerId, '$.subject.offerId'), OFFER_ID, '$.subject.offerId')
  if (subject.scanId !== undefined) pattern(text(subject.scanId, '$.subject.scanId'), SCAN_ID, '$.subject.scanId')
}

function validateOffer(subjectInput: unknown, outcomeInput: unknown, status: string, timestampKey?: string): void {
  validateOfferSubject(subjectInput)
  const allowed = ['offerType', 'offerStatus', 'amountMinor', 'currency', ...(timestampKey ? [timestampKey] : [])]
  validateOutcome(outcomeInput, allowed, (outcome) => {
    member(outcome.offerType, OFFER_TYPES, '$.outcome.offerType')
    exact(outcome.offerStatus, status, '$.outcome.offerStatus')
    if (timestampKey) instant(outcome[timestampKey], `$.outcome.${timestampKey}`)
    const hasAmount = outcome.amountMinor !== undefined
    const hasCurrency = outcome.currency !== undefined
    if (hasAmount !== hasCurrency) throw invalid('$.outcome', 'amountMinor and currency must be supplied together')
    if (hasAmount && (!Number.isSafeInteger(outcome.amountMinor) || (outcome.amountMinor as number) < 0)) {
      throw invalid('$.outcome.amountMinor', 'expected non-negative integer minor units')
    }
    if (hasCurrency) pattern(text(outcome.currency, '$.outcome.currency'), /^[A-Z]{3}$/, '$.outcome.currency')
  })
}

function validateAttribution(input: unknown): void {
  const attribution = record(input, '$.attribution')
  const labels = ['utmSource', 'utmMedium', 'utmCampaign', 'utmContent', 'utmTerm', 'metaPlacement', 'metaSource']
  const metaIds = ['metaCampaignId', 'metaAdsetId', 'metaAdId']
  exactKeys(attribution, [...labels, ...metaIds], '$.attribution')
  for (const key of labels) {
    if (attribution[key] === undefined) continue
    const value = text(attribution[key], `$.attribution.${key}`)
    if (value.length > 100) throw invalid(`$.attribution.${key}`, 'value is too long')
    pattern(value, ATTRIBUTION_LABEL, `$.attribution.${key}`)
    if (CREDENTIAL.test(value)) throw invalid(`$.attribution.${key}`, 'credential-shaped value')
  }
  for (const key of metaIds) {
    if (attribution[key] !== undefined) pattern(text(attribution[key], `$.attribution.${key}`), META_ID, `$.attribution.${key}`)
  }
}

function validateOutcome(input: unknown, allowed: readonly string[], validate: (outcome: Record<string, unknown>) => void): void {
  const outcome = record(input, '$.outcome')
  exactKeys(outcome, allowed, '$.outcome')
  validate(outcome)
}

function record(value: unknown, path: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.getPrototypeOf(value) !== Object.prototype) {
    throw invalid(path, 'expected plain object')
  }
  return value as Record<string, unknown>
}

function exactKeys(value: Record<string, unknown>, allowed: readonly string[], path: string): void {
  const allowedSet = new Set(allowed)
  const unknown = Object.keys(value).find((key) => !allowedSet.has(key))
  if (unknown) throw invalid(`${path}.${unknown}`, 'unknown field')
}

function text(value: unknown, path: string): string {
  if (typeof value !== 'string' || value.length === 0) throw invalid(path, 'expected non-empty string')
  return value
}

function exact(value: unknown, expected: string, path: string): void {
  if (value !== expected) throw invalid(path, `expected ${expected}`)
}

function pattern(value: string, expected: RegExp, path: string): void {
  if (!expected.test(value)) throw invalid(path, 'invalid value')
}

function member<T extends string>(value: unknown, allowed: readonly T[], path: string): T {
  if (typeof value !== 'string' || !(allowed as readonly string[]).includes(value)) throw invalid(path, 'unsupported value')
  return value as T
}

function instant(value: unknown, path: string): void {
  const candidate = text(value, path)
  if (!INSTANT.test(candidate) || !Number.isFinite(Date.parse(candidate))) throw invalid(path, 'invalid timestamp')
}

function invalid(path: string, reason: string): GrowthEventValidationError {
  return new GrowthEventValidationError(`Invalid Engisols growth event at ${path}: ${reason}`)
}
