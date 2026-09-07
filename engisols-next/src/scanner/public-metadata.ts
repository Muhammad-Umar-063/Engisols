import { discoverRobots, discoverSitemap } from './discover-metadata'
import {
  fetchPublicResource,
  headerValue,
  ScanResourceLimitError,
  type RequestOnce,
  type ScanByteBudget,
} from './public-fetch'
import type { ScanCoverageCount, ScanLimits } from './types'
import type { DnsPinCache, ResolveHost } from './url-policy'

interface PublicMetadataOptions {
  limits: Readonly<ScanLimits>
  totalDeadlineAt: number
  absoluteDeadlineAt: number
  budget: ScanByteBudget
  dnsPins: DnsPinCache
  resolveHost?: ResolveHost
  requestOnce?: RequestOnce
  routeTargetCount: number
  deadlineNow?: () => number
}

interface PublicMetadataDiscovery {
  routeUrls: string[]
  coverage: ScanCoverageCount
  redirectsFollowed: number
  unsafeReferences: number
  skipped: Array<{ reason: string; count: number }>
  incomplete: boolean
}

type MetadataFetchOutcome =
  | {
      status: 'scanned'
      response: Awaited<ReturnType<typeof fetchPublicResource>>
    }
  | {
      status: 'skipped'
      reason:
        | 'metadata_deadline'
        | 'metadata_fetch_failed'
        | 'metadata_unusable_response'
        | 'total_timeout'
        | 'max_total_bytes'
      redirectsFollowed: number
    }

const metadataRequestTimeoutMs = 1_500

export async function discoverPublicMetadata(
  siteUrl: URL,
  options: PublicMetadataOptions,
): Promise<PublicMetadataDiscovery> {
  const routeUrls = new Set<string>()
  const metadataUrls = new Set<string>([new URL('/robots.txt', siteUrl).href])
  let attempted = 0
  let scanned = 0
  let redirectsFollowed = 0
  let unsafeReferences = 0
  let sitemapUrl: string | undefined
  const skipped = new Map<string, number>()
  let incomplete = false

  const robots = await fetchOptionalMetadata(
    new URL('/robots.txt', siteUrl),
    'robots',
    siteUrl,
    options,
  )
  attempted += 1
  if (robots.status === 'scanned') {
    scanned += 1
    redirectsFollowed += robots.response.redirectsFollowed
    const discovery = discoverRobots(robots.response.body, siteUrl)
    unsafeReferences += discovery.skipped
    for (const route of discovery.routeUrls) routeUrls.add(route)
    sitemapUrl = discovery.sitemapUrls[0]
  } else {
    redirectsFollowed += robots.redirectsFollowed
    increment(skipped, robots.reason)
    incomplete ||= robots.reason !== 'metadata_unusable_response'
  }

  if (sitemapUrl) metadataUrls.add(sitemapUrl)
  if (
    sitemapUrl &&
    routeUrls.size < options.routeTargetCount &&
    attempted < options.limits.maxMetadataDocuments
  ) {
    const sitemap = await fetchOptionalMetadata(
      new URL(sitemapUrl),
      'sitemap',
      siteUrl,
      options,
    )
    attempted += 1
    if (sitemap.status === 'scanned') {
      scanned += 1
      redirectsFollowed += sitemap.response.redirectsFollowed
      const discovery = discoverSitemap(sitemap.response.body, siteUrl)
      unsafeReferences += discovery.skipped
      for (const route of discovery.routeUrls) routeUrls.add(route)
    } else {
      redirectsFollowed += sitemap.redirectsFollowed
      increment(skipped, sitemap.reason)
      incomplete = true
    }
  }

  return {
    routeUrls: [...routeUrls],
    coverage: {
      discovered: metadataUrls.size,
      attempted,
      scanned,
    },
    redirectsFollowed,
    unsafeReferences,
    skipped: [...skipped.entries()].map(([reason, count]) => ({ reason, count })),
    incomplete,
  }
}

async function fetchOptionalMetadata(
  target: URL,
  kind: 'robots' | 'sitemap',
  siteUrl: URL,
  options: PublicMetadataOptions,
): Promise<MetadataFetchOutcome> {
  const deadlineNow = options.deadlineNow ?? Date.now
  if (deadlineNow() >= options.totalDeadlineAt) {
    return { status: 'skipped', reason: 'metadata_deadline', redirectsFollowed: 0 }
  }
  try {
    const response = await fetchPublicResource(target, {
      kind: 'metadata',
      limits: options.limits,
      requestTimeoutMs: metadataRequestTimeoutMs,
      totalDeadlineAt: options.totalDeadlineAt,
      absoluteDeadlineAt: options.absoluteDeadlineAt,
      budget: options.budget,
      dnsPins: options.dnsPins,
      resolveHost: options.resolveHost,
      requestOnce: options.requestOnce,
      allowedOrigin: siteUrl.origin,
      deadlineNow,
    })
    if (response.status < 200 || response.status >= 300) {
      return {
        status: 'skipped',
        reason: 'metadata_unusable_response',
        redirectsFollowed: response.redirectsFollowed,
      }
    }
    const contentType = headerValue(response.headers, 'content-type')?.toLowerCase()
    const usable =
      kind === 'robots'
        ? Boolean(contentType?.includes('text/plain'))
        : Boolean(
            contentType?.includes('xml') ||
              contentType?.includes('text/plain'),
          )
    return usable
      ? { status: 'scanned', response }
      : {
          status: 'skipped',
          reason: 'metadata_unusable_response',
          redirectsFollowed: response.redirectsFollowed,
        }
  } catch (error) {
    if (error instanceof ScanResourceLimitError) {
      return { status: 'skipped', reason: error.reason, redirectsFollowed: 0 }
    }
    return { status: 'skipped', reason: 'metadata_fetch_failed', redirectsFollowed: 0 }
  }
}

function increment(target: Map<string, number>, key: string): void {
  target.set(key, (target.get(key) ?? 0) + 1)
}
