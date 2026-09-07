import assert from 'node:assert/strict'
import test from 'node:test'

import { scoreFindings } from '../../src/scanner/scoring'
import type { ScanFinding } from '../../src/scanner/types'

function finding(
  category: ScanFinding['category'],
  riskPoints: number,
  classification: ScanFinding['classification'] = 'needs_proof',
): ScanFinding {
  return {
    id: `${category}-${riskPoints}-${classification}`,
    ruleId: 'fixture.rule',
    classification,
    category,
    title: 'Fixture',
    summary: 'Fixture',
    remediation: 'Fixture',
    evidence: {
      display: 'Fixture',
      sourceKind: 'javascript',
      sourceUrl: 'https://app.example/app.js',
    },
    riskPoints,
  }
}

test('applies category caps and gives by-design findings zero risk', () => {
  const score = scoreFindings([
    finding('credentials', 60, 'actually_bad'),
    finding('credentials', 60, 'actually_bad'),
    finding('security_headers', 18),
    finding('security_headers', 18),
    finding('admin_surface', 8),
    finding('architecture', 99, 'by_design'),
  ])

  assert.deepEqual(score.categoryDeductions, {
    security_headers: 20,
    credentials: 70,
    data_access: 0,
    admin_surface: 8,
    webhooks: 0,
    architecture: 0,
  })
  assert.equal(score.risk, 98)
  assert.equal(score.readiness, 2)
  assert.equal(score.band, 'critical')
})
