import posthog from 'posthog-js'

import { productionCheckPostHogProperties } from './analytics-properties'

const posthogConfigured = Boolean(
  process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN &&
    process.env.NEXT_PUBLIC_POSTHOG_HOST,
)

export const PRODUCTION_CHECK_EVENTS = [
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
  'scope_more_info_requested',
] as const

export type ProductionCheckEvent = (typeof PRODUCTION_CHECK_EVENTS)[number]

export function trackProductionCheck(
  event: ProductionCheckEvent,
  detail: Readonly<Record<string, string | number | boolean>> = {},
): void {
  if (typeof window === 'undefined') return
  if (posthogConfigured) posthog.capture(event, productionCheckPostHogProperties(detail))
  window.dispatchEvent(
    new CustomEvent('engisols:production-check', { detail: { event, ...detail } }),
  )
}
