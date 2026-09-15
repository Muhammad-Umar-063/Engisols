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

export function protectProductionCheckPostHogEvent(
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

function redactRecord<T extends Record<string, unknown>>(record: T): T {
  return Object.fromEntries(
    Object.entries(record).map(([key, value]) => [key, redactValue(value)]),
  ) as T
}

function redactValue(value: unknown): unknown {
  if (typeof value === 'string') return redactProductionCheckOfferCapabilities(value)
  if (Array.isArray(value)) return value.map(redactValue)
  if (!isPlainRecord(value)) return value
  return redactRecord(value)
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== 'object') return false
  const prototype = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}
