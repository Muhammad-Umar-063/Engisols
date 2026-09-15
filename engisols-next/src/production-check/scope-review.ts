import { createHash, randomBytes } from 'node:crypto'

import {
  LAUNCH_BLOCKER_FIX_PRICE_USD,
  PRODUCTION_ENGINEERING_PRICE_USD,
  PRODUCTION_HARDEN_PRICE_USD,
  SCOPE_OFFER_RETENTION_MS,
  SCOPE_OFFER_VALIDITY_MS,
  SCOPE_REVIEW_RECORD_LIFETIME_MS,
} from './config'
import type {
  ProductionCheckLead,
  ProductionScopeOffer,
  ProductionScopeReview,
  ScopeAccessWillingness,
  ScopeConcern,
  ScopeOfferBilling,
  ScopeOfferType,
} from './types'

interface CreateScopeReviewInput {
  lead: ProductionCheckLead
  concern: ScopeConcern
  concernDetail?: string
  accessWillingness: ScopeAccessWillingness
}

export function createProductionScopeReview(
  input: CreateScopeReviewInput,
  now: () => Date = () => new Date(),
): ProductionScopeReview {
  const requestedAt = now()
  return {
    id: createScopeReviewId(input.lead.id, input.lead.scanId),
    leadId: input.lead.id,
    scanId: input.lead.scanId,
    concern: input.concern,
    ...(input.concernDetail?.trim() ? { concernDetail: input.concernDetail.trim() } : {}),
    accessWillingness: input.accessWillingness,
    status: 'pending_review',
    requestedAt: requestedAt.toISOString(),
    updatedAt: requestedAt.toISOString(),
    expiresAt: new Date(requestedAt.getTime() + SCOPE_REVIEW_RECORD_LIFETIME_MS).toISOString(),
    notification: { status: 'pending' },
  }
}

export function createScopeReviewId(leadId: string, scanId: string): string {
  const digest = createHash('sha256')
    .update(JSON.stringify(['production-scope-review', leadId, scanId]))
    .digest('base64url')
    .slice(0, 24)
  return `scope_${digest}`
}

export function createScopeOfferId(): string {
  return `offer_${randomBytes(18).toString('base64url')}`
}

export function isValidScopeReviewId(value: string): boolean {
  return /^scope_[A-Za-z0-9_-]{24}$/.test(value)
}

export function isValidScopeOfferId(value: string): boolean {
  return /^offer_[A-Za-z0-9_-]{24}$/.test(value)
}

interface CreateScopeOfferInput {
  review: ProductionScopeReview
  type: ScopeOfferType
  title?: string
  summary: string
  includedItems: string[]
  exclusions: string[]
  amount?: number
  billing?: ScopeOfferBilling
  deliveryWindow?: string
  createId?: () => string
}

const offerDefaults: Record<Exclude<ScopeOfferType, 'custom'>, {
  title: string
  amount: number
  billing: ScopeOfferBilling
}> = {
  launch_blocker_fix: {
    title: 'Launch Blocker Fix',
    amount: LAUNCH_BLOCKER_FIX_PRICE_USD,
    billing: 'one_time',
  },
  production_harden: {
    title: 'Production Harden',
    amount: PRODUCTION_HARDEN_PRICE_USD,
    billing: 'one_time',
  },
  ongoing_engineering: {
    title: 'Production Engineering',
    amount: PRODUCTION_ENGINEERING_PRICE_USD,
    billing: 'monthly',
  },
}

export function createProductionScopeOffer(
  input: CreateScopeOfferInput,
  now: () => Date = () => new Date(),
): ProductionScopeOffer {
  const createdAt = now()
  const defaults = input.type === 'custom' ? undefined : offerDefaults[input.type]
  const amount = validateAmount(input.amount ?? defaults?.amount)
  const title = cleanRequired(input.title ?? defaults?.title ?? 'Custom engineering scope', 120)
  const summary = cleanRequired(input.summary, 2_000)
  const includedItems = cleanItems(input.includedItems, 'included item')
  if (input.type === 'launch_blocker_fix' && includedItems.length > 3) {
    throw new Error('Launch Blocker Fix supports up to three agreed blockers.')
  }
  const exclusions = cleanItems(input.exclusions, 'exclusion', true)
  const billing = input.billing ?? defaults?.billing ?? 'custom'

  return {
    id: input.createId?.() ?? createScopeOfferId(),
    scopeReviewId: input.review.id,
    leadId: input.review.leadId,
    scanId: input.review.scanId,
    type: input.type,
    title,
    summary,
    includedItems,
    exclusions,
    ...(amount !== undefined ? { amount } : {}),
    currency: 'USD',
    billing,
    ...(input.deliveryWindow?.trim()
      ? { deliveryWindow: input.deliveryWindow.trim().slice(0, 160) }
      : {}),
    status: 'draft',
    createdAt: createdAt.toISOString(),
    expiresAt: new Date(createdAt.getTime() + SCOPE_OFFER_VALIDITY_MS).toISOString(),
    retainedUntil: new Date(createdAt.getTime() + SCOPE_OFFER_RETENTION_MS).toISOString(),
    notification: { status: 'pending' },
  }
}

export function approveScopeOffer(
  offer: ProductionScopeOffer,
  now: Date,
): ProductionScopeOffer | null {
  if (offer.status === 'accepted') return offer
  if (offer.status !== 'sent' || new Date(offer.expiresAt).getTime() <= now.getTime()) return null
  return { ...offer, status: 'accepted', acceptedAt: now.toISOString() }
}

export function declineScopeOffer(
  offer: ProductionScopeOffer,
  now: Date,
): ProductionScopeOffer | null {
  if (offer.status === 'declined') return offer
  if (offer.status !== 'sent' || new Date(offer.expiresAt).getTime() <= now.getTime()) return null
  return { ...offer, status: 'declined', declinedAt: now.toISOString() }
}

export function markScopeReviewNotification(
  review: ProductionScopeReview,
  status: 'sent' | 'failed',
  attemptedAt: Date,
): ProductionScopeReview {
  return {
    ...review,
    updatedAt: attemptedAt.toISOString(),
    notification: { status, attemptedAt: attemptedAt.toISOString() },
  }
}

export function buildScopeReviewNotificationText(
  lead: ProductionCheckLead,
  review: ProductionScopeReview,
  reportUrl: string,
  operatorUrl: string,
): string {
  return [
    'Production Check engineer scope review',
    '',
    `Scope review ID: ${review.id}`,
    `Lead ID: ${lead.id}`,
    `Name: ${lead.name}`,
    `Email: ${lead.email}`,
    `App URL: ${lead.appUrl}`,
    `Builder: ${lead.builder ?? 'Not provided'}`,
    `Launch stage: ${lead.launchStage ?? 'Not provided'}`,
    `Help needed: ${lead.helpNeeded}`,
    `Timeline: ${lead.timeline}`,
    `Main concern: ${review.concern}`,
    `Limited access willingness: ${review.accessWillingness}`,
    ...(review.concernDetail ? [`Concern detail: ${review.concernDetail}`] : []),
    `Score: ${lead.score}`,
    `Segment: ${lead.segment}`,
    `Source: ${lead.attribution.source ?? 'Not provided'}`,
    '',
    'Sanitized scan summary:',
    `Public risk: ${lead.scanSummary.publicRisk}`,
    `FIX NOW: ${lead.scanSummary.fixNow}`,
    `REVIEW: ${lead.scanSummary.review}`,
    `EXPECTED: ${lead.scanSummary.expected}`,
    `Exposure band: ${lead.scanSummary.exposureBand}`,
    '',
    `Report: ${reportUrl}`,
    `Open secure operator review: ${operatorUrl}`,
    '',
    'Shipping context:',
    lead.shippingContext ?? 'No additional context provided.',
  ].join('\n')
}

function validateAmount(value: number | undefined): number | undefined {
  if (value === undefined) return undefined
  if (!Number.isSafeInteger(value) || value < 0 || value > 10_000_000) {
    throw new Error('Offer amount must be a valid whole-dollar value.')
  }
  return value
}

function cleanRequired(value: string, maximum: number): string {
  const cleaned = value.trim()
  if (!cleaned || cleaned.length > maximum) throw new Error('Offer text is missing or too long.')
  return cleaned
}

function cleanItems(values: string[], label: string, allowEmpty = false): string[] {
  const cleaned = values.map((value) => value.trim()).filter(Boolean)
  if ((!allowEmpty && cleaned.length === 0) || cleaned.length > 12) {
    throw new Error(`Offer ${label}s are missing or too numerous.`)
  }
  if (cleaned.some((value) => value.length > 500)) throw new Error(`An offer ${label} is too long.`)
  return cleaned
}
