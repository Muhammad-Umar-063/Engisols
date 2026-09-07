import { randomBytes } from 'node:crypto'

import { buildScanAssessment } from './assessment'
import { discoverHtml, type HtmlDiscovery } from './discover-html'
import { discoverJavaScript, scriptPriority } from './discover-js'
import { prioritizeRouteUrls } from './discover-metadata'
import { ScannerError } from './errors'
import { resolveScanLimits } from './limits'
import {
  createNodeRequester,
  fetchPublicResource,
  headerValue,
  ScanResourceLimitError,
  type RequestOnce,
  type ScanResourceLimitReason,
} from './public-fetch'
import { sanitizePublicUrl } from './redaction'
import { discoverPublicMetadata } from './public-metadata'
import { evaluateRules, type RuleSource } from './rules'
import { scoreFindings } from './scoring'
import { detectFindingTechnologies } from './technology'
import {
  FINDING_CATEGORIES,
  type FindingCategory,
  type ScanCheck,
  type ScanCoverage,
  type ScanLimits,
  type ScanPhase,
  type ScanProgressEvent,
  type ScanProgressObserver,
  type ScanResult,
} from './types'
import {
  createDnsPinCache,
  type ResolveHost,
} from './url-policy'

export interface ScanDependencies {
  resolveHost?: ResolveHost
  requestOnce?: RequestOnce
  fingerprintKey?: Buffer
  now?: () => number
  deadlineNow?: () => number
  limits?: Partial<ScanLimits>
  onProgress?: ScanProgressObserver
}

interface ScriptCandidate {
  url: string
  depth: number
  priority: number
}

const processFingerprintKey = randomBytes(32)

export async function scanPublicUrl(
  input: string,
  dependencies: ScanDependencies = {},
): Promise<ScanResult> {
  const nodeRequester = dependencies.requestOnce
    ? undefined
    : createNodeRequester()
  try {
    return await scanPublicUrlInternal(input, {
      ...dependencies,
      requestOnce: dependencies.requestOnce ?? nodeRequester?.requestOnce,
    })
  } finally {
    nodeRequester?.destroy()
  }
}

async function scanPublicUrlInternal(
  input: string,
  dependencies: ScanDependencies,
): Promise<ScanResult> {
  const limits = resolveScanLimits(dependencies.limits)
  const now = dependencies.now ?? Date.now
  const deadlineNow = dependencies.deadlineNow ?? Date.now
  const startedAt = now()
  const deadlineAt = deadlineNow() + limits.totalTimeoutMs
  const bundleReserveMs = Math.min(
    limits.requestTimeoutMs,
    Math.floor(limits.totalTimeoutMs / 3),
  )
  const dnsPins = createDnsPinCache()
  const budget = { decodedBytes: 0 }
  const skipped = new Map<string, number>()
  const limitsReached = new Set<string>()
  let isPartial = false
  let terminalLimit: ScanResourceLimitReason | undefined
  let lastProgress = 0
  const emit = (
    event: Omit<ScanProgressEvent, 'timestamp'>,
  ): void => {
    const progress =
      typeof event.progress === 'number'
        ? Math.max(lastProgress, Math.min(100, Math.round(event.progress)))
        : undefined
    if (progress !== undefined) lastProgress = progress
    try {
      dependencies.onProgress?.({
        ...event,
        ...(progress !== undefined ? { progress } : {}),
        timestamp: new Date().toISOString(),
      })
    } catch {
      // Progress is observational. A UI/storage observer must never make the
      // security scan fail or alter its deterministic result.
    }
  }
  const phase = (
    value: ScanPhase,
    progress: number,
    message: string,
    detail?: string,
  ): void => emit({ type: 'phase', phase: value, progress, message, detail })
  const markTerminalLimit = (reason: ScanResourceLimitReason): void => {
    terminalLimit ??= reason
    limitsReached.add(reason)
    isPartial = true
  }

  phase('validating', 2, 'Validating the public URL')
  phase('fetching', 10, 'Reaching the public application')
  const main = await fetchPublicResource(input, {
    kind: 'html',
    limits,
    totalDeadlineAt: deadlineAt,
    absoluteDeadlineAt: deadlineAt,
    budget,
    dnsPins,
    resolveHost: dependencies.resolveHost,
    requestOnce: dependencies.requestOnce,
    deadlineNow,
  })
  if (!isUsableHtml(main.status, main.headers)) {
    throw new ScannerError('target_unavailable')
  }
  phase('headers', 20, 'Checking response security headers')

  const allowedOrigin = main.finalUrl.origin
  const sources: RuleSource[] = [
    { kind: 'html', url: main.finalUrl.href, content: main.body },
  ]
  const importMap: Record<string, string> = {}
  const scriptQueue: ScriptCandidate[] = []
  const discoveredScripts = new Set<string>()
  const queuedScripts = new Set<string>()
  let documentsAttempted = 1
  let documentsScanned = 1
  let metadataCoverage = { discovered: 0, attempted: 0, scanned: 0 }
  let scriptsAttempted = 0
  let scriptsScanned = 0
  let redirectsFollowed = main.redirectsFollowed

  const mainDiscovery = discoverHtml(main.body, main.finalUrl)
  addDiscoverySkips(mainDiscovery, skipped)
  if (mainDiscovery.skipped.crossOriginScripts > 0) {
    isPartial = true
  }
  mergeImportMap(importMap, mainDiscovery.importMap)
  addScriptCandidates(
    mainDiscovery.scriptUrls,
    0,
    scriptQueue,
    discoveredScripts,
    queuedScripts,
    limits,
    limitsReached,
    skipped,
  )
  addInlineScriptCandidates(
    mainDiscovery,
    main.finalUrl,
    allowedOrigin,
    importMap,
    scriptQueue,
    discoveredScripts,
    queuedScripts,
    limits,
    limitsReached,
    skipped,
  )
  phase(
    'discovering_assets',
    30,
    `Discovered ${discoveredScripts.size} browser bundle${discoveredScripts.size === 1 ? '' : 's'}`,
  )
  if (deadlineNow() >= deadlineAt) {
    markTerminalLimit('total_timeout')
  }

  const additionalDocumentLimit = Math.min(
    limits.maxAdditionalRoutes,
    Math.max(0, limits.maxDocuments - 1),
  )
  const discoveredRoutes = new Set(mainDiscovery.routeUrls)
  if (
    !terminalLimit &&
    limits.maxMetadataDocuments > 0 &&
    discoveredRoutes.size < additionalDocumentLimit &&
    deadlineNow() < deadlineAt - bundleReserveMs
  ) {
    const metadataDeadlineAt = Math.min(
      deadlineAt - bundleReserveMs,
      deadlineNow() + 1_500,
    )
    const metadata = await discoverPublicMetadata(main.finalUrl, {
      limits,
      totalDeadlineAt: metadataDeadlineAt,
      absoluteDeadlineAt: deadlineAt,
      budget,
      dnsPins,
      resolveHost: dependencies.resolveHost,
      requestOnce: dependencies.requestOnce,
      routeTargetCount: additionalDocumentLimit,
      deadlineNow,
    })
    metadataCoverage = metadata.coverage
    redirectsFollowed += metadata.redirectsFollowed
    increment(skipped, 'unsafe_metadata_reference', metadata.unsafeReferences)
    for (const item of metadata.skipped) {
      increment(skipped, item.reason, item.count)
      if (
        item.reason === 'total_timeout' ||
        item.reason === 'max_total_bytes'
      ) {
        markTerminalLimit(item.reason)
      }
    }
    isPartial ||= metadata.incomplete
    for (const route of metadata.routeUrls) discoveredRoutes.add(route)
  }
  const routes = prioritizeRouteUrls([...discoveredRoutes]).slice(
    0,
    additionalDocumentLimit,
  )

  for (const [routeIndex, route] of routes.entries()) {
    if (terminalLimit) {
      break
    }
    if (
      scriptQueue.length > 0 &&
      deadlineNow() + limits.requestTimeoutMs >= deadlineAt - bundleReserveMs
    ) {
      isPartial = true
      limitsReached.add('bundle_time_reserve')
      increment(skipped, 'route_time_reserve', routes.length - routeIndex)
      break
    }
    if (deadlineNow() >= deadlineAt) {
      markTerminalLimit('total_timeout')
      increment(skipped, 'route_fetch_failed')
      break
    }
    documentsAttempted += 1
    try {
      const page = await fetchPublicResource(route, {
        kind: 'html',
        limits,
        totalDeadlineAt: deadlineAt,
        absoluteDeadlineAt: deadlineAt,
        budget,
        dnsPins,
        resolveHost: dependencies.resolveHost,
        requestOnce: dependencies.requestOnce,
        allowedOrigin,
        deadlineNow,
      })
      redirectsFollowed += page.redirectsFollowed
      if (!isUsableHtml(page.status, page.headers)) {
        isPartial = true
        increment(skipped, 'route_unusable_response')
        continue
      }
      documentsScanned += 1
      sources.push({ kind: 'html', url: page.finalUrl.href, content: page.body })
      const discovery = discoverHtml(page.body, page.finalUrl)
      for (const routeUrl of discovery.routeUrls) discoveredRoutes.add(routeUrl)
      addDiscoverySkips(discovery, skipped)
      if (discovery.skipped.crossOriginScripts > 0) {
        isPartial = true
      }
      mergeImportMap(importMap, discovery.importMap)
      addScriptCandidates(
        discovery.scriptUrls,
        0,
        scriptQueue,
        discoveredScripts,
        queuedScripts,
        limits,
        limitsReached,
        skipped,
      )
      addInlineScriptCandidates(
        discovery,
        page.finalUrl,
        allowedOrigin,
        importMap,
        scriptQueue,
        discoveredScripts,
        queuedScripts,
        limits,
        limitsReached,
        skipped,
      )
    } catch (error) {
      if (error instanceof ScanResourceLimitError) {
        markTerminalLimit(error.reason)
        increment(skipped, error.reason)
        break
      }
      isPartial = true
      increment(skipped, 'route_fetch_failed')
    }
  }

  if (!terminalLimit && deadlineNow() >= deadlineAt) {
    markTerminalLimit('total_timeout')
  }

  if (discoveredRoutes.size > routes.length) {
    isPartial = true
    limitsReached.add('document_route_limit')
    increment(skipped, 'route_limit', discoveredRoutes.size - routes.length)
  }

  phase('analyzing_assets', 35, 'Inspecting browser-side application code')
  while (scriptQueue.length > 0 && !terminalLimit) {
    if (scriptsAttempted >= limits.maxJavaScriptAssets) {
      isPartial = true
      limitsReached.add('javascript_asset_limit')
      increment(skipped, 'javascript_asset_limit', scriptQueue.length)
      break
    }
    if (deadlineNow() >= deadlineAt) {
      markTerminalLimit('total_timeout')
      increment(skipped, 'script_fetch_failed', scriptQueue.length)
      break
    }

    const candidate = scriptQueue.shift()
    if (!candidate) {
      break
    }
    scriptsAttempted += 1
    try {
      const script = await fetchPublicResource(candidate.url, {
        kind: 'javascript',
        limits,
        totalDeadlineAt: deadlineAt,
        absoluteDeadlineAt: deadlineAt,
        budget,
        dnsPins,
        resolveHost: dependencies.resolveHost,
        requestOnce: dependencies.requestOnce,
        allowedOrigin,
        deadlineNow,
      })
      redirectsFollowed += script.redirectsFollowed
      if (!isUsableJavaScript(script.status, script.headers)) {
        isPartial = true
        increment(skipped, 'script_unusable_response')
        continue
      }
      scriptsScanned += 1
      sources.push({
        kind: 'javascript',
        url: script.finalUrl.href,
        content: script.body,
      })

      const discovery = discoverJavaScript(
        script.body,
        script.finalUrl,
        allowedOrigin,
        importMap,
        limits.maxDiscoveredJavaScriptAssets,
      )
      increment(
        skipped,
        'cross_origin_script',
        discovery.skipped.crossOriginScripts,
      )
      increment(
        skipped,
        'unresolved_script_specifier',
        discovery.skipped.unresolvedSpecifiers,
      )
      increment(
        skipped,
        'javascript_candidate_limit',
        discovery.skipped.scriptCandidatesOmitted,
      )
      if (discovery.skipped.scriptCandidatesOmitted > 0) {
        limitsReached.add('javascript_candidate_limit')
      }
      if (discovery.skipped.crossOriginScripts > 0) {
        isPartial = true
      }
      addScriptCandidates(
        discovery.scriptUrls,
        candidate.depth + 1,
        scriptQueue,
        discoveredScripts,
        queuedScripts,
        limits,
        limitsReached,
        skipped,
      )
      const total = Math.min(
        limits.maxJavaScriptAssets,
        Math.max(scriptsAttempted, discoveredScripts.size),
      )
      emit({
        type: 'observation',
        phase: 'analyzing_assets',
        progress: 35 + (40 * scriptsAttempted) / Math.max(1, total),
        message: `Inspected ${scriptsAttempted} of ${total} discovered browser bundles`,
        metadata: { processed: scriptsAttempted, total },
      })
      if (
        candidate.depth >= limits.maxJavaScriptDepth &&
        discovery.scriptUrls.length > 0
      ) {
        isPartial = true
        increment(
          skipped,
          'javascript_depth_limit',
          discovery.scriptUrls.length,
        )
      }
    } catch (error) {
      if (error instanceof ScanResourceLimitError) {
        markTerminalLimit(error.reason)
        increment(skipped, error.reason)
        break
      }
      isPartial = true
      increment(skipped, 'script_fetch_failed')
    }
  }

  if (!terminalLimit && deadlineNow() >= deadlineAt) {
    markTerminalLimit('total_timeout')
  }

  if (limitsReached.size > 0) {
    isPartial = true
  }
  if (
    [
      'cross_origin_script',
      'unresolved_script_specifier',
      'unsafe_route',
      'unsafe_metadata_reference',
    ].some((reason) => (skipped.get(reason) ?? 0) > 0)
  ) {
    isPartial = true
  }

  phase('classifying', 78, 'Classifying observations conservatively')
  const ruleEvaluation = evaluateRules({
    sources,
    headers: main.headers,
    finalUrl: main.finalUrl,
    fingerprintKey: dependencies.fingerprintKey ?? processFingerprintKey,
    maxFindings: limits.maxFindings,
  })
  if (deadlineNow() >= deadlineAt) {
    markTerminalLimit('total_timeout')
  }
  const findings = ruleEvaluation.findings
  emitDetectedTechnologies(ruleEvaluation.scoredFindings, emit)
  if (ruleEvaluation.truncated) {
    isPartial = true
    limitsReached.add('finding_limit')
    increment(
      skipped,
      'finding_limit',
      Math.max(1, ruleEvaluation.scoredFindings.length - findings.length),
    )
  }
  const status = isPartial ? 'partial' : 'completed'
  const returnedFindingIds = new Set(findings.map(({ id }) => id))
  const omittedByCategory = FINDING_CATEGORIES.flatMap((category) => {
    const count = ruleEvaluation.scoredFindings.filter(
      (finding) =>
        finding.category === category && !returnedFindingIds.has(finding.id),
    ).length
    return count > 0 ? [{ category, count }] : []
  })
  const coverage: ScanCoverage = {
    scope: 'bounded_public_surface',
    completeness: status === 'completed' ? 'complete' : 'partial',
    documents: {
      discovered: 1 + discoveredRoutes.size,
      attempted: documentsAttempted,
      scanned: documentsScanned,
    },
    metadata: metadataCoverage,
    scripts: {
      discovered: discoveredScripts.size,
      attempted: scriptsAttempted,
      scanned: scriptsScanned,
    },
    findings: {
      observedAtLeast: ruleEvaluation.scoredFindings.length,
      returned: findings.length,
      truncated: ruleEvaluation.truncated,
      omittedByCategory,
    },
    bytesScanned: budget.decodedBytes,
    redirectsFollowed,
    skipped: [...skipped.entries()]
      .filter(([, count]) => count > 0)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([reason, count]) => ({ reason, count })),
    limitsReached: [...limitsReached].sort(),
  }

  const score = scoreFindings(ruleEvaluation.scoredFindings)
  phase('building_report', 92, 'Preparing the prioritized report')
  const result: ScanResult = {
    schemaVersion: 'scanner-v1',
    status,
    target: {
      requestedUrl: sanitizePublicUrl(input),
      finalUrl: sanitizePublicUrl(main.finalUrl),
      httpStatus: main.status,
    },
    score,
    assessment: buildScanAssessment({
      status,
      coverage,
      findings: ruleEvaluation.scoredFindings,
      score,
    }),
    summary: {
      total: ruleEvaluation.scoredFindings.length,
      byDesign: ruleEvaluation.scoredFindings.filter(
        ({ classification }) => classification === 'by_design',
      ).length,
      needsProof: ruleEvaluation.scoredFindings.filter(
        ({ classification }) => classification === 'needs_proof',
      ).length,
      actuallyBad: ruleEvaluation.scoredFindings.filter(
        ({ classification }) => classification === 'actually_bad',
      ).length,
    },
    findings,
    checks: buildChecks(findings, ruleEvaluation.scoredFindings, status),
    coverage,
    limitations: [
      'This is a bounded passive scan of observed public HTML and JavaScript, not a complete application security assessment.',
      'The scanner did not execute JavaScript, submit forms, call discovered APIs, inspect source maps, or guess unadvertised routes.',
      'Standard robots metadata and an explicitly advertised same-origin sitemap are sampled only when the initial page does not provide enough safe route candidates.',
      'Authorization, Supabase RLS behavior, credential validity, and server-side code were not tested.',
      'Runtime-generated chunks and cross-origin scripts may not be included in scan coverage.',
    ],
    durationMs: Math.max(0, now() - startedAt),
  }
  phase('complete', 100, 'Scan complete')
  emit({
    type: status === 'partial' ? 'partial' : 'complete',
    progress: 100,
    message:
      status === 'partial'
        ? 'The available public evidence is ready in a partial report.'
        : 'The public-surface report is ready.',
    metadata: {
      processed: result.summary.total,
      total: result.summary.total,
    },
  })
  return result
}

function emitDetectedTechnologies(
  findings: readonly { ruleId: string; classification: string }[],
  emit: (event: Omit<ScanProgressEvent, 'timestamp'>) => void,
): void {
  for (const { name: technology } of detectFindingTechnologies(findings)) {
    emit({
      type: 'technology',
      phase: 'classifying',
      message: `${technology} detected`,
      metadata: { technology },
    })
  }

  const byDesign = findings.find(
    ({ classification }) => classification === 'by_design',
  )
  if (byDesign) {
    emit({
      type: 'observation',
      phase: 'classifying',
      message: 'Public client configuration was recognized as expected.',
      metadata: { classification: 'expected' },
    })
  }
}

function addInlineScriptCandidates(
  discovery: HtmlDiscovery,
  pageUrl: URL,
  allowedOrigin: string,
  importMap: Readonly<Record<string, string>>,
  queue: ScriptCandidate[],
  discovered: Set<string>,
  queued: Set<string>,
  limits: Readonly<ScanLimits>,
  limitsReached: Set<string>,
  skipped: Map<string, number>,
): void {
  for (const inline of discovery.inlineScripts) {
    const result = discoverJavaScript(
      inline,
      pageUrl,
      allowedOrigin,
      importMap,
      limits.maxDiscoveredJavaScriptAssets,
    )
    increment(skipped, 'cross_origin_script', result.skipped.crossOriginScripts)
    increment(
      skipped,
      'unresolved_script_specifier',
      result.skipped.unresolvedSpecifiers,
    )
    increment(
      skipped,
      'javascript_candidate_limit',
      result.skipped.scriptCandidatesOmitted,
    )
    if (result.skipped.scriptCandidatesOmitted > 0) {
      limitsReached.add('javascript_candidate_limit')
    }
    addScriptCandidates(
      result.scriptUrls,
      0,
      queue,
      discovered,
      queued,
      limits,
      limitsReached,
      skipped,
    )
  }
}

function addScriptCandidates(
  urls: readonly string[],
  depth: number,
  queue: ScriptCandidate[],
  discovered: Set<string>,
  queued: Set<string>,
  limits: Readonly<ScanLimits>,
  limitsReached: Set<string>,
  skipped: Map<string, number>,
): void {
  for (const url of urls) {
    if (
      !discovered.has(url) &&
      discovered.size >= limits.maxDiscoveredJavaScriptAssets
    ) {
      limitsReached.add('javascript_candidate_limit')
      increment(skipped, 'javascript_candidate_limit')
      continue
    }
    discovered.add(url)
    if (queued.has(url)) {
      continue
    }
    queued.add(url)
    if (depth > limits.maxJavaScriptDepth) {
      limitsReached.add('javascript_depth_limit')
      continue
    }
    queue.push({ url, depth, priority: scriptPriority(url) })
  }
  queue.sort(
    (left, right) =>
      left.depth - right.depth ||
      left.priority - right.priority ||
      left.url.localeCompare(right.url),
  )
}

function addDiscoverySkips(
  discovery: HtmlDiscovery,
  skipped: Map<string, number>,
): void {
  increment(
    skipped,
    'cross_origin_script',
    discovery.skipped.crossOriginScripts,
  )
  increment(skipped, 'unsafe_route', discovery.skipped.unsafeRoutes)
}

function mergeImportMap(
  target: Record<string, string>,
  source: Readonly<Record<string, string>>,
): void {
  for (const key of Object.keys(source).sort()) {
    if (!(key in target)) {
      target[key] = source[key] as string
    }
  }
}

function increment(
  target: Map<string, number>,
  key: string,
  amount = 1,
): void {
  if (amount > 0) {
    target.set(key, (target.get(key) ?? 0) + amount)
  }
}

function isUsableHtml(
  status: number,
  headers: Record<string, string | string[] | undefined>,
): boolean {
  const contentType = headerValue(headers, 'content-type')?.toLowerCase()
  return (
    status >= 200 &&
    status < 300 &&
    Boolean(
      contentType?.includes('text/html') ||
        contentType?.includes('application/xhtml+xml'),
    )
  )
}

function isUsableJavaScript(
  status: number,
  headers: Record<string, string | string[] | undefined>,
): boolean {
  if (status < 200 || status >= 300) {
    return false
  }
  const contentType = headerValue(headers, 'content-type')?.toLowerCase()
  return Boolean(
      contentType?.includes('javascript') ||
      contentType?.includes('ecmascript') ||
      contentType?.includes('application/json') ||
      contentType?.includes('text/plain') ||
      contentType?.includes('application/octet-stream'),
  )
}

function buildChecks(
  findings: ScanResult['findings'],
  scoredFindings: ScanResult['findings'],
  status: ScanResult['status'],
): ScanCheck[] {
  const titles: Readonly<Record<FindingCategory, string>> = {
    security_headers: 'Security headers',
    credentials: 'Public configuration and credentials',
    data_access: 'Supabase table references',
    admin_surface: 'Administrative client routes',
    webhooks: 'Hardcoded webhooks',
    architecture: 'Browser data-access architecture',
  }

  return FINDING_CATEGORIES.map((id) => {
    const findingIds = findings
      .filter(({ category }) => category === id)
      .map(({ id: findingId }) => findingId)
    const hasFinding = scoredFindings.some(({ category }) => category === id)
    return {
      id,
      title: titles[id],
      status:
        hasFinding
          ? 'finding'
          : id !== 'security_headers' && status === 'partial'
            ? 'partial'
            : 'passed',
      findingIds,
    }
  })
}
