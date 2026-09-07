import assert from 'node:assert/strict'
import test from 'node:test'

import {
  buildFounderReport,
  createPublicScanId,
  sanitizeResultForPersistence,
} from '../../src/production-check/report'
import { finding, scanResult } from './fixtures'

test('creates high-entropy non-sequential public report ids', () => {
  const ids = new Set(Array.from({ length: 100 }, createPublicScanId))
  assert.equal(ids.size, 100)
  for (const id of ids) assert.match(id, /^rpt_[A-Za-z0-9_-]{24}$/)
})

test('maps scanner classifications to founder labels and prioritizes fix now', () => {
  const report = buildFounderReport(scanResult([
    finding({ ruleId: 'supabase.anon_key', classification: 'by_design', title: 'Supabase anon key is public' }),
    finding({ ruleId: 'route.admin', classification: 'needs_proof', title: 'Administrative route found', riskPoints: 8 }),
    finding({ ruleId: 'stripe.secret_key', classification: 'actually_bad', title: 'Server-side Stripe key detected', riskPoints: 40 }),
  ]))

  assert.deepEqual(report.counts, { fixNow: 1, review: 1, expected: 1 })
  assert.deepEqual(report.findings.map((item) => item.label), ['FIX NOW', 'REVIEW', 'EXPECTED'])
  assert.equal(report.startHere.ruleId, 'stripe.secret_key')
  assert.match(report.verdict, /public exposure/i)
  assert.equal(report.coverage.confidence, 'partial')
})

test('does not describe an expected-only partial scan as healthy or production-ready', () => {
  const report = buildFounderReport(scanResult([
    finding({ ruleId: 'stripe.publishable_key', classification: 'by_design' }),
  ]))
  assert.doesNotMatch(report.verdict, /healthy|ready|safe|secure/i)
  assert.match(report.verdict, /not proven|code review/i)
})

test('refuses to serialize a raw privileged credential at the persistence boundary', () => {
  const raw = `sk_live_${'A'.repeat(32)}`
  const result = scanResult([
    finding({
      ruleId: 'stripe.secret_key',
      classification: 'actually_bad',
      evidence: {
        display: raw,
        sourceKind: 'javascript',
        sourceUrl: 'https://app.example/app.js',
      },
    }),
  ])
  assert.throws(() => sanitizeResultForPersistence(result), /credential-like value/i)
})

test('serialized public reports retain sanitized evidence without raw secrets', () => {
  const result = sanitizeResultForPersistence(scanResult([
    finding({ ruleId: 'supabase.service_role', classification: 'actually_bad' }),
  ]))
  assert.equal(JSON.stringify(result).includes('service_role_test_secret'), false)
  assert.match(result.findings[0]?.evidence.display ?? '', /redacted/i)
})

test('keeps legitimate browser configuration expected and review signals conservative', () => {
  const report = buildFounderReport(scanResult([
    finding({ ruleId: 'supabase.anon_key', classification: 'by_design' }),
    finding({ ruleId: 'stripe.publishable_key', classification: 'by_design' }),
    finding({ ruleId: 'route.admin', classification: 'needs_proof' }),
    finding({ ruleId: 'supabase.sensitive_table', classification: 'needs_proof' }),
  ]))
  assert.deepEqual(
    Object.fromEntries(report.findings.map(({ ruleId, label }) => [ruleId, label])),
    {
      'route.admin': 'REVIEW',
      'stripe.publishable_key': 'EXPECTED',
      'supabase.anon_key': 'EXPECTED',
      'supabase.sensitive_table': 'REVIEW',
    },
  )
})
