import {
  FINDING_CATEGORIES,
  FINDING_CLASSIFICATION_RANK,
  type FindingGroupId,
  CoverageConfidence,
  FindingClassification,
  ProductionProofCheck,
  ScanAssessment,
  ScanCoverage,
  ScanFinding,
  ScanFindingGroup,
  ScanResult,
  ScanScore,
  ScanSourceKind,
} from './types'

interface AssessmentInput {
  status: ScanResult['status']
  coverage: ScanCoverage
  findings: readonly ScanFinding[]
  score: ScanScore
}

const sourceKindOrder: ScanSourceKind[] = ['headers', 'html', 'javascript']

const codeOnlyCheckTemplates: readonly Readonly<ProductionProofCheck>[] = [
  {
    id: 'authentication_enforcement',
    title: 'Authentication enforcement',
    status: 'needs_code_review',
    summary: 'Public files cannot prove that protected operations require a valid authenticated session.',
  },
  {
    id: 'authorization_and_rls',
    title: 'Authorization and data policies',
    status: 'needs_code_review',
    summary: 'The scan did not test authorization decisions, tenant boundaries, or Supabase RLS behavior.',
  },
  {
    id: 'api_access_control',
    title: 'API access control',
    status: 'needs_code_review',
    summary: 'The scanner did not call discovered APIs or verify endpoint authorization.',
  },
  {
    id: 'server_secret_handling',
    title: 'Server-side secret handling',
    status: 'needs_code_review',
    summary: 'Absence from sampled public files does not prove that server-side secrets are stored or used safely.',
  },
  {
    id: 'payment_authorization',
    title: 'Payment authorization',
    status: 'needs_code_review',
    summary: 'The scan did not verify server-side payment amount, product, customer, or webhook authorization.',
  },
  {
    id: 'rate_limiting',
    title: 'Abuse protection and rate limiting',
    status: 'needs_code_review',
    summary: 'Passive public analysis cannot prove endpoint-specific abuse controls.',
  },
  {
    id: 'dependency_security',
    title: 'Dependency and build security',
    status: 'needs_code_review',
    summary: 'Public bundles do not provide a reliable dependency inventory or build-pipeline assessment.',
  },
]

export function buildScanAssessment(input: AssessmentInput): ScanAssessment {
  const actuallyBad = input.findings.filter(
    ({ classification }) => classification === 'actually_bad',
  ).length
  const coverage = assessCoverage(input.status, input.coverage)
  const checks = buildProductionProofChecks(input.findings)
  const publicExposures = checks.filter(
    ({ status }) => status === 'public_exposure_detected',
  ).length
  const needsCodeReview = checks.filter(
    ({ status }) => status === 'needs_code_review',
  ).length
  const observedPublicEvidence = checks.filter(
    ({ status }) => status === 'observed_public_evidence',
  ).length
  const recommendation = actuallyBad > 0 ? 'urgent_review' : 'code_review'

  return {
    modelVersion: 'scanner-v1.1',
    exposure: {
      risk: input.score.risk,
      band: input.score.band,
      actuallyBad,
    },
    coverage,
    productionProof: {
      scope: 'public_surface_only',
      total: checks.length,
      observedPublicEvidence,
      needsCodeReview,
      publicExposures,
      checks,
    },
    recommendation,
    headline: buildHeadline(actuallyBad, coverage.confidence),
    groups: groupFindings(input.findings),
  }
}

function assessCoverage(
  status: ScanResult['status'],
  coverage: ScanCoverage,
): ScanAssessment['coverage'] {
  const documentRatio = ratio(
    coverage.documents.scanned,
    coverage.documents.discovered,
  )
  const scriptRatio = ratio(
    coverage.scripts.scanned,
    coverage.scripts.discovered,
  )
  const metadataRatio = ratio(
    coverage.metadata.scanned,
    coverage.metadata.discovered,
  )
  const fetchFailures = coverage.skipped
    .filter(({ reason }) => reason.endsWith('_fetch_failed'))
    .reduce((total, { count }) => total + count, 0)
  const unresolved = coverage.skipped
    .filter(({ reason }) =>
      ['cross_origin_script', 'unresolved_script_specifier'].includes(reason),
    )
    .reduce((total, { count }) => total + count, 0)
  const unsafeRouteReferences = coverage.skipped
    .filter(({ reason }) =>
      ['unsafe_route', 'unsafe_metadata_reference'].includes(reason),
    )
    .reduce((total, { count }) => total + count, 0)

  let score =
    25 +
    Math.round(documentRatio * 25) +
    Math.round(scriptRatio * 40) +
    Math.round(metadataRatio * 10)
  if (status === 'partial') score -= 10
  score -= Math.min(24, coverage.limitsReached.length * 12)
  score -= Math.min(15, fetchFailures * 2)
  score -= Math.min(10, unresolved)
  score = Math.max(0, Math.min(100, score))

  let confidence: CoverageConfidence
  if (status === 'completed' && score >= 95) {
    confidence = 'strong'
  } else if (score >= 50) {
    confidence = 'partial'
  } else {
    confidence = 'limited'
  }

  const reasons: string[] = []
  if (coverage.documents.scanned < coverage.documents.discovered) {
    reasons.push(
      `${coverage.documents.scanned} of ${coverage.documents.discovered} discovered documents were scanned.`,
    )
  }
  if (coverage.scripts.scanned < coverage.scripts.discovered) {
    reasons.push(
      `${coverage.scripts.scanned} of ${coverage.scripts.discovered} discovered scripts were scanned.`,
    )
  }
  if (coverage.metadata.scanned < coverage.metadata.discovered) {
    reasons.push(
      `${coverage.metadata.scanned} of ${coverage.metadata.discovered} optional discovery documents were available and scanned.`,
    )
  }
  if (coverage.limitsReached.length > 0) {
    reasons.push(
      `Safety limits reached: ${coverage.limitsReached.join(', ')}.`,
    )
  }
  if (fetchFailures > 0) {
    reasons.push(`${fetchFailures} discovered resources could not be fetched.`)
  }
  if (unresolved > 0) {
    reasons.push(
      `${unresolved} cross-origin or runtime-resolved script references were not scanned.`,
    )
  }
  if (unsafeRouteReferences > 0) {
    reasons.push(
      `${unsafeRouteReferences} route references were excluded from passive traversal by the route safety policy.`,
    )
  }
  if (reasons.length === 0) {
    reasons.push('All discovered resources within the bounded public scan were processed.')
  }

  return { confidence, score, reasons }
}

function buildProductionProofChecks(
  findings: readonly ScanFinding[],
): ProductionProofCheck[] {
  const credentialExposure = findings.some(
    ({ category, classification }) =>
      category === 'credentials' && classification === 'actually_bad',
  )
  const missingHeaders = findings.some(
    ({ category, classification }) =>
      category === 'security_headers' && classification === 'needs_proof',
  )
  const adminSurface = findings.some(
    ({ category }) => category === 'admin_surface',
  )

  return [
    {
      id: 'public_credential_exposure',
      title: 'Public credential exposure',
      status: credentialExposure
        ? 'public_exposure_detected'
        : 'observed_public_evidence',
      summary: credentialExposure
        ? 'A high-confidence server credential pattern was observed in sampled public content.'
        : 'No high-confidence server credential pattern was observed in sampled public content.',
    },
    {
      id: 'security_header_posture',
      title: 'Browser security headers',
      status: missingHeaders
        ? 'needs_code_review'
        : 'observed_public_evidence',
      summary: missingHeaders
        ? 'One or more recommended response protections were not observed.'
        : 'The checked response protections were observed on the primary HTML response.',
    },
    {
      id: 'administrative_surface',
      title: 'Administrative client surface',
      status: adminSurface
        ? 'needs_code_review'
        : 'observed_public_evidence',
      summary: adminSurface
        ? 'Administrative-looking client routes require authorization review.'
        : 'No administrative-looking route was observed in the sampled public content.',
    },
    ...codeOnlyCheckTemplates.map((check) => ({ ...check })),
  ]
}

function groupFindings(findings: readonly ScanFinding[]): ScanFindingGroup[] {
  const grouped = new Map<FindingGroupId, ScanFinding[]>()
  for (const finding of findings) {
    const id = findingGroupId(finding)
    grouped.set(id, [...(grouped.get(id) ?? []), finding])
  }

  return [...grouped.entries()]
    .map(([id, items]) => makeGroup(id, items))
    .sort((left, right) => groupOrder(left.id) - groupOrder(right.id))
}

function findingGroupId(finding: ScanFinding): FindingGroupId {
  if (finding.ruleId.startsWith('header.')) return 'security_headers'
  if (
    finding.ruleId === 'supabase.publishable_key' ||
    finding.ruleId === 'architecture.browser_supabase' ||
    finding.ruleId === 'supabase.table_reference' ||
    finding.ruleId === 'supabase.sensitive_table'
  ) {
    return 'supabase_public_architecture'
  }
  if (finding.ruleId === 'route.admin_surface') {
    return 'administrative_surface'
  }
  if (finding.category === 'webhooks') return 'webhooks'
  if (
    finding.category === 'credentials' &&
    finding.classification === 'actually_bad'
  ) {
    return 'server_credentials'
  }
  if (finding.category === 'credentials') return 'public_client_configuration'
  return 'additional_observations'
}

function makeGroup(
  id: FindingGroupId,
  findings: readonly ScanFinding[],
): ScanFindingGroup {
  const definition = groupDefinitions[id]
  return {
    id,
    classification: highestClassification(findings),
    categories: uniqueSorted(
      findings.map(({ category }) => category),
      FINDING_CATEGORIES,
    ),
    title: definition.title,
    summary: definition.summary,
    remediation: definition.remediation,
    findingCount: findings.length,
    ruleIds: [...new Set(findings.map(({ ruleId }) => ruleId))].sort(),
    sourceKinds: uniqueSorted(
      findings.map(({ evidence }) => evidence.sourceKind),
      sourceKindOrder,
    ),
  }
}

type GroupDefinition = Pick<
  ScanFindingGroup,
  'title' | 'summary' | 'remediation'
> & { order: number }

const groupDefinitions: Readonly<Record<FindingGroupId, GroupDefinition>> = {
  server_credentials: {
    order: 0,
    title: 'Potential server credential exposure',
    summary: 'A high-confidence server credential pattern was observed in sampled public content.',
    remediation: 'Rotate the affected credential and move privileged operations to a trusted server boundary.',
  },
  webhooks: {
    order: 1,
    title: 'Hardcoded webhook endpoints need review',
    summary: 'One or more webhook-shaped endpoints were observed in public content.',
    remediation: 'Confirm that public webhook URLs are intentional, scoped, monitored, and safely replaceable.',
  },
  security_headers: {
    order: 2,
        title: 'Browser security protections need review',
        summary: 'One or more recommended response headers were not observed on the primary page.',
        remediation: 'Review the grouped header checks and deploy policies appropriate to the application.',
  },
  supabase_public_architecture: {
    order: 3,
        title: 'Public Supabase architecture needs authorization proof',
        summary: 'Browser-side Supabase usage is supported by design, but referenced data paths require policy review.',
        remediation: 'Keep privileged keys server-side and verify every referenced table with automated RLS tests.',
  },
  administrative_surface: {
    order: 4,
        title: 'Administrative client surface observed',
        summary: 'Administrative-looking routes are not vulnerabilities by themselves and require access-control proof.',
        remediation: 'Verify server-side authentication and authorization for every administrative operation.',
  },
  public_client_configuration: {
    order: 5,
        title: 'Public client configuration observed',
        summary: 'Client-safe public configuration was observed and is not treated as a server secret.',
        remediation: 'Retain least privilege and keep all privileged credentials server-side.',
  },
  additional_observations: {
    order: 6,
        title: 'Additional public-surface observations',
        summary: 'Related deterministic observations were grouped to keep the report concise.',
        remediation: 'Review the underlying checks and confirm the intended production control.',
  },
}

function highestClassification(
  findings: readonly ScanFinding[],
): FindingClassification {
  return findings.reduce<FindingClassification>(
    (highest, { classification }) =>
      FINDING_CLASSIFICATION_RANK[classification] <
      FINDING_CLASSIFICATION_RANK[highest]
        ? classification
        : highest,
    'by_design',
  )
}

function uniqueSorted<T>(values: readonly T[], order: readonly T[]): T[] {
  return [...new Set(values)].sort(
    (left, right) => order.indexOf(left) - order.indexOf(right),
  )
}

function groupOrder(id: FindingGroupId): number {
  return groupDefinitions[id].order
}

function ratio(scanned: number, discovered: number): number {
  if (discovered <= 0) return 1
  return Math.max(0, Math.min(1, scanned / discovered))
}

function buildHeadline(
  actuallyBad: number,
  confidence: CoverageConfidence,
): string {
  if (actuallyBad > 0) {
    return 'Potentially serious public exposure detected; urgent review is recommended.'
  }
  if (confidence === 'limited') {
    return 'No critical exposure was observed with limited public coverage; code-level verification is recommended.'
  }
  if (confidence === 'partial') {
    return 'No critical exposure was observed in the sampled public surface; code-level verification is recommended.'
  }
  return 'No critical public exposure was observed; production controls still require code-level verification.'
}
