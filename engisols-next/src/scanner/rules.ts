import { createPrivateKey } from 'node:crypto'

import {
  finalizeFindings,
  type FindingSource,
  type InternalFinding,
  plainEvidence,
  secretEvidence,
} from './redaction'
import type {
  FindingCategory,
  FindingClassification,
  ScanFinding,
} from './types'

export interface RuleSource {
  kind: 'html' | 'javascript'
  url: string
  content: string
}

export interface RuleEvaluationInput {
  sources: RuleSource[]
  headers: Record<string, string | string[] | undefined>
  finalUrl: URL
  fingerprintKey: Buffer
  maxFindings: number
}

export interface RuleEvaluationResult {
  findings: ScanFinding[]
  scoredFindings: ScanFinding[]
  truncated: boolean
}

class FindingAccumulator {
  readonly items: InternalFinding[] = []
  truncated = false

  private readonly seen = new Set<string>()
  private readonly countByRule = new Map<string, number>()
  private readonly evaluationsByRule = new Map<string, number>()

  constructor(private readonly perRuleLimit: number) {}

  markTruncated(): void {
    this.truncated = true
  }

  tryEvaluate(ruleId: string): boolean {
    const count = this.evaluationsByRule.get(ruleId) ?? 0
    if (count >= Math.max(16, this.perRuleLimit * 2)) {
      this.truncated = true
      return false
    }
    this.evaluationsByRule.set(ruleId, count + 1)
    return true
  }

  add(finding: InternalFinding): void {
    if (this.seen.has(finding.dedupeKey)) {
      return
    }

    const count = this.countByRule.get(finding.ruleId) ?? 0
    if (count >= this.perRuleLimit) {
      this.truncated = true
      return
    }
    this.seen.add(finding.dedupeKey)
    this.countByRule.set(finding.ruleId, count + 1)
    this.items.push(finding)
  }
}

const sensitiveTableNames = new Set([
  'accounts',
  'billing',
  'customers',
  'invoices',
  'medical_records',
  'orders',
  'payments',
  'profiles',
  'subscriptions',
  'users',
])
const supabaseJwtPattern =
  /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g

export function evaluateRules(input: RuleEvaluationInput): RuleEvaluationResult {
  const findings = new FindingAccumulator(input.maxFindings)
  const sources = [...input.sources].sort((left, right) =>
    left.url.localeCompare(right.url),
  )
  const hasSupabaseClient = sources.some(({ content }) =>
    /(?:@supabase\/supabase-js|\bcreateClient\s*\()/i.test(content),
  )
  const hasExplicitSupabaseProjectSignal = sources.some(({ content }) =>
    /(?:\.supabase\.co\b|sb_(?:publishable|secret)_)/i.test(content),
  )
  const jwtContext = hasExplicitSupabaseProjectSignal
    ? { found: false, truncated: false }
    : findSupabaseJwtContext(sources)
  if (jwtContext.truncated) {
    findings.markTruncated()
  }
  const hasSupabaseProjectSignal =
    hasExplicitSupabaseProjectSignal || jwtContext.found
  const hasSupabaseContext = hasSupabaseClient && hasSupabaseProjectSignal

  addHeaderFindings(findings, input.headers, input.finalUrl)

  for (const source of sources) {
    addSupabaseKeyFindings(
      findings,
      source,
      input.fingerprintKey,
    )
    addStripeFindings(findings, source, input.fingerprintKey)
    addOpenAiFindings(findings, source, input.fingerprintKey)
    addPrivateKeyFindings(findings, source, input.fingerprintKey)
    addWebhookFindings(findings, source, input.fingerprintKey)
    addAdminRouteFindings(findings, source)
    if (hasSupabaseContext) {
      addSupabaseTableFindings(findings, source)
    }
  }

  if (hasSupabaseContext) {
    findings.add(
      makeFinding(
        'architecture.browser_supabase',
        'by_design',
        'architecture',
        'Browser-to-Supabase client detected',
        'A Supabase client in public JavaScript is a supported design. Authorization depends on RLS, which this scan did not test.',
        'Keep privileged keys server-side and retain automated RLS policy tests.',
        0,
        plainEvidence(
          'architecture.browser_supabase',
          'Supabase browser client',
          toFindingSource(sources[0] ?? {
            kind: 'javascript',
            url: input.finalUrl.href,
          }),
        ),
      ),
    )
  }

  const scoredFindings = finalizeFindings(
    findings.items,
    findings.items.length,
  )
  const publicFindings = selectFindingsForResponse(
    scoredFindings,
    input.maxFindings,
  )
  return {
    findings: publicFindings,
    scoredFindings,
    truncated:
      findings.truncated || scoredFindings.length > input.maxFindings,
  }
}

function selectFindingsForResponse(
  findings: readonly ScanFinding[],
  limit: number,
): ScanFinding[] {
  const selectedIds = new Set<string>()
  const representedCategories = new Set<FindingCategory>()

  for (const finding of findings) {
    if (selectedIds.size >= limit) {
      break
    }
    if (!representedCategories.has(finding.category)) {
      selectedIds.add(finding.id)
      representedCategories.add(finding.category)
    }
  }
  for (const finding of findings) {
    if (selectedIds.size >= limit) {
      break
    }
    selectedIds.add(finding.id)
  }

  return findings.filter(({ id }) => selectedIds.has(id))
}

function addHeaderFindings(
  findings: FindingAccumulator,
  headers: RuleEvaluationInput['headers'],
  finalUrl: URL,
): void {
  const source = { kind: 'headers' as const, url: finalUrl.href }
  const normalized = Object.fromEntries(
    Object.entries(headers).map(([name, value]) => [
      name.toLowerCase(),
      Array.isArray(value) ? value.join(', ') : value,
    ]),
  )
  const csp = normalized['content-security-policy']

  if (!csp) {
    findings.add(
      needsProofHeader(
        'header.csp_missing',
        'Enforcing Content Security Policy not observed',
        'No enforcing CSP was observed on the final HTML response.',
        'Add an enforcing Content-Security-Policy header after testing it in report-only mode.',
        8,
        source,
      ),
    )
  }
  if (!csp?.toLowerCase().includes('frame-ancestors') && !normalized['x-frame-options']) {
    findings.add(
      needsProofHeader(
        'header.frame_protection_missing',
        'Frame-embedding protection not observed',
        'Neither CSP frame-ancestors nor X-Frame-Options was observed on the final HTML response.',
        'Define an appropriate frame-ancestors policy or X-Frame-Options value.',
        4,
        source,
      ),
    )
  }
  if (normalized['x-content-type-options']?.toLowerCase() !== 'nosniff') {
    findings.add(
      needsProofHeader(
        'header.nosniff_missing',
        'MIME sniffing protection not observed',
        'X-Content-Type-Options: nosniff was not observed on the final HTML response.',
        'Return X-Content-Type-Options: nosniff.',
        4,
        source,
      ),
    )
  }
  if (!normalized['referrer-policy']) {
    findings.add(
      needsProofHeader(
        'header.referrer_policy_missing',
        'Referrer policy not observed',
        'A Referrer-Policy header was not observed on the final HTML response.',
        'Set a Referrer-Policy that matches the application data-sharing policy.',
        2,
        source,
      ),
    )
  }
  if (!normalized['permissions-policy']) {
    findings.add(
      needsProofHeader(
        'header.permissions_policy_missing',
        'Permissions policy not observed',
        'A Permissions-Policy header was not observed on the final HTML response.',
        'Disable browser capabilities the application does not need.',
        2,
        source,
      ),
    )
  }
  if (finalUrl.protocol === 'https:' && !normalized['strict-transport-security']) {
    findings.add(
      needsProofHeader(
        'header.hsts_missing',
        'Strict transport security not observed',
        'Strict-Transport-Security was not observed on the final HTTPS response.',
        'Add HSTS after confirming every covered host supports HTTPS.',
        4,
        source,
      ),
    )
  }
}

function addSupabaseKeyFindings(
  findings: FindingAccumulator,
  source: RuleSource,
  fingerprintKey: Buffer,
): void {
  addSecretPattern(
    findings,
    source,
    /\bsb_publishable_[A-Za-z0-9_-]{20,}\b/g,
    fingerprintKey,
    {
      ruleId: 'supabase.publishable_key',
      classification: 'by_design',
      category: 'credentials',
      title: 'Supabase publishable key detected',
      summary: 'This key format is intended for public clients and is not a server secret.',
      remediation: 'Keep authorization in RLS policies and keep privileged Supabase keys server-side.',
      display: 'sb_publishable_…',
      riskPoints: 0,
    },
  )
  addSecretPattern(
    findings,
    source,
    /\bsb_secret_[A-Za-z0-9_-]{20,}\b/g,
    fingerprintKey,
    {
      ruleId: 'supabase.secret_key',
      classification: 'actually_bad',
      category: 'credentials',
      title: 'Supabase secret key appears in a public asset',
      summary: 'A server-side Supabase secret-key format appears in scanned public code. The scan did not test whether it is active.',
      remediation: 'Revoke and rotate the key, then move privileged Supabase access behind a server boundary.',
      display: 'sb_secret_…',
      riskPoints: 60,
    },
  )

  for (const match of source.content.matchAll(supabaseJwtPattern)) {
    if (!findings.tryEvaluate('supabase.jwt')) {
      break
    }
    const raw = match[0]
    const role = decodeSupabaseRole(raw)
    if (!role) {
      continue
    }
    const isAnon = role === 'anon'
    findings.add(
      makeFinding(
        isAnon ? 'supabase.publishable_key' : 'supabase.secret_key',
        isAnon ? 'by_design' : 'actually_bad',
        'credentials',
        isAnon
          ? 'Supabase anon key detected'
          : 'Supabase service-role key appears in a public asset',
        isAnon
          ? 'The legacy anon-key format is intended for public clients and is not a server secret.'
          : 'A structurally confirmed Supabase service-role JWT appears in scanned public code. The scan did not test whether it is active.',
        isAnon
          ? 'Keep authorization in RLS policies and keep the service role server-side.'
          : 'Revoke and rotate the key, then remove service-role access from browser-delivered code.',
        isAnon ? 0 : 60,
        secretEvidence(
          isAnon ? 'supabase.publishable_key' : 'supabase.secret_key',
          raw,
          isAnon ? 'Supabase anon JWT' : 'Supabase service-role JWT',
          source,
          fingerprintKey,
        ),
      ),
    )
  }
}

function addStripeFindings(
  findings: FindingAccumulator,
  source: RuleSource,
  fingerprintKey: Buffer,
): void {
  addSecretPattern(
    findings,
    source,
    /\bpk_(?:test|live)_[A-Za-z0-9]{16,}\b/g,
    fingerprintKey,
    {
      ruleId: 'stripe.publishable_key',
      classification: 'by_design',
      category: 'credentials',
      title: 'Stripe publishable key detected',
      summary: 'This key format is intended for browser use and is not a Stripe server secret.',
      remediation: 'Keep secret and restricted Stripe keys on the server.',
      display: 'Stripe pk_…',
      riskPoints: 0,
    },
  )
  addSecretPattern(
    findings,
    source,
    /\b(?:sk|rk)_(?:test|live)_[A-Za-z0-9]{16,}\b/g,
    fingerprintKey,
    {
      ruleId: 'stripe.secret_key',
      classification: 'actually_bad',
      category: 'credentials',
      title: 'Stripe server key appears in a public asset',
      summary: 'A Stripe secret or restricted key format appears in scanned public code. The scan did not test whether it is active.',
      remediation: 'Revoke and rotate the key, then move Stripe server operations behind an API boundary.',
      display: 'Stripe sk_/rk_…',
      riskPoints: 45,
    },
  )
}

function addOpenAiFindings(
  findings: FindingAccumulator,
  source: RuleSource,
  fingerprintKey: Buffer,
): void {
  const definition: SecretPatternDefinition = {
    ruleId: 'openai.server_secret',
    classification: 'actually_bad',
    category: 'credentials',
    title: 'OpenAI server key appears in a public asset',
    summary: 'A high-confidence OpenAI server-key format appears in scanned public code. The scan did not test whether it is active.',
    remediation: 'Revoke and rotate the key, then call OpenAI only from a trusted server boundary.',
    display: 'OpenAI server credential',
    riskPoints: 50,
  }
  addSecretPattern(
    findings,
    source,
    /\bsk-(?:proj|svcacct|admin)-[A-Za-z0-9_-]{24,}\b/g,
    fingerprintKey,
    definition,
  )

  for (const match of source.content.matchAll(
    /(?:['"])?\b(?:OPENAI_(?:API_)?KEY|OPENAI_SECRET_KEY|openaiApiKey|openaiKey)\b(?:['"])?\s*(?:=|:)\s*(['"])([A-Za-z0-9_-]{32,256})\1/gi,
  )) {
    if (!findings.tryEvaluate(definition.ruleId)) {
      break
    }
    const raw = match[2]
    if (!raw || looksLikePlaceholder(raw) || !isHighEntropySecret(raw)) {
      continue
    }
    findings.add(
      makeFinding(
        definition.ruleId,
        definition.classification,
        definition.category,
        definition.title,
        'A high-entropy quoted value is assigned to an explicit OpenAI server-key setting in scanned public code. The scan did not test whether it is active.',
        definition.remediation,
        definition.riskPoints,
        secretEvidence(
          definition.ruleId,
          raw,
          definition.display,
          source,
          fingerprintKey,
        ),
      ),
    )
  }
}

function addPrivateKeyFindings(
  findings: FindingAccumulator,
  source: RuleSource,
  fingerprintKey: Buffer,
): void {
  const openMarkers = new Map<string, { start: number; contentStart: number }>()
  const markerPattern =
    /-----BEGIN ((?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY)-----|-----END ((?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY)-----/g

  for (const match of source.content.matchAll(markerPattern)) {
    if (!findings.tryEvaluate('credential.private_key')) {
      break
    }
    const openingType = match[1]
    if (openingType) {
      openMarkers.set(openingType, {
        start: match.index,
        contentStart: match.index + match[0].length,
      })
      continue
    }

    const closingType = match[2]
    const opening = closingType ? openMarkers.get(closingType) : undefined
    if (!closingType || !opening) {
      continue
    }
    openMarkers.delete(closingType)

    const rawEnd = match.index + match[0].length
    const bodyLength = match.index - opening.contentStart
    if (bodyLength < 64 || rawEnd - opening.start > 65_536) {
      continue
    }

    const raw = source.content.slice(opening.start, rawEnd)
    if (!isValidPrivateKey(raw)) {
      continue
    }
    findings.add(
      makeFinding(
        'credential.private_key',
        'actually_bad',
        'credentials',
        'Private key appears in a public asset',
        'A complete private-key block appears in scanned public code. The scan did not test what it can access.',
        'Revoke or replace the key and remove private key material from browser-delivered code.',
        60,
        secretEvidence(
          'credential.private_key',
          raw,
          'PEM private key',
          source,
          fingerprintKey,
        ),
      ),
    )
  }
}

function isValidPrivateKey(raw: string): boolean {
  try {
    createPrivateKey(raw.replace(/\\r/g, '\r').replace(/\\n/g, '\n'))
    return true
  } catch {
    return false
  }
}

function addWebhookFindings(
  findings: FindingAccumulator,
  source: RuleSource,
  fingerprintKey: Buffer,
): void {
  const credentialWebhooks = new Set<string>()
  for (const pattern of [
    /https:\/\/hooks\.slack\.com\/services\/[A-Za-z0-9_-]{8,}\/[A-Za-z0-9_-]{8,}\/[A-Za-z0-9_-]{20,}/g,
    /https:\/\/(?:discord(?:app)?\.com)\/api\/webhooks\/\d+\/[A-Za-z0-9_-]{20,}/g,
  ]) {
    for (const match of source.content.matchAll(pattern)) {
      if (!findings.tryEvaluate('webhook.credential_bearing')) {
        break
      }
      const raw = match[0]
      credentialWebhooks.add(raw)
      findings.add(
        makeFinding(
          'webhook.credential_bearing',
          'actually_bad',
          'webhooks',
          'Credential-bearing webhook appears in a public asset',
          'A provider-specific capability webhook appears in scanned public code. The scan did not call it.',
          'Rotate the webhook credential and send webhook requests from a trusted server.',
          35,
          secretEvidence(
            'webhook.credential_bearing',
            raw,
            'Provider webhook credential',
            source,
            fingerprintKey,
          ),
        ),
      )
    }
  }

  for (const match of source.content.matchAll(
    /https?:\/\/[^\s'"<>]+\/(?:hooks?|webhooks?)(?:\/[^\s'"<>]*)?/gi,
  )) {
    if (!findings.tryEvaluate('webhook.generic_hardcoded')) {
      break
    }
    const raw = match[0]
    if ([...credentialWebhooks].some((known) => raw.startsWith(known))) {
      continue
    }
    findings.add(
      makeFinding(
        'webhook.generic_hardcoded',
        'needs_proof',
        'webhooks',
        'Hardcoded webhook endpoint detected',
        'A webhook-looking endpoint appears in scanned public code. Its authorization model was not tested.',
        'Confirm that the endpoint accepts no reusable secret from browser code and validates every request server-side.',
        8,
        secretEvidence(
          'webhook.generic_hardcoded',
          raw,
          'Hardcoded webhook endpoint',
          source,
          fingerprintKey,
        ),
      ),
    )
  }
}

function addAdminRouteFindings(
  findings: FindingAccumulator,
  source: RuleSource,
): void {
  for (const match of source.content.matchAll(
    /['"](\/(?:admin|backoffice|dashboard|manage)(?:\/[A-Za-z0-9._~!$&()*+,;=:@%-]*)*)['"]/gi,
  )) {
    if (!findings.tryEvaluate('route.admin_surface')) {
      break
    }
    const route = match[1]
    if (!route) {
      continue
    }
    findings.add(
      makeFinding(
        'route.admin_surface',
        'needs_proof',
        'admin_surface',
        'Administrative client route detected',
        'An administrative-looking route appears in a scanned public asset. This does not prove the route is unprotected.',
        'Verify server-side authorization for the route and every action it exposes.',
        8,
        plainEvidence('route.admin_surface', route, source),
      ),
    )
  }
}

function addSupabaseTableFindings(
  findings: FindingAccumulator,
  source: RuleSource,
): void {
  for (const match of source.content.matchAll(
    /\.from\s*\(\s*['"]([A-Za-z_][A-Za-z0-9_]*)['"]\s*\)/g,
  )) {
    if (!findings.tryEvaluate('supabase.table_reference')) {
      break
    }
    const tableName = match[1]
    if (!tableName) {
      continue
    }
    findings.add(
      makeFinding(
        'supabase.table_reference',
        'needs_proof',
        'data_access',
        'Direct Supabase table reference detected',
        'A literal Supabase table reference appears in public code. RLS was not tested.',
        'Verify least-privilege RLS policies for every browser-accessible operation.',
        4,
        plainEvidence('supabase.table_reference', tableName, source),
      ),
    )
    if (sensitiveTableNames.has(tableName.toLowerCase())) {
      findings.add(
        makeFinding(
          'supabase.sensitive_table',
          'needs_proof',
          'data_access',
          'Sensitive-looking Supabase table referenced',
          `The public client references the ${tableName} table. RLS was not tested.`,
          'Review read and write policies with authenticated, anonymous, and cross-tenant tests.',
          10,
          plainEvidence('supabase.sensitive_table', tableName, source),
        ),
      )
    }
  }
}

interface SecretPatternDefinition {
  ruleId: string
  classification: FindingClassification
  category: FindingCategory
  title: string
  summary: string
  remediation: string
  display: string
  riskPoints: number
}

function addSecretPattern(
  findings: FindingAccumulator,
  source: RuleSource,
  pattern: RegExp,
  fingerprintKey: Buffer,
  definition: SecretPatternDefinition,
): void {
  for (const match of source.content.matchAll(pattern)) {
    if (!findings.tryEvaluate(definition.ruleId)) {
      break
    }
    const raw = match[0]
    if (looksLikePlaceholder(raw)) {
      continue
    }
    findings.add(
      makeFinding(
        definition.ruleId,
        definition.classification,
        definition.category,
        definition.title,
        definition.summary,
        definition.remediation,
        definition.riskPoints,
        secretEvidence(
          definition.ruleId,
          raw,
          definition.display,
          source,
          fingerprintKey,
        ),
      ),
    )
  }
}

function decodeSupabaseRole(token: string): 'anon' | 'service_role' | null {
  try {
    const payload = JSON.parse(
      Buffer.from(token.split('.')[1] ?? '', 'base64url').toString('utf8'),
    ) as Record<string, unknown>
    const isSupabase =
      payload.iss === 'supabase' ||
      typeof payload.ref === 'string' ||
      (typeof payload.iss === 'string' && payload.iss.includes('supabase'))
    if (!isSupabase) {
      return null
    }
    return payload.role === 'anon' || payload.role === 'service_role'
      ? payload.role
      : null
  } catch {
    return null
  }
}

function findSupabaseJwtContext(sources: readonly RuleSource[]): {
  found: boolean
  truncated: boolean
} {
  let inspected = 0
  for (const { content } of sources) {
    for (const match of content.matchAll(supabaseJwtPattern)) {
      if (inspected >= 200) {
        return { found: false, truncated: true }
      }
      inspected += 1
      if (match[0] && decodeSupabaseRole(match[0])) {
        return { found: true, truncated: false }
      }
    }
  }
  return { found: false, truncated: false }
}

function looksLikePlaceholder(raw: string): boolean {
  const normalized = raw.toLowerCase()
  return (
    normalized.includes('your_key') ||
    normalized.includes('placeholder') ||
    normalized.includes('replace_me') ||
    normalized.includes('changeme') ||
    normalized.includes('example') ||
    normalized.includes('<key>') ||
    /x{8,}/i.test(raw)
  )
}

function isHighEntropySecret(raw: string): boolean {
  if (raw.length < 32 || raw.length > 256) {
    return false
  }

  const characterClasses = [/[a-z]/, /[A-Z]/, /\d/].filter((pattern) =>
    pattern.test(raw),
  ).length
  const frequencies = new Map<string, number>()
  for (const character of raw) {
    frequencies.set(character, (frequencies.get(character) ?? 0) + 1)
  }
  if (characterClasses < 3 || frequencies.size < 12) {
    return false
  }

  let entropy = 0
  for (const count of frequencies.values()) {
    const probability = count / raw.length
    entropy -= probability * Math.log2(probability)
  }
  return entropy >= 3.5
}

function needsProofHeader(
  ruleId: string,
  title: string,
  summary: string,
  remediation: string,
  riskPoints: number,
  source: FindingSource,
): InternalFinding {
  return makeFinding(
    ruleId,
    'needs_proof',
    'security_headers',
    title,
    summary,
    remediation,
    riskPoints,
    plainEvidence(ruleId, 'Final HTML response headers', source),
  )
}

function makeFinding(
  ruleId: string,
  classification: FindingClassification,
  category: FindingCategory,
  title: string,
  summary: string,
  remediation: string,
  riskPoints: number,
  evidence: Pick<InternalFinding, 'dedupeKey' | 'evidence'>,
): InternalFinding {
  return {
    ruleId,
    classification,
    category,
    title,
    summary,
    remediation,
    riskPoints,
    ...evidence,
  }
}

function toFindingSource(
  source: Pick<RuleSource, 'kind' | 'url'>,
): FindingSource {
  return source
}
