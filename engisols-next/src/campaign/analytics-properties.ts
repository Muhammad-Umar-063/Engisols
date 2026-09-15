const allowedPostHogProperties = new Set([
  'cta_location',
  'notification',
  'http_status',
  'error_code',
])

export function aiAppAuditPostHogProperties(
  detail: Readonly<Record<string, unknown>>,
): Record<string, string | number | boolean> {
  return Object.fromEntries(
    Object.entries(detail).filter(([key, value]) =>
      allowedPostHogProperties.has(key) &&
      (typeof value === 'number' || typeof value === 'boolean' ||
        (typeof value === 'string' && value.length <= 160)),
    ),
  ) as Record<string, string | number | boolean>
}
