import type { ScanFinding, ScanResult } from '../../src/scanner/types'

export function finding(
  overrides: Partial<ScanFinding> & Pick<ScanFinding, 'ruleId' | 'classification'>,
): ScanFinding {
  return {
    id: `finding_${overrides.ruleId}`,
    category: 'credentials',
    title: 'Observed configuration',
    summary: 'A public-surface observation needs context.',
    remediation: 'Review this configuration in the application code.',
    evidence: {
      display: 'Configuration marker [redacted] (fingerprint: test1234)',
      sourceKind: 'javascript',
      sourceUrl: 'https://app.example/app.js',
    },
    riskPoints: 5,
    ...overrides,
  }
}

export function scanResult(findings: ScanFinding[] = []): ScanResult {
  const actuallyBad = findings.filter((item) => item.classification === 'actually_bad').length
  const needsProof = findings.filter((item) => item.classification === 'needs_proof').length
  const byDesign = findings.filter((item) => item.classification === 'by_design').length
  return {
    schemaVersion: 'scanner-v1',
    status: 'completed',
    target: {
      requestedUrl: 'https://app.example/',
      finalUrl: 'https://app.example/',
      httpStatus: 200,
    },
    score: {
      modelVersion: 'scanner-v1',
      scope: 'observed_public_surface',
      risk: actuallyBad * 35 + needsProof * 5,
      readiness: Math.max(0, 100 - actuallyBad * 35 - needsProof * 5),
      band: actuallyBad ? 'high' : needsProof ? 'moderate' : 'low',
      categoryDeductions: {
        security_headers: 0,
        credentials: actuallyBad * 35,
        data_access: needsProof * 5,
        admin_surface: 0,
        webhooks: 0,
        architecture: 0,
      },
    },
    assessment: {
      modelVersion: 'scanner-v1.1',
      exposure: { risk: actuallyBad * 35 + needsProof * 5, band: actuallyBad ? 'high' : needsProof ? 'moderate' : 'low', actuallyBad },
      coverage: { confidence: 'partial', score: 58, reasons: ['Only bounded public files were sampled.'] },
      productionProof: {
        scope: 'public_surface_only',
        total: 2,
        observedPublicEvidence: 0,
        needsCodeReview: 2,
        publicExposures: actuallyBad,
        checks: [],
      },
      recommendation: actuallyBad ? 'urgent_review' : 'code_review',
      headline: 'Code review recommended.',
      groups: [],
    },
    summary: { total: findings.length, actuallyBad, needsProof, byDesign },
    findings,
    checks: [],
    coverage: {
      scope: 'bounded_public_surface',
      completeness: 'complete',
      documents: { discovered: 1, attempted: 1, scanned: 1 },
      metadata: { discovered: 0, attempted: 0, scanned: 0 },
      scripts: { discovered: 1, attempted: 1, scanned: 1 },
      findings: { observedAtLeast: findings.length, returned: findings.length, truncated: false, omittedByCategory: [] },
      bytesScanned: 1024,
      redirectsFollowed: 0,
      skipped: [],
      limitsReached: [],
    },
    limitations: ['Public-surface assessment only.'],
    durationMs: 250,
  }
}
