const FORBIDDEN_KEYS = new Set([
  'name', 'email', 'company', 'appUrl', 'applicationUrl', 'context', 'shippingContext',
  'internalNotes', 'recommendationSummary', 'informationRequested', 'scannerEvidence',
  'evidence', 'operatorToken', 'token', 'accessToken', 'password', 'secret', 'signedUrl',
])

/** Defense in depth; the strict event parser also rejects every unknown field. */
export function assertNoForbiddenGrowthData(value: unknown, path = '$'): void {
  if (value === null || value === undefined || typeof value !== 'object') return
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertNoForbiddenGrowthData(item, `${path}[${index}]`))
    return
  }
  if (Object.getPrototypeOf(value) !== Object.prototype) {
    throw new Error(`Growth event contains an unsupported object at ${path}`)
  }
  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    if (FORBIDDEN_KEYS.has(key)) throw new Error(`Growth event contains forbidden data at ${path}.${key}`)
    assertNoForbiddenGrowthData(nested, `${path}.${key}`)
  }
}
