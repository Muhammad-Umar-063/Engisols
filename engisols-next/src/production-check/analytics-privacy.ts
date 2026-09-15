import type { CaptureResult } from 'posthog-js'

export const PRODUCTION_CHECK_OFFER_URL_PATTERN = /\/production-check\/offer\/[^/?#\s]+/
export const PRODUCTION_CHECK_REPORT_URL_PATTERN = /\/production-check\/report\/[^/?#\s]+/
export const INTERNAL_PRODUCTION_CHECK_URL_PATTERN = /\/internal\/production-check(?:\/|$)/
export const POSTHOG_REPLAY_BLOCK_SELECTOR = '[data-ph-sensitive-evidence]'
export const POSTHOG_ROUTER_COMMIT_EVENT = 'engisols:router-commit'

export function isProductionCheckOfferUrl(value: string): boolean {
  return PRODUCTION_CHECK_OFFER_URL_PATTERN.test(value)
}

export function isProductionCheckReportUrl(value: string): boolean {
  return PRODUCTION_CHECK_REPORT_URL_PATTERN.test(value)
}

export function isProductionCheckActiveScanUrl(value: string): boolean {
  try {
    const url = new URL(value, 'https://analytics.invalid')
    return (
      (url.pathname === '/production-check' || url.pathname === '/production-check/') &&
      url.searchParams.has('scanId')
    )
  } catch {
    return /\/production-check\/?\?[^#\s]*\bscanId=/i.test(value)
  }
}

export function isInternalProductionCheckUrl(value: string): boolean {
  try {
    return INTERNAL_PRODUCTION_CHECK_URL_PATTERN.test(
      new URL(value, 'https://analytics.invalid').pathname,
    )
  } catch {
    return INTERNAL_PRODUCTION_CHECK_URL_PATTERN.test(value)
  }
}

export function isProductionCheckCapabilityUrl(value: string): boolean {
  return (
    isProductionCheckOfferUrl(value) ||
    isProductionCheckReportUrl(value) ||
    isProductionCheckActiveScanUrl(value) ||
    isInternalProductionCheckUrl(value)
  )
}

export function redactProductionCheckOfferCapabilities(value: string): string {
  return value.replace(
    /\/production-check\/offer\/[^/?#\s]+/g,
    '/production-check/offer/redacted',
  )
}

export function redactProductionCheckReportCapabilities(value: string): string {
  return value.replace(
    /\/production-check\/report\/[^/?#\s]+/g,
    '/production-check/report/redacted',
  )
}

export function redactProductionCheckScanCapabilities(value: string): string {
  return value.replace(/([?&]scanId=)[^&#\s]*/gi, '$1redacted')
}

export function redactInternalProductionCheckCapabilities(value: string): string {
  return value.replace(
    /\/internal\/production-check(?:\/[^/?#\s]+)*(?:\?[^#\s]*)?(?:#[^\s]*)?/g,
    '/internal/production-check/redacted',
  )
}

export function sanitizePostHogUrl(value: string): string {
  const redactedValue = redactProductionCheckScanCapabilities(
    redactProductionCheckReportCapabilities(
      redactProductionCheckOfferCapabilities(
        redactInternalProductionCheckCapabilities(value),
      ),
    ),
  )
  const queryIndex = redactedValue.indexOf('?')
  const fragmentIndex = redactedValue.indexOf('#')
  const suffixIndex = [queryIndex, fragmentIndex]
    .filter((index) => index >= 0)
    .reduce((first, index) => Math.min(first, index), redactedValue.length)

  if (suffixIndex === redactedValue.length) return redactedValue

  const cleanUrl = redactedValue.slice(0, suffixIndex)

  try {
    const pathname = new URL(cleanUrl, 'https://analytics.invalid').pathname
    if (pathname === '/ai-app-audit' || pathname === '/ai-app-audit/') {
      return cleanUrl
    }
  } catch {
    // Leave non-URL strings unchanged after offer capability redaction.
  }

  return redactedValue
}

export function protectPostHogEvent(
  event: CaptureResult | null,
  currentUrl: string,
): CaptureResult | null {
  if (!event) return null
  const currentEventUrl = event.properties.$current_url
  const currentEventPath = event.properties.$pathname
  const onInternalRoute = [currentUrl, currentEventUrl, currentEventPath]
    .some((value) => typeof value === 'string' && isInternalProductionCheckUrl(value))
  const onOfferRoute = [currentUrl, currentEventUrl, currentEventPath]
    .some((value) => typeof value === 'string' && isProductionCheckOfferUrl(value))

  // Operator review pages contain customer evidence and authorization context.
  // Nothing from those pages, including explicit events, is allowed to reach
  // PostHog. URL redaction below remains defense in depth for referrers captured
  // after the visitor has returned to a public route.
  if (onInternalRoute) return null

  // PostHog's built-in events cover page views, autocapture, exceptions, heatmaps,
  // web vitals, and session replay snapshots. None should be collected on an
  // offer capability route. Explicit business events remain useful after their
  // SDK-added URL properties are redacted below.
  if (onOfferRoute && event.event.startsWith('$')) return null

  return {
    ...event,
    properties: redactRecord(event.properties),
    ...(event.$set ? { $set: redactRecord(event.$set) } : {}),
    ...(event.$set_once ? { $set_once: redactRecord(event.$set_once) } : {}),
  }
}

export const protectProductionCheckPostHogEvent = protectPostHogEvent

function redactRecord<T extends Record<string, unknown>>(record: T): T {
  return Object.fromEntries(
    Object.entries(record).map(([key, value]) => [key, redactValue(value)]),
  ) as T
}

function redactValue(value: unknown): unknown {
  if (typeof value === 'string') return sanitizePostHogUrl(value)
  if (Array.isArray(value)) return value.map(redactValue)
  if (!isPlainRecord(value)) return value
  return redactRecord(value)
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== 'object') return false
  const prototype = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}
