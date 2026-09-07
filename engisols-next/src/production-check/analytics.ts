export const PRODUCTION_CHECK_EVENTS = [
  'scan_started',
  'scan_completed',
  'scan_partial',
  'scan_failed',
  'report_viewed',
  'finding_expanded',
  'copy_prompt_clicked',
  'copy_fixes_clicked',
  'fix_cta_clicked',
  'senior_cta_clicked',
  'builder_answered',
  'launch_stage_answered',
  'report_link_copied',
] as const

export type ProductionCheckEvent = (typeof PRODUCTION_CHECK_EVENTS)[number]

export function trackProductionCheck(
  event: ProductionCheckEvent,
  detail: Readonly<Record<string, string | number | boolean>> = {},
): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(
    new CustomEvent('engisols:production-check', { detail: { event, ...detail } }),
  )
}
