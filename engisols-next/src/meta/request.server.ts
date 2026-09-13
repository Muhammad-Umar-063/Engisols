import { isIP } from 'node:net'

import { resolveMetaConsent } from './consent'
import { deriveFbc, mergeMetaIdentifiers, parseMetaIdentifiers } from './identifiers'
import type { MetaConsentDecision, MetaIdentifiers } from './types'

export interface MetaRequestContext {
  consent: MetaConsentDecision
  identifiers: MetaIdentifiers
  clientIp?: string
  clientUserAgent?: string
}

export function metaRequestContext(
  request: Request,
  options: {
    fbclid?: string
    receivedAt?: Date
    fallbackIdentifiers?: MetaIdentifiers
  } = {},
): MetaRequestContext {
  const cookieHeader = request.headers.get('cookie')
  const fromCookies = parseMetaIdentifiers(cookieHeader)
  const derivedFbc = fromCookies.fbc ?? deriveFbc(options.fbclid, options.receivedAt ?? new Date())
  const identifiers = mergeMetaIdentifiers(
    { ...fromCookies, ...(derivedFbc ? { fbc: derivedFbc } : {}) },
    options.fallbackIdentifiers ?? {},
  )
  const clientIp = clientIpFromHeaders(request.headers)
  const clientUserAgent = boundedUserAgent(request.headers.get('user-agent'))
  return {
    consent: resolveMetaConsent({
      cookieHeader,
      globalPrivacyControl: request.headers.get('sec-gpc') === '1',
    }),
    identifiers,
    ...(clientIp ? { clientIp } : {}),
    ...(clientUserAgent ? { clientUserAgent } : {}),
  }
}

export function clientIpFromHeaders(headers: Headers): string | undefined {
  const candidates = [
    headers.get('x-vercel-forwarded-for'),
    headers.get('x-forwarded-for')?.split(',')[0],
    headers.get('x-real-ip'),
  ]
  for (const candidate of candidates) {
    const value = candidate?.trim()
    if (value && isIP(value)) return value
  }
  return undefined
}

function boundedUserAgent(value: string | null): string | undefined {
  const normalized = value?.trim()
  if (!normalized || normalized.length > 512 || /[\u0000-\u001f\u007f]/.test(normalized)) {
    return undefined
  }
  return normalized
}
