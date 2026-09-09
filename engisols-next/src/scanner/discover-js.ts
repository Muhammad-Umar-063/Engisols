import { frameworkManifestKind } from './framework-manifest'

export interface JavaScriptDiscovery {
  scriptUrls: string[]
  skipped: {
    crossOriginScripts: number
    unresolvedSpecifiers: number
    scriptCandidatesOmitted: number
  }
}

export function discoverJavaScript(
  source: string,
  importerUrl: URL,
  allowedOrigin: string,
  importMap: Readonly<Record<string, string>>,
  maxCandidates = 256,
): JavaScriptDiscovery {
  const specifiers = new Set<string>()
  let crossOriginScripts = 0
  let unresolvedSpecifiers = 0
  let scriptCandidatesOmitted = 0

  scriptCandidatesOmitted += collectMatches(
    source,
    /\b(?:import|export)\s+(?:[^'";]*?\s+from\s*)?['"]([^'"]+)['"]/g,
    specifiers,
    maxCandidates,
  )
  scriptCandidatesOmitted += collectMatches(
    source,
    /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
    specifiers,
    maxCandidates,
  )
  scriptCandidatesOmitted += collectMatches(
    source,
    /\bnew\s+URL\s*\(\s*['"]([^'"]+)['"]\s*,\s*import\.meta\.url\s*\)/g,
    specifiers,
    maxCandidates,
  )
  const manifestKind = frameworkManifestKind(importerUrl.pathname)
  if (manifestKind === 'vite') {
    scriptCandidatesOmitted += collectViteManifestSpecifiers(
      source,
      importerUrl,
      specifiers,
      maxCandidates,
    )
  } else if (manifestKind === 'next_build' || manifestKind === 'build') {
    for (const match of source.matchAll(
      /['"]((?:https?:\/\/|\/|\.\.?\/|static\/)[^'"]+?\.m?js(?:\?[^'"]*)?)['"]/g,
    )) {
      const value = match[1]
      const normalized = value
        ? normalizeFrameworkManifestAsset(value, importerUrl, manifestKind)
        : null
      if (normalized) {
        scriptCandidatesOmitted += addBounded(
          specifiers,
          normalized,
          maxCandidates,
        )
      }
    }
  }

  const output = new Set<string>()
  for (const specifier of specifiers) {
    const mapped = importMap[specifier]
    let candidate: URL
    try {
      if (mapped) {
        candidate = new URL(mapped)
      } else if (isBareSpecifier(specifier)) {
        unresolvedSpecifiers += 1
        continue
      } else {
        candidate = new URL(specifier, importerUrl)
      }
    } catch {
      unresolvedSpecifiers += 1
      continue
    }

    if (candidate.origin !== allowedOrigin) {
      crossOriginScripts += 1
      continue
    }
    if (!/\.m?js$/i.test(candidate.pathname)) {
      continue
    }
    candidate.hash = ''
    output.add(candidate.href)
  }

  return {
    scriptUrls: prioritizeScriptUrls([...output]),
    skipped: {
      crossOriginScripts,
      unresolvedSpecifiers,
      scriptCandidatesOmitted,
    },
  }
}

export function prioritizeScriptUrls(urls: readonly string[]): string[] {
  return [...new Set(urls)].sort((left, right) => {
    const priority = scriptPriority(left) - scriptPriority(right)
    return priority || left.localeCompare(right)
  })
}

export function scriptPriority(value: string): number {
  const pathname = new URL(value).pathname.toLowerCase()
  if (frameworkManifestKind(pathname) !== null) {
    return 0
  }
  if (
    /(?:^|[/_.-])(?:app|entry|main|page|pages)(?:[/_.-]|$)/.test(pathname) ||
    /(?:admin|account|billing|checkout|dashboard|profile|settings)/.test(
      pathname,
    )
  ) {
    return 1
  }
  if (/(?:runtime|webpack)/.test(pathname)) return 2
  if (/(?:vendor|framework|polyfill)/.test(pathname)) return 4
  return 3
}

function collectMatches(
  source: string,
  pattern: RegExp,
  output: Set<string>,
  limit: number,
): number {
  let omitted = 0
  for (const match of source.matchAll(pattern)) {
    if (match[1]) {
      omitted += addBounded(output, match[1], limit)
    }
  }
  return omitted
}

function isBareSpecifier(value: string): boolean {
  return !(
    value.startsWith('/') ||
    value.startsWith('./') ||
    value.startsWith('../') ||
    value.startsWith('http://') ||
    value.startsWith('https://')
  )
}

function collectViteManifestSpecifiers(
  source: string,
  importerUrl: URL,
  output: Set<string>,
  limit: number,
): number {
  let manifest: Record<string, unknown>
  try {
    manifest = JSON.parse(source) as Record<string, unknown>
  } catch {
    return 0
  }

  let omitted = 0
  for (const value of Object.values(manifest)) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      continue
    }
    const entry = value as Record<string, unknown>
    omitted += addViteAsset(entry.file, importerUrl, output, limit)
    for (const field of ['imports', 'dynamicImports'] as const) {
      const references = entry[field]
      if (!Array.isArray(references)) {
        continue
      }
      for (const reference of references) {
        if (typeof reference !== 'string') {
          continue
        }
        const referencedEntry = manifest[reference]
        if (
          referencedEntry &&
          typeof referencedEntry === 'object' &&
          !Array.isArray(referencedEntry)
        ) {
          omitted += addViteAsset(
            (referencedEntry as Record<string, unknown>).file,
            importerUrl,
            output,
            limit,
          )
        } else {
          omitted += addViteAsset(reference, importerUrl, output, limit)
        }
      }
    }
  }
  return omitted
}

function addViteAsset(
  value: unknown,
  importerUrl: URL,
  output: Set<string>,
  limit: number,
): number {
  if (typeof value !== 'string' || !/\.m?js(?:\?|$)/i.test(value)) {
    return 0
  }
  try {
    const candidate = new URL(
      value.startsWith('/') ? value : `/${value}`,
      importerUrl.origin,
    )
    if (candidate.origin === importerUrl.origin) {
      return addBounded(output, candidate.href, limit)
    }
  } catch {
    // Malformed manifest entries are outside useful scan coverage.
  }
  return 0
}

function addBounded(output: Set<string>, value: string, limit: number): number {
  if (output.has(value)) return 0
  if (output.size >= limit) return 1
  output.add(value)
  return 0
}

function normalizeFrameworkManifestAsset(
  value: string,
  importerUrl: URL,
  manifestKind: 'next_build' | 'build',
): string | null {
  try {
    const candidate =
      manifestKind === 'next_build' && value.startsWith('static/')
        ? new URL(`/_next/${value}`, importerUrl.origin)
        : new URL(value, importerUrl)
    return candidate.origin === importerUrl.origin &&
      /^(?:\/_next\/static\/|\/_nuxt\/|\/assets\/|\/static\/)/i.test(
        candidate.pathname,
      )
      ? candidate.href
      : null
  } catch {
    return null
  }
}
