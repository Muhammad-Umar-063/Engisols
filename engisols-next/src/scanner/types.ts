export const FINDING_CLASSIFICATION_RANK = {
  actually_bad: 0,
  needs_proof: 1,
  by_design: 2,
} as const

export type FindingClassification = keyof typeof FINDING_CLASSIFICATION_RANK

export const FINDING_CATEGORIES = [
  'security_headers',
  'credentials',
  'data_access',
  'admin_surface',
  'webhooks',
  'architecture',
] as const

export type FindingCategory = (typeof FINDING_CATEGORIES)[number]

export type ScanSourceKind = 'headers' | 'html' | 'javascript'

export type CheckStatus = 'finding' | 'passed' | 'partial' | 'not_run'

export const SCAN_PHASES = [
  'validating',
  'fetching',
  'headers',
  'discovering_assets',
  'analyzing_assets',
  'classifying',
  'building_report',
  'complete',
] as const

export type ScanPhase = (typeof SCAN_PHASES)[number]

export type ScanProgressEventType =
  | 'phase'
  | 'observation'
  | 'technology'
  | 'summary'
  | 'complete'
  | 'partial'
  | 'error'

export interface ScanProgressEvent {
  type: ScanProgressEventType
  phase?: ScanPhase
  progress?: number
  message: string
  detail?: string
  timestamp: string
  metadata?: {
    processed?: number
    total?: number
    technology?: string
    classification?: 'expected' | 'review' | 'fix_now'
  }
}

export type ScanProgressObserver = (event: ScanProgressEvent) => void

export interface DetectedTechnology {
  name: string
  confidence: 'confirmed' | 'likely' | 'possible'
}

export interface ScanFinding {
  id: string
  ruleId: string
  classification: FindingClassification
  category: FindingCategory
  title: string
  summary: string
  remediation: string
  evidence: {
    display: string
    sourceKind: ScanSourceKind
    sourceUrl: string
  }
  riskPoints: number
}

export interface ScanCheck {
  id: string
  title: string
  status: CheckStatus
  findingIds: string[]
}

export interface ScanCoverageCount {
  discovered: number
  attempted: number
  scanned: number
}

export interface ScanCoverage {
  scope: 'bounded_public_surface'
  completeness: 'complete' | 'partial'
  documents: ScanCoverageCount
  metadata: ScanCoverageCount
  scripts: ScanCoverageCount
  findings: {
    observedAtLeast: number
    returned: number
    truncated: boolean
    omittedByCategory: Array<{ category: FindingCategory; count: number }>
  }
  bytesScanned: number
  redirectsFollowed: number
  skipped: Array<{ reason: string; count: number }>
  limitsReached: string[]
}

export interface ScanScore {
  modelVersion: 'scanner-v1'
  scope: 'observed_public_surface'
  risk: number
  /** @deprecated This inverse risk value is not a production-readiness claim. Use assessment instead. */
  readiness: number
  band: 'low' | 'moderate' | 'high' | 'critical'
  categoryDeductions: Record<FindingCategory, number>
}

export type CoverageConfidence = 'limited' | 'partial' | 'strong'

export type ProductionProofStatus =
  | 'observed_public_evidence'
  | 'needs_code_review'
  | 'public_exposure_detected'

export type ScanRecommendation =
  | 'monitor'
  | 'code_review'
  | 'urgent_review'

export type FindingGroupId =
  | 'server_credentials'
  | 'webhooks'
  | 'security_headers'
  | 'supabase_public_architecture'
  | 'administrative_surface'
  | 'public_client_configuration'
  | 'additional_observations'

export interface ScanFindingGroup {
  id: FindingGroupId
  classification: FindingClassification
  categories: FindingCategory[]
  title: string
  summary: string
  remediation: string
  findingCount: number
  ruleIds: string[]
  sourceKinds: ScanSourceKind[]
}

export interface ProductionProofCheck {
  id: string
  title: string
  status: ProductionProofStatus
  summary: string
}

export interface ScanAssessment {
  modelVersion: 'scanner-v1.1'
  exposure: {
    risk: number
    band: ScanScore['band']
    actuallyBad: number
  }
  coverage: {
    confidence: CoverageConfidence
    score: number
    reasons: string[]
  }
  productionProof: {
    scope: 'public_surface_only'
    total: number
    observedPublicEvidence: number
    needsCodeReview: number
    publicExposures: number
    checks: ProductionProofCheck[]
  }
  recommendation: ScanRecommendation
  headline: string
  groups: ScanFindingGroup[]
}

export interface ScanResult {
  schemaVersion: 'scanner-v1'
  status: 'completed' | 'partial'
  target: {
    requestedUrl: string
    finalUrl: string
    httpStatus: number
  }
  score: ScanScore
  assessment: ScanAssessment
  summary: {
    total: number
    byDesign: number
    needsProof: number
    actuallyBad: number
  }
  findings: ScanFinding[]
  checks: ScanCheck[]
  coverage: ScanCoverage
  limitations: string[]
  durationMs: number
}

export type PublicScanErrorCode =
  | 'invalid_request'
  | 'target_blocked'
  | 'target_unavailable'
  | 'scan_capacity_reached'

export interface PublicScanError {
  ok: false
  error: {
    schemaVersion: 'scanner-v1'
    code: PublicScanErrorCode
    message: string
  }
}

export type ScanApiResponse =
  | { ok: true; result: ScanResult }
  | PublicScanError

export interface ScanLimits {
  requestBodyTimeoutMs: number
  requestTimeoutMs: number
  totalTimeoutMs: number
  maxRedirects: number
  maxHtmlBytes: number
  maxMetadataBytes: number
  maxJavaScriptBytes: number
  maxTotalBytes: number
  maxHeaderBytes: number
  maxDocuments: number
  maxMetadataDocuments: number
  maxAdditionalRoutes: number
  maxJavaScriptAssets: number
  maxDiscoveredJavaScriptAssets: number
  maxJavaScriptDepth: number
  maxFindings: number
  maxConcurrentScans: number
  maxRequestBodyBytes: number
}
