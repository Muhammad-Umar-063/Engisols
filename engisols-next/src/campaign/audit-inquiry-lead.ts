import { createHash } from 'node:crypto'

import { createMetaEventId } from '../meta/event-id.server'
import type { MetaRequestContext } from '../meta/request.server'
import type { MetaLeadTracking } from '../meta/types'
import type { RetainedNotificationClaimStore } from '../persistence/retained-notification-store'
import { LEAD_RECORD_LIFETIME_MS } from '../production-check/config'
import { containsCredentialLikeValue } from '../production-check/security'
import type { ProductionCheckAttribution } from '../production-check/types'
import type { AuditInquirySubmission } from './audit-inquiry'

// Delivery calls are bounded by the 15-second route duration. A one-minute
// lease prevents concurrent retries while allowing abandoned work to recover.
export const AUDIT_INQUIRY_NOTIFICATION_LEASE_MS = 60 * 1_000

export interface AuditInquiryLead {
  id: string
  createdAt: string
  updatedAt: string
  expiresAt: string
  name: string
  email: string
  app: string
  worry: string
  attribution: ProductionCheckAttribution
  notification: {
    status: 'pending' | 'sent' | 'failed'
    attemptedAt?: string
  }
  metaTracking: MetaLeadTracking
}

export interface AuditInquiryLeadStore
  extends RetainedNotificationClaimStore<AuditInquiryLead> {
  createOrGet(lead: AuditInquiryLead): Promise<{ lead: AuditInquiryLead; created: boolean }>
  save(lead: AuditInquiryLead): Promise<void>
  get(id: string): Promise<AuditInquiryLead | null>
}

export class UnsafeAuditInquiryContentError extends Error {}

export function createAuditInquiryLead(
  submission: AuditInquirySubmission,
  attribution: ProductionCheckAttribution,
  requestContext: MetaRequestContext,
  eventSourceUrl: string,
  now: () => Date = () => new Date(),
): AuditInquiryLead {
  const createdAt = now()
  const id = createAuditInquiryLeadId(submission)
  const lead: AuditInquiryLead = {
    id,
    createdAt: createdAt.toISOString(),
    updatedAt: createdAt.toISOString(),
    expiresAt: new Date(createdAt.getTime() + LEAD_RECORD_LIFETIME_MS).toISOString(),
    name: submission.name,
    email: submission.email,
    app: submission.app,
    worry: submission.worry,
    attribution: structuredClone(attribution),
    notification: { status: 'pending' },
    metaTracking: {
      consent: requestContext.consent,
      identifiers: structuredClone(requestContext.identifiers),
      eventSourceUrl,
      lead: { eventId: createMetaEventId('Lead', id) },
    },
  }
  if (containsCredentialLikeValue({
    name: lead.name,
    email: lead.email,
    app: lead.app,
    worry: lead.worry,
    attribution: lead.attribution,
  })) {
    throw new UnsafeAuditInquiryContentError(
      'Remove passwords, API keys, or other credentials before sending this request.',
    )
  }
  return lead
}

export function markAuditInquiryNotification(
  lead: AuditInquiryLead,
  status: 'sent' | 'failed',
  attemptedAt: Date,
): AuditInquiryLead {
  return {
    ...lead,
    updatedAt: attemptedAt.toISOString(),
    notification: { status, attemptedAt: attemptedAt.toISOString() },
  }
}

export function buildAuditInquiryLeadText(lead: AuditInquiryLead): string {
  const attribution = [
    ['Source', lead.attribution.source],
    ['Medium', lead.attribution.medium],
    ['Campaign', lead.attribution.campaign],
    ['Content', lead.attribution.content],
    ['Term', lead.attribution.term],
    ['Facebook click ID', lead.attribution.fbclid],
  ].filter((entry): entry is [string, string] => Boolean(entry[1]))

  return [
    'AI app audit scoping request',
    '',
    `Lead ID: ${lead.id}`,
    `Name: ${lead.name}`,
    `Reply email: ${lead.email}`,
    `App or product: ${lead.app}`,
    '',
    'Attribution:',
    ...(attribution.length ? attribution.map(([label, value]) => `${label}: ${value}`) : ['Not provided']),
    '',
    'What they want investigated:',
    lead.worry,
    '',
    'Source route: /ai-app-audit',
  ].join('\n')
}

function createAuditInquiryLeadId(submission: AuditInquirySubmission): string {
  const identity = JSON.stringify([
    normalizeIdentityText(submission.name),
    submission.email.trim().toLocaleLowerCase('en-US'),
    normalizeIdentityText(submission.app),
    submission.worry.normalize('NFKC').trim().replace(/\r\n?/g, '\n'),
  ])
  const digest = createHash('sha256').update(identity).digest('base64url').slice(0, 24)
  return `audit_lead_${digest}`
}

function normalizeIdentityText(value: string): string {
  return value.normalize('NFKC').trim().replace(/\s+/g, ' ')
}
