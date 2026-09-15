'use client'

import posthog from 'posthog-js'

import { aiAppAuditPostHogProperties } from './analytics-properties'

const posthogConfigured = Boolean(
  process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN && process.env.NEXT_PUBLIC_POSTHOG_HOST,
)

export const AI_APP_AUDIT_EVENTS = [
  'viewed',
  'inquiry_opened',
  'inquiry_submitted',
  'inquiry_sent',
  'inquiry_delayed',
  'inquiry_failed',
] as const

export type AiAppAuditEvent = (typeof AI_APP_AUDIT_EVENTS)[number]
export const AI_APP_AUDIT_META_EVENT = 'engisols:ai-app-audit-meta'

export function trackAiAppAudit(
  event: AiAppAuditEvent,
  detail: Readonly<Record<string, unknown>> = {},
): void {
  if (typeof window === 'undefined') return
  if (posthogConfigured) {
    posthog.capture(`ai_audit_${event}`, aiAppAuditPostHogProperties(detail))
  }
  const metaEventId = detail.metaEventId
  if (
    (event === 'inquiry_sent' || event === 'inquiry_delayed') &&
    typeof metaEventId === 'string'
  ) {
    window.dispatchEvent(new CustomEvent(AI_APP_AUDIT_META_EVENT, {
      detail: { event, metaEventId },
    }))
  }
}
