import type { ScanLimits } from './types'

export const DEFAULT_SCAN_LIMITS: Readonly<ScanLimits> = Object.freeze({
  requestBodyTimeoutMs: 1_000,
  requestTimeoutMs: 4_000,
  totalTimeoutMs: 12_000,
  maxRedirects: 3,
  maxHtmlBytes: 1_048_576,
  maxMetadataBytes: 262_144,
  maxJavaScriptBytes: 1_572_864,
  maxTotalBytes: 8_388_608,
  maxHeaderBytes: 65_536,
  maxDocuments: 3,
  maxMetadataDocuments: 2,
  maxAdditionalRoutes: 2,
  maxJavaScriptAssets: 16,
  maxDiscoveredJavaScriptAssets: 256,
  maxJavaScriptDepth: 2,
  maxFindings: 100,
  maxConcurrentScans: 4,
  maxRequestBodyBytes: 4_096,
})

export function resolveScanLimits(
  requested: Partial<ScanLimits> = {},
): Readonly<ScanLimits> {
  const limits = Object.fromEntries(
    Object.entries(DEFAULT_SCAN_LIMITS).map(([key, hardCeiling]) => {
      const requestedValue = requested[key as keyof ScanLimits]
      const value =
        typeof requestedValue === 'number' &&
        Number.isFinite(requestedValue) &&
        requestedValue > 0
          ? Math.min(Math.floor(requestedValue), hardCeiling)
          : hardCeiling

      return [key, value]
    }),
  ) as unknown as ScanLimits

  return Object.freeze(limits)
}
