const allowedPostHogProperties = new Set([
  'scope_review_id',
  'offer_type',
  'offer_amount',
  'currency',
  'launch_stage',
  'builder',
  'lead_segment',
  'findingId',
  'label',
  'expanded',
  'filter',
  'lens',
  'answer',
  'layout',
  'urgent',
  'location',
  'nextStep',
])

export function productionCheckPostHogProperties(
  detail: Readonly<Record<string, string | number | boolean>>,
): Record<string, string | number | boolean> {
  return Object.fromEntries(
    Object.entries(detail).filter(([key, value]) =>
      allowedPostHogProperties.has(key) &&
      (typeof value === 'number' || typeof value === 'boolean' || (typeof value === 'string' && value.length <= 160)),
    ),
  )
}
