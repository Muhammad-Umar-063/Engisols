import assert from 'node:assert/strict'
import test from 'node:test'

import { buildScanAssessment } from '../../src/scanner/assessment'
import { scoreFindings } from '../../src/scanner/scoring'
import type {
  ScanCoverage,
  ScanFinding,
} from '../../src/scanner/types'

function coverage(overrides: Partial<ScanCoverage> = {}): ScanCoverage {
  return {
    scope: 'bounded_public_surface',
    completeness: 'complete',
    documents: { discovered: 2, attempted: 2, scanned: 2 },
    metadata: { discovered: 0, attempted: 0, scanned: 0 },
    scripts: { discovered: 4, attempted: 4, scanned: 4 },
    findings: {
      observedAtLeast: 0,
      returned: 0,
      truncated: false,
      omittedByCategory: [],
    },
    bytesScanned: 10_000,
    redirectsFollowed: 0,
    skipped: [],
    limitsReached: [],
    ...overrides,
  }
}

function finding(
  ruleId: string,
  classification: ScanFinding['classification'],
  category: ScanFinding['category'],
): ScanFinding {
  return {
    id: `${ruleId}-${classification}`,
    ruleId,
    classification,
    category,
    title: ruleId,
    summary: 'Conservative fixture summary.',
    remediation: 'Review the implementation.',
    evidence: {
      display: 'redacted fixture',
      sourceKind: 'javascript',
      sourceUrl: 'https://app.example/app.js',
    },
    riskPoints: classification === 'actually_bad' ? 45 : 4,
  }
}

test('separates exposure risk from strong public-surface coverage', () => {
  const assessment = buildScanAssessment({
    status: 'completed',
    coverage: coverage(),
    findings: [],
    score: scoreFindings([]),
  })

  assert.equal(assessment.modelVersion, 'scanner-v1.1')
  assert.deepEqual(assessment.exposure, {
    risk: 0,
    band: 'low',
    actuallyBad: 0,
  })
  assert.equal(assessment.coverage.confidence, 'strong')
  assert.equal(assessment.coverage.score, 100)
  assert.equal(assessment.productionProof.total, 10)
  assert.equal(assessment.productionProof.needsCodeReview, 7)
  assert.equal(assessment.recommendation, 'code_review')
  assert.match(assessment.headline, /code-level verification/i)
})

test('never presents partial sparse bundle coverage as strong', () => {
  const assessment = buildScanAssessment({
    status: 'partial',
    coverage: coverage({
      completeness: 'partial',
      scripts: { discovered: 96, attempted: 5, scanned: 5 },
      skipped: [{ reason: 'script_fetch_failed', count: 2 }],
      limitsReached: ['total_timeout'],
    }),
    findings: [],
    score: scoreFindings([]),
  })

  assert.equal(assessment.coverage.confidence, 'limited')
  assert.ok(assessment.coverage.score < 50)
  assert.equal(assessment.recommendation, 'code_review')
  assert.match(assessment.headline, /limited public coverage/i)
})

test('groups repeated findings into stable client-facing themes', () => {
  const findings = [
    finding('header.csp_missing', 'needs_proof', 'security_headers'),
    finding(
      'header.permissions_policy_missing',
      'needs_proof',
      'security_headers',
    ),
    finding('supabase.publishable_key', 'by_design', 'credentials'),
    finding('architecture.browser_supabase', 'by_design', 'architecture'),
    finding('supabase.table_reference', 'needs_proof', 'data_access'),
    finding('supabase.table_reference', 'needs_proof', 'data_access'),
    finding('route.admin_surface', 'needs_proof', 'admin_surface'),
  ]
  const assessment = buildScanAssessment({
    status: 'completed',
    coverage: coverage(),
    findings,
    score: scoreFindings(findings),
  })

  assert.deepEqual(
    assessment.groups.map(({ id, classification, findingCount }) => ({
      id,
      classification,
      findingCount,
    })),
    [
      {
        id: 'security_headers',
        classification: 'needs_proof',
        findingCount: 2,
      },
      {
        id: 'supabase_public_architecture',
        classification: 'needs_proof',
        findingCount: 4,
      },
      {
        id: 'administrative_surface',
        classification: 'needs_proof',
        findingCount: 1,
      },
    ],
  )
  assert.equal(assessment.groups.length <= 8, true)
})

test('surfaces deterministic public secrets as urgent without exposing evidence', () => {
  const findings = [
    finding('stripe.secret_key', 'actually_bad', 'credentials'),
  ]
  const assessment = buildScanAssessment({
    status: 'completed',
    coverage: coverage(),
    findings,
    score: scoreFindings(findings),
  })

  assert.equal(assessment.exposure.band, 'high')
  assert.equal(assessment.exposure.actuallyBad, 1)
  assert.equal(assessment.recommendation, 'urgent_review')
  assert.equal(JSON.stringify(assessment).includes('redacted fixture'), false)
})

test('does not share mutable production-proof checks across assessments', () => {
  const input = {
    status: 'completed' as const,
    coverage: coverage(),
    findings: [],
    score: scoreFindings([]),
  }
  const first = buildScanAssessment(input)
  first.productionProof.checks[3]!.summary = 'mutated by a consumer'

  const second = buildScanAssessment(input)
  assert.notEqual(
    second.productionProof.checks[3]!.summary,
    'mutated by a consumer',
  )
})
