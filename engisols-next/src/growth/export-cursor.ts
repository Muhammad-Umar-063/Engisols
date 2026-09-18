import { createHmac, timingSafeEqual } from 'node:crypto'

export const ENGISOLS_GROWTH_EXPORT_SCHEMA_VERSION = 'engisols-growth-export/v1' as const

export interface GrowthExportCursorClaims {
  readonly version: 1
  readonly afterSequence: number
  readonly snapshotMaxSequence: number
  readonly since: string
  readonly until: string
  readonly complete: boolean
}

export function signGrowthExportCursor(claims: GrowthExportCursorClaims, secret: string): string {
  assertCursorClaims(claims)
  assertSecret(secret)
  const payload = Buffer.from(JSON.stringify(claims), 'utf8').toString('base64url')
  return `${payload}.${sign(payload, secret)}`
}

export function verifyGrowthExportCursor(
  cursor: string,
  secrets: readonly string[],
): GrowthExportCursorClaims | null {
  if (!cursor || cursor.length > 4_096) return null
  const [payload, suppliedEncoded, extra] = cursor.split('.')
  if (!payload || !suppliedEncoded || extra || !/^[A-Za-z0-9_-]+$/.test(payload) || !/^[A-Za-z0-9_-]+$/.test(suppliedEncoded)) return null
  const supplied = Buffer.from(suppliedEncoded, 'base64url')
  const valid = secrets.some((secret) => {
    if (Buffer.byteLength(secret, 'utf8') < 32) return false
    const expected = Buffer.from(sign(payload, secret), 'base64url')
    return supplied.length === expected.length && timingSafeEqual(supplied, expected)
  })
  if (!valid) return null
  try {
    const claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as GrowthExportCursorClaims
    assertCursorClaims(claims)
    return claims
  } catch {
    return null
  }
}

function sign(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(`engisols-growth-export-cursor/v1.${payload}`).digest('base64url')
}

function assertSecret(secret: string): void {
  if (Buffer.byteLength(secret, 'utf8') < 32) throw new Error('Growth export cursor secret must contain at least 32 bytes')
}

function assertCursorClaims(value: GrowthExportCursorClaims): void {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Growth export cursor is invalid')
  const keys = Object.keys(value)
  if (keys.some((key) => !['version', 'afterSequence', 'snapshotMaxSequence', 'since', 'until', 'complete'].includes(key))) {
    throw new Error('Growth export cursor is invalid')
  }
  if (
    value.version !== 1 ||
    !Number.isSafeInteger(value.afterSequence) || value.afterSequence < 0 ||
    !Number.isSafeInteger(value.snapshotMaxSequence) || value.snapshotMaxSequence < value.afterSequence ||
    typeof value.since !== 'string' || !Number.isFinite(Date.parse(value.since)) ||
    typeof value.until !== 'string' || !Number.isFinite(Date.parse(value.until)) ||
    typeof value.complete !== 'boolean'
  ) throw new Error('Growth export cursor is invalid')
}
