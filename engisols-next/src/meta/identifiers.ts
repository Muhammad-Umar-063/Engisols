import { readCookie } from './consent'
import type { MetaIdentifiers } from './types'

const META_IDENTIFIER_MAX_LENGTH = 255
const META_COOKIE_PATTERN = /^fb\.\d+\.\d{10,13}\.[A-Za-z0-9._~-]+$/
const FBCLID_PATTERN = /^[A-Za-z0-9._~-]{1,200}$/

export function parseMetaIdentifiers(cookieHeader?: string | null): MetaIdentifiers {
  const fbp = normalizeMetaCookie(readCookie(cookieHeader, '_fbp'))
  const fbc = normalizeMetaCookie(readCookie(cookieHeader, '_fbc'))
  return {
    ...(fbp ? { fbp } : {}),
    ...(fbc ? { fbc } : {}),
  }
}

export function deriveFbc(fbclid: string | undefined, receivedAt: Date): string | undefined {
  const normalized = fbclid?.trim()
  if (!normalized || !FBCLID_PATTERN.test(normalized)) return undefined
  const timestamp = receivedAt.getTime()
  if (!Number.isSafeInteger(timestamp) || timestamp <= 0) return undefined
  return `fb.1.${timestamp}.${normalized}`
}

export function mergeMetaIdentifiers(
  current: MetaIdentifiers,
  fallback: MetaIdentifiers,
): MetaIdentifiers {
  const fbp = normalizeMetaCookie(current.fbp) ?? normalizeMetaCookie(fallback.fbp)
  const fbc = normalizeMetaCookie(current.fbc) ?? normalizeMetaCookie(fallback.fbc)
  return {
    ...(fbp ? { fbp } : {}),
    ...(fbc ? { fbc } : {}),
  }
}

export function normalizeMetaCookie(value: string | undefined): string | undefined {
  if (!value || value.length > META_IDENTIFIER_MAX_LENGTH) return undefined
  return META_COOKIE_PATTERN.test(value) ? value : undefined
}
