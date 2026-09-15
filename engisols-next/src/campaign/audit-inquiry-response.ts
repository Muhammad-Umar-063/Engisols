export type AuditInquiryNotification = 'sent' | 'delayed'

export type AuditInquirySuccess =
  | { kind: 'generic' }
  | {
      kind: 'lead'
      leadId: string
      notification: AuditInquiryNotification
      metaEventId: string
      message?: string
    }

const LEAD_ID_PATTERN = /^audit_lead_[A-Za-z0-9_-]{24}$/
const META_EVENT_ID_PATTERN = /^lead_[A-Za-z0-9_-]{32}$/

/**
 * Separates the deliberately opaque honeypot acknowledgement from a verified
 * durable-lead response. Only the latter is safe to treat as a conversion.
 */
export function parseAuditInquirySuccess(value: unknown): AuditInquirySuccess | null {
  if (!isRecord(value) || value.ok !== true) return null
  if (Object.keys(value).length === 1) return { kind: 'generic' }

  if (
    typeof value.leadId !== 'string' ||
    !LEAD_ID_PATTERN.test(value.leadId) ||
    (value.notification !== 'sent' && value.notification !== 'delayed') ||
    !isRecord(value.metaEvents) ||
    typeof value.metaEvents.primary !== 'string' ||
    !META_EVENT_ID_PATTERN.test(value.metaEvents.primary) ||
    (value.message !== undefined && typeof value.message !== 'string')
  ) {
    return null
  }

  return {
    kind: 'lead',
    leadId: value.leadId,
    notification: value.notification,
    metaEventId: value.metaEvents.primary,
    ...(value.message !== undefined ? { message: value.message } : {}),
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}
