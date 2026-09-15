const allowedPostHogProperties = new Set([
  'scan_id',
  'scope_review_id',
  'offer_type',
  'offer_amount',
  'currency',
  'launch_stage',
  'builder',
  'lead_segment',
  'reportId',
  'findingId',
  'label',
  'expanded',
  'filter',
  'lens',
  'answer',
  'layout',
  'urgent',
  'location',
  'metaEventId',
  'nextStep',
])

export function productionCheckPostHogProperties(
  detail: Readonly<Record<string, string | number | boolean>>,
): Record<string, string | number | boolean> {
  const normalized: Record<string, string | number | boolean> = {
    ...detail,
    ...(typeof detail.reportId === 'string' && !detail.scan_id
      ? { scan_id: detail.reportId }
      : {}),
  }
  return Object.fromEntries(
    Object.entries(normalized).filter(([key, value]) =>
      allowedPostHogProperties.has(key) &&
      (typeof value === 'number' || typeof value === 'boolean' || (typeof value === 'string' && value.length <= 160)),
    ),
  )
}
