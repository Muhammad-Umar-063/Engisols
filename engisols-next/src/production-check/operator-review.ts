import { containsCredentialLikeValue } from './security'
import { SCOPE_DECISIONS } from './types'
import type {
  ProductionScopeOffer,
  ProductionScopeReview,
  ScopeDecision,
  ScopeOfferBilling,
  ScopeOfferType,
} from './types'

export interface OperatorDecisionSubmission {
  decision: ScopeDecision
  recommendationSummary: string
  informationRequested: string
  title: string
  includedItems: string[]
  exclusions: string[]
  deliveryWindow: string
  amount?: number
  billing?: ScopeOfferBilling
  internalNotes: string
}

const paidDecisions = new Set<ScopeDecision>([
  'launch_blocker_fix', 'production_harden', 'ongoing_engineering', 'custom',
])

export function parseOperatorDecisionSubmission(value: unknown): OperatorDecisionSubmission | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const allowed = new Set([
    'decision', 'recommendationSummary', 'informationRequested', 'title',
    'includedItems', 'exclusions', 'deliveryWindow', 'amount', 'billing', 'internalNotes',
  ])
  if (Object.keys(value).some((key) => !allowed.has(key))) return null
  const input = value as Record<string, unknown>
  const decision = input.decision
  if (!isDecision(decision)) return null
  const textKeys = ['recommendationSummary', 'informationRequested', 'title', 'deliveryWindow', 'internalNotes'] as const
  if (textKeys.some((key) => input[key] !== undefined && typeof input[key] !== 'string')) return null
  if (input.includedItems !== undefined && (!Array.isArray(input.includedItems) || !input.includedItems.every((item) => typeof item === 'string'))) return null
  if (input.exclusions !== undefined && (!Array.isArray(input.exclusions) || !input.exclusions.every((item) => typeof item === 'string'))) return null
  if (input.amount !== undefined && typeof input.amount !== 'number') return null
  if (input.billing !== undefined && !['one_time', 'monthly', 'custom'].includes(String(input.billing))) return null

  const submission: OperatorDecisionSubmission = {
    decision,
    recommendationSummary: String(input.recommendationSummary ?? '').trim(),
    informationRequested: String(input.informationRequested ?? '').trim(),
    title: String(input.title ?? '').trim(),
    includedItems: (input.includedItems as string[] | undefined ?? []).map((item) => item.trim()).filter(Boolean),
    exclusions: (input.exclusions as string[] | undefined ?? []).map((item) => item.trim()).filter(Boolean),
    deliveryWindow: String(input.deliveryWindow ?? '').trim(),
    ...(typeof input.amount === 'number' ? { amount: input.amount } : {}),
    ...(input.billing ? { billing: input.billing as ScopeOfferBilling } : {}),
    internalNotes: String(input.internalNotes ?? '').trim(),
  }
  if (!submission.recommendationSummary || submission.recommendationSummary.length > 2_000) return null
  if (submission.informationRequested.length > 2_000 || submission.internalNotes.length > 4_000) return null
  if (decision === 'needs_information' && !submission.informationRequested) return null
  if (paidDecisions.has(decision) && submission.includedItems.length === 0) return null
  if (containsCredentialLikeValue(submission)) return null
  return submission
}

export function isPaidScopeDecision(decision: ScopeDecision): decision is ScopeOfferType {
  return paidDecisions.has(decision)
}

export function parseOptionalOfferAmount(value: string): number | undefined {
  const amount = value.trim()
  return amount ? Number(amount) : undefined
}

export function noPaidWorkEmailText(review: ProductionScopeReview, summary: string): string {
  return [
    'Your Engisols Production Check review', '',
    'Nothing here currently justifies a paid engineering engagement.', '',
    summary, '',
    'Keep this report as a baseline and re-scan after material launch or deployment changes.',
    '', `Review reference: ${review.id}`,
  ].join('\n')
}

export function needsInformationEmailText(
  review: ProductionScopeReview,
  summary: string,
  informationRequested: string,
): string {
  return [
    'Your Engisols Production Check review', '', summary, '',
    'What we need to verify:', informationRequested, '',
    'Do not send passwords or credentials. Reply with the requested screenshots or arrange limited read-only access if appropriate.',
    '', `Review reference: ${review.id}`,
  ].join('\n')
}

export function scopeOfferEmailText(offer: ProductionScopeOffer, offerUrl: string): string {
  return [
    'Your recommended next step from Engisols', '', offer.title, '', offer.summary, '',
    'Review the exact inclusions, exclusions, delivery window, and price:', offerUrl, '',
    'Approving the scope does not take payment. Payment and onboarding instructions follow separately.',
  ].join('\n')
}

function isDecision(value: unknown): value is ScopeDecision {
  return typeof value === 'string' && SCOPE_DECISIONS.includes(value as ScopeDecision)
}
