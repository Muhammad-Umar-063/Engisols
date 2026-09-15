'use client'

import { META_CONSENT_COOKIE, META_CONSENT_EVENT } from './consent'
import {
  isProductionCheckCapabilityUrl,
} from '../production-check/analytics-privacy'
import type {
  MetaBrowserCustomEvent,
  MetaBrowserStandardEvent,
  MetaCommerceData,
  MetaConsentDecision,
} from './types'

type Fbq = ((...args: unknown[]) => void) & {
  callMethod?: (...args: unknown[]) => void
  queue?: unknown[][]
  loaded?: boolean
  version?: string
  push?: (...args: unknown[]) => void
  disablePushState?: boolean
}

declare global {
  interface Window {
    fbq?: Fbq
    _fbq?: Fbq
  }
}

const PIXEL_ID_PATTERN = /^\d{5,32}$/
const EVENT_ID_PATTERN_BY_EVENT: Record<string, RegExp> = {
  ScanStarted: /^scanstart_[A-Za-z0-9_-]{32}$/,
  ScanCompleted: /^scancomplete_[A-Za-z0-9_-]{32}$/,
  Lead: /^lead_[A-Za-z0-9_-]{32}$/,
  QualifiedLead: /^ql_[A-Za-z0-9_-]{32}$/,
  Schedule: /^schedule_[A-Za-z0-9_-]{32}$/,
  Purchase: /^purchase_[A-Za-z0-9_-]{32}$/,
}
const ONCE_STORAGE_PREFIX = 'engisols:meta:event:'

let initializedPixelId: string | undefined
let lastPageViewKey: string | undefined

export const metaPixel = {
  init(pixelId: string | undefined): boolean {
    if (typeof window === 'undefined' || !pixelId || !PIXEL_ID_PATTERN.test(pixelId)) return false
    if (browserMetaConsent() === 'denied') return false
    const fbq = ensureFbq()
    if (initializedPixelId === pixelId) return true
    fbq.disablePushState = true
    fbq('set', 'autoConfig', false, pixelId)
    fbq('consent', 'grant')
    fbq('init', pixelId)
    initializedPixelId = pixelId
    return true
  },

  setConsent(decision: MetaConsentDecision): void {
    if (typeof window === 'undefined' || !window.fbq) return
    window.fbq('consent', decision === 'granted' ? 'grant' : 'revoke')
  },

  pageView(pathname: string): boolean {
    if (isProductionCheckCapabilityUrl(pathname)) return false
    const key = metaPageViewKey(pathname)
    if (!key || key === lastPageViewKey || !canTrack()) return false
    lastPageViewKey = key
    window.fbq?.('track', 'PageView')
    return true
  },

  track(
    eventName: Exclude<MetaBrowserStandardEvent, 'PageView'>,
    data?: MetaCommerceData,
    eventId?: string,
  ): boolean {
    return send('track', eventName, data, eventId)
  },

  trackCustom(
    eventName: MetaBrowserCustomEvent,
    eventId: string,
  ): boolean {
    return send('trackCustom', eventName, undefined, eventId)
  },
}

export function browserMetaConsent(): MetaConsentDecision {
  if (typeof document === 'undefined' || typeof navigator === 'undefined') return 'denied'
  const globalPrivacyControl = (navigator as Navigator & { globalPrivacyControl?: boolean })
    .globalPrivacyControl
  if (globalPrivacyControl) return 'denied'
  const stored = document.cookie
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${META_CONSENT_COOKIE}=`))
    ?.slice(META_CONSENT_COOKIE.length + 1)
  return stored === 'denied' ? 'denied' : 'granted'
}

export function setBrowserMetaConsent(decision: MetaConsentDecision): void {
  if (typeof document === 'undefined' || typeof window === 'undefined') return
  document.cookie = `${META_CONSENT_COOKIE}=${decision}; Path=/; Max-Age=15552000; SameSite=Lax; Secure`
  window.dispatchEvent(new CustomEvent(META_CONSENT_EVENT, { detail: decision }))
}

export function metaPageViewKey(pathname: string): string {
  const value = pathname.trim()
  if (!value) return ''
  try {
    return new URL(value, 'https://engisols.invalid').pathname
  } catch {
    return value.split(/[?#]/, 1)[0] ?? ''
  }
}

export function bridgeProductionCheckEvent(detail: unknown): boolean {
  if (!detail || typeof detail !== 'object' || Array.isArray(detail)) return false
  const input = detail as Record<string, unknown>
  if (typeof input.event !== 'string' || typeof input.metaEventId !== 'string') return false
  switch (input.event) {
    case 'scan_started':
      return metaPixel.trackCustom('ScanStarted', input.metaEventId)
    case 'scan_completed':
    case 'scan_partial':
      return metaPixel.trackCustom('ScanCompleted', input.metaEventId)
    case 'lead_created':
      return metaPixel.track('Lead', undefined, input.metaEventId)
    case 'lead_qualified':
      return metaPixel.trackCustom('QualifiedLead', input.metaEventId)
    default:
      return false
  }
}

export function bridgeAiAppAuditEvent(detail: unknown): boolean {
  if (!detail || typeof detail !== 'object' || Array.isArray(detail)) return false
  const input = detail as Record<string, unknown>
  if (typeof input.event !== 'string' || typeof input.metaEventId !== 'string') return false
  if (input.event !== 'inquiry_sent' && input.event !== 'inquiry_delayed') return false
  return metaPixel.track('Lead', undefined, input.metaEventId)
}

export function resetMetaBrowserStateForTests(): void {
  initializedPixelId = undefined
  lastPageViewKey = undefined
}

function send(
  command: 'track' | 'trackCustom',
  eventName: string,
  data: MetaCommerceData | undefined,
  eventId: string | undefined,
): boolean {
  if (!canTrack()) return false
  if (eventId && !EVENT_ID_PATTERN_BY_EVENT[eventName]?.test(eventId)) return false
  if (eventId && wasSent(eventId)) return false
  const payload = data ? { currency: data.currency, value: data.value } : {}
  if (eventId) {
    window.fbq?.(command, eventName, payload, { eventID: eventId })
    rememberSent(eventId)
  } else {
    window.fbq?.(command, eventName, payload)
  }
  return true
}

function canTrack(): boolean {
  return typeof window !== 'undefined' && Boolean(window.fbq) && browserMetaConsent() === 'granted'
}

function ensureFbq(): Fbq {
  if (window.fbq) return window.fbq
  const fbq = function (...args: unknown[]): void {
    if (fbq.callMethod) fbq.callMethod(...args)
    else fbq.queue?.push(args)
  } as Fbq
  fbq.push = (...args: unknown[]) => fbq(...args)
  fbq.loaded = true
  fbq.version = '2.0'
  fbq.queue = []
  window.fbq = fbq
  window._fbq = fbq
  return fbq
}

function wasSent(eventId: string): boolean {
  try {
    return window.localStorage.getItem(`${ONCE_STORAGE_PREFIX}${eventId}`) === '1'
  } catch {
    return false
  }
}

function rememberSent(eventId: string): void {
  try {
    window.localStorage.setItem(`${ONCE_STORAGE_PREFIX}${eventId}`, '1')
  } catch {
    // Storage can be blocked; Meta still deduplicates matching browser/server IDs.
  }
}
