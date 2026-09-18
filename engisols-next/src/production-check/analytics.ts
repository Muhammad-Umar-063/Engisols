import posthog from 'posthog-js'

import { productionCheckPostHogProperties } from './analytics-properties'

const posthogConfigured = Boolean(
  process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN &&
    process.env.NEXT_PUBLIC_POSTHOG_HOST,
)

export const PRODUCTION_CHECK_CANONICAL_FUNNEL = [
  'landing viewed',
  'scan_started',
  'scan_completed',
  'report_viewed',
  'scope_review_requested',
  'lead_created',
  'lead_qualified',
  'offer_sent',
  'offer_accepted',
] as const

export const POSTHOG_FUNNEL_COMPATIBILITY = {
  offer_sent: ['scope_offer_viewed'],
  offer_accepted: ['scope_offer_approved'],
  offer_declined: ['scope_offer_declined'],
} as const

export const PRODUCTION_CHECK_EVENTS = [
  'landing viewed',
  'scan_started',
  'scan_completed',
  'scan_partial',
  'scan_failed',
  'report_viewed',
  'finding_expanded',
  'finding_selected',
  'finding_filter_selected',
  'report_lens_selected',
  'copy_prompt_clicked',
  'copy_fixes_clicked',
  'fix_cta_clicked',
  'senior_cta_clicked',
  'builder_answered',
  'launch_stage_answered',
  'report_link_copied',
  'review_intake_opened',
  'review_request_copied',
  'review_request_sent',
  'review_request_failed',
  'lead_created',
  'lead_segmented',
  'lead_nurture',
  'lead_maybe',
  'lead_qualified',
  'scope_review_cta_clicked',
  'scope_review_requested',
  'scope_review_confirmation_viewed',
  'scope_offer_viewed',
  'scope_offer_approved',
  'scope_offer_declined',
  'offer_sent',
  'offer_accepted',
  'offer_declined',
  'scope_more_info_requested',
] as const

export type ProductionCheckEvent = (typeof PRODUCTION_CHECK_EVENTS)[number]

export function trackProductionCheck(
  event: ProductionCheckEvent,
  detail: Readonly<Record<string, string | number | boolean>> = {},
  options: { subject?: string; storage?: 'local' | 'session' } = {},
): void {
  if (typeof window === 'undefined') return
  const properties = productionCheckPostHogProperties(detail)
  const subject = options.subject ?? analyticalSubject(properties)
  const insertId = subject ? stablePostHogInsertId(event, subject) : undefined
  const storage = options.storage ?? 'local'
  if (insertId && wasAlreadyCaptured(insertId, storage)) return
  if (posthogConfigured) {
    posthog.capture(event, {
      ...properties,
      ...(insertId ? { $insert_id: insertId } : {}),
    })
  }
  if (insertId) rememberCapture(insertId, storage)
  window.dispatchEvent(
    new CustomEvent('engisols:production-check', { detail: { event, ...detail } }),
  )
}

export function identifyProductionCheckSubject(analyticsScanId: string): void {
  if (typeof window === 'undefined' || !posthogConfigured) return
  if (!/^scan_v1_[A-Za-z0-9_-]{43}$/.test(analyticsScanId)) {
    throw new Error('Production Check analytics identity is invalid')
  }
  posthog.identify(analyticsScanId)
}

export function productionCheckLandingSubject(): string {
  if (typeof window === 'undefined') return 'landing-session-server'
  const key = 'engisols:production-check:landing-session:v1'
  try {
    const existing = window.sessionStorage.getItem(key)
    if (existing && /^[A-Za-z0-9._:-]{1,200}$/.test(existing)) return existing
    const created = `landing-session-${window.crypto.randomUUID()}`
    window.sessionStorage.setItem(key, created)
    return created
  } catch {
    return `landing-session-${window.crypto.randomUUID()}`
  }
}

export function stablePostHogInsertId(event: string, analyticalSubjectId: string): string {
  if (/^(?:rpt_|offer_)(?!v\d+_)/.test(analyticalSubjectId)) {
    throw new Error('PostHog insert IDs must not contain a capability subject')
  }
  if (
    !/^[A-Za-z0-9._: -]{1,160}$/.test(event) ||
    !/^[A-Za-z0-9._:-]{1,200}$/.test(analyticalSubjectId)
  ) {
    throw new Error('PostHog insert ID input is invalid')
  }
  return `production-check/v1/${event.replaceAll(' ', '_')}/${analyticalSubjectId}`
}

function analyticalSubject(
  properties: Readonly<Record<string, string | number | boolean>>,
): string | undefined {
  for (const key of ['offer_id', 'scope_review_id', 'lead_id', 'scan_id'] as const) {
    const value = properties[key]
    if (typeof value === 'string' && value) return value
  }
  return undefined
}

const CAPTURE_LEDGER_KEY = 'engisols:production-check:posthog:v1'
const MAX_CAPTURE_LEDGER_ENTRIES = 128

function wasAlreadyCaptured(insertId: string, storage: 'local' | 'session'): boolean {
  return readCaptureLedger(storage).includes(insertId)
}

function rememberCapture(insertId: string, storage: 'local' | 'session'): void {
  try {
    const next = nextPostHogCaptureLedger(readCaptureLedger(storage), insertId)
    window[storage === 'local' ? 'localStorage' : 'sessionStorage']
      .setItem(CAPTURE_LEDGER_KEY, JSON.stringify(next))
  } catch {
    // Analytics storage can be unavailable without affecting the product flow.
  }
}

export function nextPostHogCaptureLedger(
  current: readonly string[],
  insertId: string,
): string[] {
  return [...current.filter((value) => value !== insertId), insertId]
    .slice(-MAX_CAPTURE_LEDGER_ENTRIES)
}

function readCaptureLedger(storage: 'local' | 'session'): string[] {
  try {
    const parsed: unknown = JSON.parse(
      window[storage === 'local' ? 'localStorage' : 'sessionStorage']
        .getItem(CAPTURE_LEDGER_KEY) ?? '[]',
    )
    return Array.isArray(parsed)
      ? parsed.filter((value): value is string => typeof value === 'string').slice(-MAX_CAPTURE_LEDGER_ENTRIES)
      : []
  } catch {
    return []
  }
}
