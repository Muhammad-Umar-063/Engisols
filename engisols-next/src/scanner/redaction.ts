import { createHmac } from 'node:crypto'

import {
  FINDING_CLASSIFICATION_RANK,
  type ScanFinding,
  type ScanSourceKind,
} from './types'

export interface InternalFinding extends Omit<ScanFinding, 'id'> {
  dedupeKey: string
}

export interface FindingSource {
  kind: ScanSourceKind
  url: string
}

export function secretEvidence(
  ruleId: string,
  raw: string,
  display: string,
  source: FindingSource,
  fingerprintKey: Buffer,
): Pick<InternalFinding, 'dedupeKey' | 'evidence'> {
  const fingerprint = createHmac('sha256', fingerprintKey)
    .update(`${ruleId}\0${raw}`)
    .digest('hex')

  return {
    dedupeKey: `${ruleId}:${fingerprint}`,
    evidence: sanitizePublicEvidence(ruleId, display, source, true),
  }
}

export function plainEvidence(
  ruleId: string,
  display: string,
  source: FindingSource,
): Pick<InternalFinding, 'dedupeKey' | 'evidence'> {
  const evidence = sanitizePublicEvidence(ruleId, display, source, false)
  return {
    dedupeKey: `${ruleId}:${display.slice(0, 120).toLowerCase()}`,
    evidence,
  }
}

export function finalizeFindings(
  findings: InternalFinding[],
  maxFindings: number,
): ScanFinding[] {
  const unique = new Map<string, InternalFinding>()
  for (const finding of findings) {
    if (!unique.has(finding.dedupeKey)) {
      unique.set(finding.dedupeKey, finding)
    }
  }

  return [...unique.values()]
    .sort((left, right) =>
      FINDING_CLASSIFICATION_RANK[left.classification] -
        FINDING_CLASSIFICATION_RANK[right.classification] ||
      left.ruleId.localeCompare(right.ruleId) ||
      left.evidence.sourceUrl.localeCompare(right.evidence.sourceUrl) ||
      left.evidence.display.localeCompare(right.evidence.display),
    )
    .slice(0, maxFindings)
    .map((finding, index) => ({
      id: `F${String(index + 1).padStart(3, '0')}`,
      ruleId: finding.ruleId,
      classification: finding.classification,
      category: finding.category,
      title: finding.title,
      summary: finding.summary,
      remediation: finding.remediation,
      evidence: finding.evidence,
      riskPoints: finding.riskPoints,
    }))
}

export function sanitizePublicUrl(input: string | URL): string {
  try {
    const url = new URL(input.toString())
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return 'about:blank'
    }
    url.username = ''
    url.password = ''
    // Public reports identify the scanned origin without reflecting arbitrary,
    // potentially credential-bearing path segments supplied by a target.
    url.pathname = '/'
    url.search = ''
    url.hash = ''
    return url.href
  } catch {
    return 'about:blank'
  }
}

function sanitizePublicEvidence(
  ruleId: string,
  display: string,
  source: FindingSource,
  trustedLabel: boolean,
): ScanFinding['evidence'] {
  return {
    display: trustedLabel
      ? display.slice(0, 120)
      : publicEvidenceLabel(ruleId),
    sourceKind: source.kind,
    sourceUrl: sanitizePublicUrl(source.url),
  }
}

function publicEvidenceLabel(ruleId: string): string {
  if (ruleId.startsWith('header.')) return 'Final HTML response headers'

  const labels: Readonly<Record<string, string>> = {
    'architecture.browser_supabase': 'Supabase browser client',
    'route.admin_surface': 'Administrative client route',
    'supabase.sensitive_table': 'Sensitive-looking Supabase table reference',
    'supabase.table_reference': 'Supabase table reference',
  }
  return labels[ruleId] ?? 'Observed public evidence'
}
