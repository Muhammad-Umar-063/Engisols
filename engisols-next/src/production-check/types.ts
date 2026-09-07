import type { DetectedTechnology, ScanPhase, ScanProgressEvent, ScanResult } from '../scanner/types'

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

export interface PersistedScan {
  publicId: string
  status: PersistedScanStatus
  requestedUrl: string
  progress: ScanProgressSnapshot
  answers: ScanAnswers
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
  complete(publicId: string, result: ScanResult): Promise<void>
  fail(publicId: string, error: NonNullable<PersistedScan['error']>): Promise<void>
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
