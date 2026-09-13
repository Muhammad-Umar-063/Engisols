import type { MetaConsentDecision } from './types'

export const META_CONSENT_COOKIE = 'engisols_meta_consent'
export const META_CONSENT_EVENT = 'engisols:meta-consent'

export function resolveMetaConsent({
  cookieHeader,
  globalPrivacyControl = false,
}: {
  cookieHeader?: string | null
  globalPrivacyControl?: boolean
}): MetaConsentDecision {
  if (globalPrivacyControl) return 'denied'
  const stored = readCookie(cookieHeader, META_CONSENT_COOKIE)
  return stored === 'denied' ? 'denied' : 'granted'
}

export function readCookie(cookieHeader: string | null | undefined, name: string): string | undefined {
  if (!cookieHeader) return undefined
  for (const pair of cookieHeader.split(';')) {
    const separator = pair.indexOf('=')
    if (separator < 0 || pair.slice(0, separator).trim() !== name) continue
    try {
      return decodeURIComponent(pair.slice(separator + 1).trim())
    } catch {
      return undefined
    }
  }
  return undefined
}
