import type { DetectedTechnology, ScanPhase, ScanProgressEvent, ScanResult } from '../scanner/types'
import type {
  ProductionCheckLeadMetaTracking,
  ProductionCheckScanMetaTracking,
} from '../meta/types'

export const BUILDER_ANSWERS = [
  'lovable',
  'bolt',
  'cursor',
  'v0',
  'replit',
  'claude_code',
  'other',
  'not_sure',
] as const
export type BuilderAnswer = (typeof BUILDER_ANSWERS)[number]

export const LAUNCH_STAGE_ANSWERS = [
  'experimenting',
  'preparing_to_launch',
  'has_users',
  'taking_payments',
] as const
export type LaunchStageAnswer = (typeof LAUNCH_STAGE_ANSWERS)[number]

export type PersistedScanStatus =
  | 'queued'
  | 'running'
  | 'completed'
  | 'partial'
  | 'failed'

export interface ScanProgressSnapshot {
  phase: ScanPhase
  progress: number
  message: string
  events: ScanProgressEvent[]
}

export interface ScanAnswers {
  builder?: BuilderAnswer
  launchStage?: LaunchStageAnswer
}

export interface ProductionCheckAttribution {
  source?: string
  medium?: string
  campaign?: string
  content?: string
  term?: string
  fbclid?: string
}

export interface PersistedScan {
  publicId: string
  status: PersistedScanStatus
  requestedUrl: string
  progress: ScanProgressSnapshot
  answers: ScanAnswers
  attribution: ProductionCheckAttribution
  metaTracking?: ProductionCheckScanMetaTracking
  metaEvents?: {
    scanStarted?: string
    scanCompleted?: string
  }
  result?: ScanResult
  error?: {
    code: 'target_blocked' | 'target_unavailable' | 'scan_failed'
    message: string
  }
  createdAt: string
  expiresAt: string
}

export interface ScanStore {
  create(scan: PersistedScan): Promise<void>
  get(publicId: string): Promise<PersistedScan | null>
  updateProgress(publicId: string, progress: ScanProgressSnapshot): Promise<void>
  updateStatus(publicId: string, status: PersistedScanStatus): Promise<void>
  updateAnswers(publicId: string, answers: ScanAnswers): Promise<boolean>
  updateMetaTracking(
    publicId: string,
    metaTracking: ProductionCheckScanMetaTracking,
  ): Promise<boolean>
  complete(publicId: string, result: ScanResult): Promise<void>
  fail(publicId: string, error: NonNullable<PersistedScan['error']>): Promise<void>
}

export type ProductionCheckLeadSegment = 'nurture' | 'maybe' | 'qualified'
export type ProductionCheckLeadStatus = 'new' | 'contacted' | 'booked' | 'proposal' | 'won' | 'lost'
export type ProductionCheckLeadNextStep =
  | 'report_guidance'
  | 'engineer_scope_check'

export interface ProductionCheckLead {
  id: string
  scanId: string
  createdAt: string
  updatedAt: string
  expiresAt: string
  name: string
  email: string
  company?: string
  appUrl: string
  builder?: BuilderAnswer
  launchStage?: LaunchStageAnswer
  helpNeeded: 'verify' | 'fix' | 'ongoing'
  timeline: 'now' | 'month' | 'quarter' | 'exploring'
  shippingContext?: string
  attribution: ProductionCheckAttribution
  score: number
  segment: ProductionCheckLeadSegment
  status: ProductionCheckLeadStatus
  estimatedValue?: number
  scanSummary: {
    publicRisk: number
    fixNow: number
    review: number
    expected: number
    exposureBand: string
  }
  notification: {
    status: 'pending' | 'sent' | 'failed'
    attemptedAt?: string
  }
  metaTracking?: ProductionCheckLeadMetaTracking
}

export interface LeadStore {
  createOrGet(lead: ProductionCheckLead): Promise<{
    lead: ProductionCheckLead
    created: boolean
  }>
  claimFailedNotification(id: string, updatedAt: string): Promise<ProductionCheckLead | null>
  save(lead: ProductionCheckLead): Promise<void>
  get(id: string): Promise<ProductionCheckLead | null>
}

export const SCOPE_CONCERNS = [
  'security_customer_data',
  'payments',
  'authentication_access',
  'reliability_bugs',
  'launch_readiness',
  'scaling_architecture',
  'ongoing_development',
  'other',
] as const
export type ScopeConcern = (typeof SCOPE_CONCERNS)[number]

export type ScopeAccessWillingness = 'yes_after_review' | 'not_yet'
export type ScopeReviewStatus =
  | 'pending_review'
  | 'needs_information'
  | 'no_paid_work'
  | 'offer_prepared'
  | 'offer_sent'
  | 'accepted'
  | 'declined'
export const SCOPE_DECISIONS = [
  'no_paid_work',
  'needs_information',
  'launch_blocker_fix',
  'production_harden',
  'ongoing_engineering',
  'custom',
] as const
export type ScopeDecision = (typeof SCOPE_DECISIONS)[number]

export interface ProductionScopeReview {
  id: string
  leadId: string
  scanId: string
  concern: ScopeConcern
  concernDetail?: string
  accessWillingness: ScopeAccessWillingness
  status: ScopeReviewStatus
  decision?: ScopeDecision
  requestedAt: string
  reviewedAt?: string
  updatedAt: string
  expiresAt: string
  recommendationSummary?: string
  informationRequested?: string
  internalNotes?: string
  offerId?: string
  notification: {
    status: 'pending' | 'sent' | 'failed'
    attemptedAt?: string
  }
  decisionNotification?: {
    status: 'pending' | 'sent' | 'failed'
    attemptedAt?: string
  }
}

export interface ScopeReviewStore {
  createOrGet(review: ProductionScopeReview): Promise<{
    review: ProductionScopeReview
    created: boolean
  }>
  save(review: ProductionScopeReview): Promise<void>
  get(id: string): Promise<ProductionScopeReview | null>
}

export type ScopeOfferType =
  | 'launch_blocker_fix'
  | 'production_harden'
  | 'ongoing_engineering'
  | 'custom'
export type ScopeOfferBilling = 'one_time' | 'monthly' | 'custom'
export type ScopeOfferStatus = 'draft' | 'sent' | 'accepted' | 'declined' | 'expired'
export type ScopeOfferDecisionReviewSyncStatus = 'pending' | 'synced' | 'failed'
export type ScopeOfferDecisionNotificationStatus = 'pending' | 'sent' | 'failed'

export interface ProductionScopeOffer {
  id: string
  scopeReviewId: string
  leadId: string
  scanId: string
  type: ScopeOfferType
  title: string
  summary: string
  includedItems: string[]
  exclusions: string[]
  amount?: number
  currency: 'USD'
  billing: ScopeOfferBilling
  deliveryWindow?: string
  status: ScopeOfferStatus
  createdAt: string
  sentAt?: string
  acceptedAt?: string
  declinedAt?: string
  expiresAt: string
  retainedUntil: string
  notification: {
    status: 'pending' | 'sent' | 'failed'
    attemptedAt?: string
  }
  decisionReviewSync?: {
    status: ScopeOfferDecisionReviewSyncStatus
    attemptedAt?: string
  }
  decisionNotification?: {
    status: ScopeOfferDecisionNotificationStatus
    attemptedAt?: string
  }
}

export interface ScopeOfferStore {
  claimForReview(offer: ProductionScopeOffer): Promise<{
    offer: ProductionScopeOffer
    created: boolean
  }>
  get(id: string): Promise<ProductionScopeOffer | null>
  markSent(id: string, sentAt: string): Promise<ProductionScopeOffer | null>
  markSendFailed(id: string, attemptedAt: string): Promise<ProductionScopeOffer | null>
  transitionDecision(
    id: string,
    decision: 'accepted' | 'declined',
    decidedAt: string,
  ): Promise<ProductionScopeOffer | null>
  recordDecisionReconciliation(
    id: string,
    update: {
      reviewSync?: Exclude<ScopeOfferDecisionReviewSyncStatus, 'pending'>
      notification?: Exclude<ScopeOfferDecisionNotificationStatus, 'pending'>
    },
    attemptedAt: string,
  ): Promise<ProductionScopeOffer | null>
}

export type FounderLabel = 'FIX NOW' | 'REVIEW' | 'EXPECTED'

export interface FounderFinding {
  id: string
  ruleId: string
  label: FounderLabel
  title: string
  whyItMatters: string
  whatWeFound: string
  whatWeCannotVerify?: string
  recommendedAction: string
  riskPoints: number
  technical: {
    category: string
    sourceKind: string
    location: string
    evidence: string
  }
}

export interface FounderReport {
  verdict: string
  publicSurfaceRisk: number
  exposureBand: ScanResult['assessment']['exposure']['band']
  counts: { fixNow: number; review: number; expected: number }
  coverage: ScanResult['assessment']['coverage']
  productionProof: ScanResult['assessment']['productionProof']
  findings: FounderFinding[]
  detectedTechnologies: DetectedTechnology[]
  startHere: {
    ruleId: string
    title: string
    action: string
  }
  builderPrompt?: {
    label: string
    prompt: string
  }
}
