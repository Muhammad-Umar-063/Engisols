const destructivePathPattern =
  /(?:^|\/)(?:action|api|delete|destroy|logout|remove|signout)(?:\/|$)/i
const resourceExtensionPattern =
  /\.(?:avif|css|csv|gif|ico|jpe?g|json|map|mjs|pdf|png|svg|txt|webp|xml|zip)$/i
const highValueSegments = [
  'admin',
  'backoffice',
  'dashboard',
  'checkout',
  'billing',
  'account',
  'profile',
  'settings',
  'login',
  'signin',
  'signup',
  'register',
  'pricing',
]

export interface MetadataDiscovery {
  routeUrls: string[]
  skipped: number
}

export interface RobotsDiscovery extends MetadataDiscovery {
  sitemapUrls: string[]
}

export type RouteNormalization =
  | { kind: 'route'; url: string }
  | { kind: 'unsafe' }
  | { kind: 'ignored' }

export function discoverRobots(
  source: string,
  siteUrl: URL,
): RobotsDiscovery {
  const sitemapUrls = new Set<string>()
  const routeUrls = new Set<string>()
  let skipped = 0

  for (const rawLine of source.split(/\r?\n/)) {
    const line = rawLine.replace(/\s+#.*$/, '').trim()
    const separator = line.indexOf(':')
    if (separator < 0) continue
    const directive = line.slice(0, separator).trim().toLowerCase()
    const value = line.slice(separator + 1).trim()
    if (!value) continue

    if (directive === 'sitemap') {
      const sitemap = normalizeMetadataUrl(value, siteUrl, /\.xml$/i)
      if (sitemap) sitemapUrls.add(sitemap)
      else skipped += 1
    } else if (directive === 'allow') {
      const route = normalizePublicRoute(value, siteUrl)
      if (route.kind === 'route') routeUrls.add(route.url)
      else if (route.kind === 'unsafe') skipped += 1
    }
  }

  return {
    sitemapUrls: [...sitemapUrls].sort(),
    routeUrls: prioritizeRouteUrls([...routeUrls]),
    skipped,
  }
}

export function discoverSitemap(
  source: string,
  siteUrl: URL,
  maxRoutes = 200,
): MetadataDiscovery {
  const routeUrls = new Set<string>()
  let skipped = 0

  for (const match of source.matchAll(/<loc\b[^>]*>([\s\S]*?)<\/loc\s*>/gi)) {
    const value = decodeXmlText(match[1] ?? '').trim()
    const route = normalizePublicRoute(value, siteUrl)
    if (route.kind !== 'route') {
      skipped += 1
      continue
    }
    if (!routeUrls.has(route.url) && routeUrls.size >= maxRoutes) {
      skipped += 1
      continue
    }
    routeUrls.add(route.url)
  }

  return {
    routeUrls: prioritizeRouteUrls([...routeUrls]),
    skipped,
  }
}

export function prioritizeRouteUrls(urls: readonly string[]): string[] {
  return [...new Set(urls)].sort((left, right) => {
    const priority = routePriority(left) - routePriority(right)
    return priority || left.localeCompare(right)
  })
}

export function normalizePublicRoute(
  value: string,
  pageUrl: URL,
): RouteNormalization {
  let candidate: URL
  try {
    candidate = new URL(value, pageUrl)
  } catch {
    return { kind: 'ignored' }
  }
  if (
    !['http:', 'https:'].includes(candidate.protocol) ||
    candidate.origin !== pageUrl.origin
  ) {
    return { kind: 'ignored' }
  }
  if (candidate.search || destructivePathPattern.test(candidate.pathname)) {
    return { kind: 'unsafe' }
  }
  if (
    resourceExtensionPattern.test(candidate.pathname) ||
    candidate.pathname.startsWith('/_next/') ||
    candidate.pathname.startsWith('/_nuxt/')
  ) {
    return { kind: 'unsafe' }
  }
  candidate.hash = ''
  if (candidate.pathname === pageUrl.pathname) {
    return { kind: 'ignored' }
  }
  return { kind: 'route', url: candidate.href }
}

function normalizeMetadataUrl(
  value: string,
  siteUrl: URL,
  pathnamePattern: RegExp,
): string | null {
  try {
    const candidate = new URL(value, siteUrl)
    if (
      candidate.origin !== siteUrl.origin ||
      candidate.search ||
      !pathnamePattern.test(candidate.pathname)
    ) {
      return null
    }
    candidate.hash = ''
    return candidate.href
  } catch {
    return null
  }
}

function routePriority(value: string): number {
  const pathname = new URL(value).pathname.toLowerCase()
  const index = highValueSegments.findIndex((segment) =>
    new RegExp(`(?:^|/)${segment}(?:/|$)`, 'i').test(pathname),
  )
  return index < 0 ? highValueSegments.length : index
}

function decodeXmlText(value: string): string {
  return value
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
}
