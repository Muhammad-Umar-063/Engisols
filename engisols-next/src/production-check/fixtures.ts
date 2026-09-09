import type { ScanFinding, ScanResult } from '../scanner/types'
import { SCAN_RECORD_LIFETIME_MS } from './config'
import type { PersistedScan } from './types'

export const DEMO_SCAN_IDS = {
  early: 'rpt_DemoEarlyScanState000001',
  mid: 'rpt_DemoMidScanState00000001',
  healthy: 'rpt_DemoHealthyReport0000001',
  review: 'rpt_DemoReviewReport00000001',
  critical: 'rpt_DemoCriticalReport000001',
  partial: 'rpt_DemoPartialReport0000001',
  failed: 'rpt_DemoFailureReport0000001',
} as const

export function getDevelopmentFixture(publicId: string): PersistedScan | null {
  if (process.env.NODE_ENV === 'production') return null
  const kind = Object.entries(DEMO_SCAN_IDS).find(([, id]) => id === publicId)?.[0]
  if (!kind) return null
  const now = new Date('2026-09-07T10:00:00.000Z')
  if (kind === 'early' || kind === 'mid') {
    const midScan = kind === 'mid'
    return {
      ...baseRecord(publicId, 'running'),
      createdAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + SCAN_RECORD_LIFETIME_MS).toISOString(),
      progress: {
        phase: midScan ? 'analyzing_assets' : 'fetching',
        progress: midScan ? 58 : 12,
        message: midScan ? 'Inspecting browser-side code' : 'Reaching the public app',
        events: midScan
          ? [
              {
                type: 'phase',
                phase: 'fetching',
                progress: 10,
                message: 'The public website responded',
                timestamp: '2026-09-07T10:00:01.000Z',
              },
              {
                type: 'technology',
                phase: 'analyzing_assets',
                progress: 48,
                message: 'Supabase was detected in public browser code',
                timestamp: '2026-09-07T10:00:04.000Z',
                metadata: { technology: 'Supabase' },
              },
              {
                type: 'observation',
                phase: 'analyzing_assets',
                progress: 58,
                message: 'Checking public configuration and data-access signals',
                timestamp: '2026-09-07T10:00:05.000Z',
              },
            ]
          : [
              {
                type: 'phase',
                phase: 'fetching',
                progress: 12,
                message: 'Resolving and requesting the public website',
                timestamp: '2026-09-07T10:00:01.000Z',
              },
            ],
      },
      answers: midScan ? { builder: 'lovable' } : {},
      attribution: {},
    }
  }
  if (kind === 'failed') {
    return baseRecord(publicId, 'failed', undefined, {
      code: 'target_unavailable',
      message: "We couldn't reach this app. It may be unavailable, private, or blocking automated requests.",
    })
  }
  const findings =
    kind === 'healthy'
      ? [publicConfig('stripe.publishable_key', 'Stripe publishable key detected')]
      : kind === 'critical'
        ? [
            privilegedFinding(),
            reviewFinding('supabase.sensitive_table', 'Payments table referenced from browser code'),
            publicConfig('supabase.anon_key', 'Supabase anon key is public'),
          ]
        : [
            reviewFinding('route.admin', 'Administrative client route found'),
            reviewFinding('supabase.sensitive_table', 'Payments table referenced from browser code'),
            reviewFinding('headers.content_security_policy', 'Content Security Policy is missing'),
            publicConfig('supabase.anon_key', 'Supabase anon key is public'),
          ]
  const result = fixtureResult(findings, kind === 'partial' ? 'partial' : 'completed')
  return {
    ...baseRecord(publicId, result.status, result),
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + SCAN_RECORD_LIFETIME_MS).toISOString(),
    answers: { builder: kind === 'critical' ? 'lovable' : 'cursor' },
    attribution: {},
  }
}

function baseRecord(
  publicId: string,
  status: PersistedScan['status'],
  result?: ScanResult,
  error?: PersistedScan['error'],
): PersistedScan {
  return {
    publicId,
    status,
    requestedUrl: 'https://demo-ai-app.example/',
    progress: {
      phase: status === 'failed' ? 'fetching' : 'complete',
      progress: status === 'failed' ? 10 : 100,
      message: status === 'failed' ? 'The app could not be reached' : 'Scan complete',
      events: [],
    },
    answers: {},
    attribution: {},
    ...(result ? { result } : {}),
    ...(error ? { error } : {}),
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + SCAN_RECORD_LIFETIME_MS).toISOString(),
  }
}

function publicConfig(ruleId: string, title: string): ScanFinding {
  return fixtureFinding(ruleId, 'by_design', title, 0)
}

function reviewFinding(ruleId: string, title: string): ScanFinding {
  return fixtureFinding(ruleId, 'needs_proof', title, 8)
}

function privilegedFinding(): ScanFinding {
  return fixtureFinding(
    'stripe.secret_key',
    'actually_bad',
    'Server-side Stripe key detected in browser code',
    40,
  )
}

function fixtureFinding(
  ruleId: string,
  classification: ScanFinding['classification'],
  title: string,
  riskPoints: number,
): ScanFinding {
  return {
    id: `fixture_${ruleId}`,
    ruleId,
    classification,
    category: ruleId.startsWith('headers.')
      ? 'security_headers'
      : ruleId.startsWith('route.')
        ? 'admin_surface'
        : ruleId.includes('table')
          ? 'data_access'
          : 'credentials',
    title,
    summary:
      classification === 'by_design'
        ? 'A public client identifier was observed in browser code.'
        : classification === 'actually_bad'
          ? 'A high-confidence server-side credential pattern was observed in public browser code.'
          : 'The public application exposes a signal that needs code-level verification.',
    remediation:
      classification === 'actually_bad'
        ? 'Move the credential server-side and rotate the exposed key.'
        : classification === 'needs_proof'
          ? 'Review the relevant authorization and production controls in source code.'
          : 'No secret rotation is needed for this public client configuration.',
    evidence: {
      display: 'Sanitized configuration marker [redacted] (fingerprint: demo1234)',
      sourceKind: 'javascript',
      sourceUrl: 'https://demo-ai-app.example/assets/app.js',
    },
    riskPoints,
  }
}

function fixtureResult(findings: ScanFinding[], status: ScanResult['status']): ScanResult {
  const actuallyBad = findings.filter((item) => item.classification === 'actually_bad').length
  const needsProof = findings.filter((item) => item.classification === 'needs_proof').length
  const byDesign = findings.filter((item) => item.classification === 'by_design').length
  const risk = Math.min(100, actuallyBad * 40 + needsProof * 8)
  return {
    schemaVersion: 'scanner-v1',
    status,
    target: { requestedUrl: 'https://demo-ai-app.example/', finalUrl: 'https://demo-ai-app.example/', httpStatus: 200 },
    score: {
      modelVersion: 'scanner-v1', scope: 'observed_public_surface', risk, readiness: 100 - risk,
      band: risk >= 50 ? 'high' : risk >= 20 ? 'moderate' : 'low',
      categoryDeductions: { security_headers: 8, credentials: actuallyBad * 40, data_access: 8, admin_surface: 8, webhooks: 0, architecture: 0 },
    },
    assessment: {
      modelVersion: 'scanner-v1.1',
      exposure: { risk, band: risk >= 50 ? 'high' : risk >= 20 ? 'moderate' : 'low', actuallyBad },
      coverage: { confidence: status === 'partial' ? 'limited' : 'partial', score: status === 'partial' ? 35 : 68, reasons: status === 'partial' ? ['Some public assets blocked automated access.'] : ['A bounded set of public assets was inspected.'] },
      productionProof: { scope: 'public_surface_only', total: 6, observedPublicEvidence: 1, needsCodeReview: 5, publicExposures: actuallyBad, checks: [] },
      recommendation: actuallyBad ? 'urgent_review' : 'code_review',
      headline: actuallyBad ? 'A public exposure needs prompt review.' : 'Production controls still need code review.',
      groups: [],
    },
    summary: { total: findings.length, actuallyBad, needsProof, byDesign },
    findings,
    checks: [],
    coverage: {
      scope: 'bounded_public_surface', completeness: status === 'partial' ? 'partial' : 'complete',
      documents: { discovered: 3, attempted: 3, scanned: status === 'partial' ? 1 : 3 },
      metadata: { discovered: 1, attempted: 1, scanned: 1 },
      scripts: { discovered: 8, attempted: status === 'partial' ? 4 : 8, scanned: status === 'partial' ? 2 : 8 },
      findings: { observedAtLeast: findings.length, returned: findings.length, truncated: false, omittedByCategory: [] },
      bytesScanned: 184320, redirectsFollowed: 0,
      skipped: status === 'partial' ? [{ reason: 'script_fetch_failed', count: 6 }] : [],
      limitsReached: status === 'partial' ? ['total_timeout'] : [],
    },
    limitations: ['This is a bounded passive public-surface scan.'],
    durationMs: 4280,
  }
}
