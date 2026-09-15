import type { CaptureResult } from 'posthog-js'

export const PRODUCTION_CHECK_OFFER_URL_PATTERN = /\/production-check\/offer\/[^/?#\s]+/

export function isProductionCheckOfferUrl(value: string): boolean {
  return PRODUCTION_CHECK_OFFER_URL_PATTERN.test(value)
}

export function redactProductionCheckOfferCapabilities(value: string): string {
  return value.replace(
    /\/production-check\/offer\/[^/?#\s]+/g,
    '/production-check/offer/redacted',
  )
}

export function sanitizePostHogUrl(value: string): string {
  const redactedValue = redactProductionCheckOfferCapabilities(value)
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
  const onOfferRoute = [currentUrl, currentEventUrl, currentEventPath]
    .some((value) => typeof value === 'string' && isProductionCheckOfferUrl(value))

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
