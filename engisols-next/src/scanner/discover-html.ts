import {
  normalizePublicRoute,
  prioritizeRouteUrls,
} from './discover-metadata'
import { prioritizeScriptUrls } from './discover-js'
import { frameworkManifestKind } from './framework-manifest'

export interface HtmlDiscovery {
  scriptUrls: string[]
  routeUrls: string[]
  importMap: Record<string, string>
  inlineScripts: string[]
  skipped: {
    crossOriginScripts: number
    unsafeRoutes: number
  }
}

export function discoverHtml(html: string, pageUrl: URL): HtmlDiscovery {
  const scriptUrls = new Set<string>()
  const routeUrls = new Set<string>()
  const inlineScripts: string[] = []
  const importMap: Record<string, string> = {}
  let crossOriginScripts = 0
  let unsafeRoutes = 0

  for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)) {
    const attributes = parseAttributes(match[1] ?? '')
    const body = match[2] ?? ''
    const source = attributes.src
    if (source) {
      const outcome = addSameOriginScript(source, pageUrl, scriptUrls)
      if (outcome === 'cross_origin') {
        crossOriginScripts += 1
      }
    } else if (attributes.type?.toLowerCase() === 'importmap') {
      addImportMap(body, pageUrl, importMap)
    } else if (body.trim()) {
      inlineScripts.push(body)
      if (attributes.id?.toLowerCase() === '__next_data__') {
        addNextData(body, pageUrl, scriptUrls, routeUrls)
      }
    }
  }

  for (const match of html.matchAll(/<link\b([^>]*)>/gi)) {
    const attributes = parseAttributes(match[1] ?? '')
    const relationships = new Set(
      (attributes.rel ?? '').toLowerCase().split(/\s+/).filter(Boolean),
    )
    const isScriptLink =
      relationships.has('modulepreload') ||
      (relationships.has('preload') && attributes.as?.toLowerCase() === 'script') ||
      (relationships.has('manifest') &&
        frameworkManifestKind(attributes.href ?? '') !== null)
    if (!isScriptLink || !attributes.href) {
      continue
    }
    const outcome = addSameOriginScript(
      attributes.href,
      pageUrl,
      scriptUrls,
    )
    if (outcome === 'cross_origin') {
      crossOriginScripts += 1
    }
  }

  for (const match of html.matchAll(
    /((?:https?:\/\/[^"'\\<>\s]+)?\/(?:_next\/static|_nuxt)\/[^"'\\<>\s]+?\.m?js(?:\?[^"'\\<>\s]*)?)/gi,
  )) {
    const outcome = addSameOriginScript(match[1] ?? '', pageUrl, scriptUrls)
    if (outcome === 'cross_origin') {
      crossOriginScripts += 1
    }
  }

  for (const match of html.matchAll(/<a\b([^>]*)>/gi)) {
    const href = parseAttributes(match[1] ?? '').href
    if (!href) {
      continue
    }
    const route = normalizePublicRoute(href, pageUrl)
    if (route.kind === 'unsafe') {
      unsafeRoutes += 1
    } else if (route.kind === 'route') {
      routeUrls.add(route.url)
    }
  }

  return {
    scriptUrls: prioritizeScriptUrls([...scriptUrls]),
    routeUrls: prioritizeRouteUrls([...routeUrls]),
    importMap,
    inlineScripts,
    skipped: { crossOriginScripts, unsafeRoutes },
  }
}

function parseAttributes(source: string): Record<string, string> {
  const attributes: Record<string, string> = {}
  const pattern =
    /([^\s"'<>\/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g

  for (const match of source.matchAll(pattern)) {
    const name = match[1]?.toLowerCase()
    if (!name) {
      continue
    }
    attributes[name] = match[2] ?? match[3] ?? match[4] ?? ''
  }
  return attributes
}

function addSameOriginScript(
  value: string,
  pageUrl: URL,
  output: Set<string>,
): 'added' | 'ignored' | 'cross_origin' {
  let candidate: URL
  try {
    candidate = new URL(value, pageUrl)
  } catch {
    return 'ignored'
  }
  if (candidate.protocol !== 'http:' && candidate.protocol !== 'https:') {
    return 'ignored'
  }
  if (candidate.origin !== pageUrl.origin) {
    return 'cross_origin'
  }
  if (!isDiscoverableScriptPath(candidate.pathname)) {
    return 'ignored'
  }
  candidate.hash = ''
  output.add(candidate.href)
  return 'added'
}

function isDiscoverableScriptPath(pathname: string): boolean {
  return /\.m?js$/i.test(pathname) || frameworkManifestKind(pathname) !== null
}

function addImportMap(
  body: string,
  pageUrl: URL,
  output: Record<string, string>,
): void {
  try {
    const parsed = JSON.parse(body) as {
      imports?: Record<string, unknown>
    }
    for (const [specifier, value] of Object.entries(parsed.imports ?? {})) {
      if (typeof value !== 'string') {
        continue
      }
      const resolved = new URL(value, pageUrl)
      if (
        resolved.origin === pageUrl.origin &&
        /\.m?js$/i.test(resolved.pathname)
      ) {
        resolved.hash = ''
        output[specifier] = resolved.href
      }
    }
  } catch {
    // A malformed import map is not actionable scanner evidence.
  }
}

function addNextData(
  body: string,
  pageUrl: URL,
  scriptUrls: Set<string>,
  routeUrls: Set<string>,
): void {
  try {
    const value = JSON.parse(body) as { buildId?: unknown; page?: unknown }
    if (
      typeof value.buildId === 'string' &&
      /^[A-Za-z0-9._-]{1,200}$/.test(value.buildId)
    ) {
      addSameOriginScript(
        `/_next/static/${value.buildId}/_buildManifest.js`,
        pageUrl,
        scriptUrls,
      )
    }
    if (typeof value.page === 'string') {
      const route = normalizePublicRoute(value.page, pageUrl)
      if (route.kind === 'route') {
        routeUrls.add(route.url)
      }
    }
  } catch {
    // Invalid hydration data is ignored; it is not security evidence.
  }
}
