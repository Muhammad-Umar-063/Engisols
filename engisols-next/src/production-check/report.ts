import { randomBytes } from 'node:crypto'

import type {
  FindingClassification,
  ScanFinding,
  ScanResult,
} from '../scanner/types'
import { FINDING_CLASSIFICATION_RANK } from '../scanner/types'
import { detectFindingTechnologies } from '../scanner/technology'
import { containsCredentialLikeValue } from './security'
import type {
  BuilderAnswer,
  FounderFinding,
  FounderLabel,
  FounderReport,
} from './types'

const labels: Record<FindingClassification, FounderLabel> = {
  actually_bad: 'FIX NOW',
  needs_proof: 'REVIEW',
  by_design: 'EXPECTED',
}

export function createPublicScanId(): string {
  return `rpt_${randomBytes(18).toString('base64url')}`
}

export function isValidPublicScanId(value: string): boolean {
  return /^rpt_[A-Za-z0-9_-]{24}$/.test(value)
}

export function sanitizeResultForPersistence(result: ScanResult): ScanResult {
  const serialized = JSON.stringify(result)
  if (containsCredentialLikeValue(serialized)) {
    throw new Error('Public report contains a credential-like value and cannot be persisted.')
  }
  return JSON.parse(serialized) as ScanResult
}

export function buildFounderReport(
  result: ScanResult,
  builder?: BuilderAnswer,
): FounderReport {
  const findings = [...result.findings]
    .sort(
      (left, right) =>
        FINDING_CLASSIFICATION_RANK[left.classification] - FINDING_CLASSIFICATION_RANK[right.classification] ||
        right.riskPoints - left.riskPoints ||
        left.ruleId.localeCompare(right.ruleId),
    )
    .map(toFounderFinding)

  const top = findings[0]
  const startHere = top
    ? {
        ruleId: top.ruleId,
        title: top.title,
        action: top.recommendedAction,
      }
    : {
        ruleId: 'production.code_review',
        title: 'Verify the controls a public scan cannot see',
        action:
          'Review authentication, authorization, database policies, and server-side secret handling before relying on this scan for a launch decision.',
      }

  return {
    verdict: verdictFor(result),
    publicSurfaceRisk: result.assessment.exposure.risk,
    exposureBand: result.assessment.exposure.band,
    counts: {
      fixNow: result.summary.actuallyBad,
      review: result.summary.needsProof,
      expected: result.summary.byDesign,
    },
    coverage: result.assessment.coverage,
    productionProof: result.assessment.productionProof,
    findings,
    detectedTechnologies: detectFindingTechnologies(result.findings),
    startHere,
    builderPrompt: buildBuilderPrompt(builder, startHere.action),
  }
}

function verdictFor(result: ScanResult): string {
  if (result.summary.actuallyBad > 0) {
    return result.summary.actuallyBad === 1
      ? 'One public exposure needs prompt attention.'
      : 'Multiple public exposures need prompt attention.'
  }
  if (result.summary.needsProof > 0) {
    return 'Important production checks still need code review.'
  }
  if (
    result.assessment.coverage.confidence !== 'strong' ||
    result.assessment.productionProof.needsCodeReview > 0
  ) {
    return 'No public exposure was found, but production readiness is not proven.'
  }
  return 'No public exposure was found in the observed surface.'
}

function toFounderFinding(finding: ScanFinding): FounderFinding {
  const whatCannot =
    finding.classification === 'needs_proof'
      ? 'A passive public scan cannot verify the relevant server-side controls, authorization decisions, or database policies.'
      : undefined
  const why =
    finding.classification === 'by_design'
      ? 'This kind of public client configuration can be normal and is not a secret merely because it appears in browser code.'
      : finding.summary

  return {
    id: finding.id,
    ruleId: finding.ruleId,
    label: labels[finding.classification],
    title: finding.title,
    whyItMatters: why,
    whatWeFound: finding.summary,
    ...(whatCannot ? { whatWeCannotVerify: whatCannot } : {}),
    recommendedAction: finding.remediation,
    riskPoints: finding.riskPoints,
    technical: {
      category: finding.category,
      sourceKind: finding.evidence.sourceKind,
      location: finding.evidence.sourceUrl,
      evidence: finding.evidence.display,
    },
  }
}

function buildBuilderPrompt(
  builder: BuilderAnswer | undefined,
  action: string,
): FounderReport['builderPrompt'] {
  if (!builder || builder === 'not_sure' || builder === 'other') return undefined
  const labelsByBuilder: Partial<Record<BuilderAnswer, string>> = {
    lovable: 'Try this in Lovable',
    bolt: 'Try this in Bolt',
    cursor: 'Try this in Cursor',
    v0: 'Try this in v0',
    replit: 'Try this in Replit',
    claude_code: 'Try this in Claude Code',
  }
  return {
    label: labelsByBuilder[builder] ?? 'Copy this prompt',
    prompt: `${action}\n\nPreserve existing behavior. Do not weaken authentication, authorization, database Row Level Security, or server-side validation. Explain the changes and add a focused regression test.`,
  }
}
