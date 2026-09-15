import {
  auditInquirySubject,
  parseAuditInquirySubmission,
} from '../../../../src/campaign/audit-inquiry'
import {
  AUDIT_INQUIRY_NOTIFICATION_LEASE_MS,
  buildAuditInquiryLeadText,
  createAuditInquiryLead,
  markAuditInquiryNotification,
  UnsafeAuditInquiryContentError,
  type AuditInquiryLead,
  type AuditInquiryLeadStore,
} from '../../../../src/campaign/audit-inquiry-lead'
import {
  sendAuditInquiryEmail,
  type AuditInquiryEmailSender,
} from '../../../../src/campaign/audit-inquiry-email'
import { getAuditInquiryLeadStore } from '../../../../src/campaign/audit-inquiry-store'
import {
  sendMetaConversion,
  type MetaConversionSender,
} from '../../../../src/meta/capi.server'
import { metaRequestContext } from '../../../../src/meta/request.server'
import { verifyAttributionToken } from '../../../../src/production-check/attribution-token.server'
import { readLimitedJson } from '../../../../src/production-check/request'
import type { ProductionCheckAttribution } from '../../../../src/production-check/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 15

interface HandlerDependencies {
  leads?: AuditInquiryLeadStore
  send?: AuditInquiryEmailSender
  sendMeta?: MetaConversionSender
  verifyAttribution?: (token: string) => ProductionCheckAttribution | null
  now?: () => Date
}

export function createAuditInquiryPostHandler({
  leads,
  send = sendAuditInquiryEmail,
  sendMeta = sendMetaConversion,
  verifyAttribution = verifyAttributionToken,
  now = () => new Date(),
}: HandlerDependencies = {}) {
  return async function POST(request: Request): Promise<Response> {
    if (!isSameOrigin(request)) {
      return errorResponse(403, 'request_blocked', 'This request could not be submitted.')
    }

    let parsed: unknown
    try {
      parsed = await readLimitedJson(request)
    } catch {
      return errorResponse(400, 'invalid_request', 'Check the highlighted fields and try again.')
    }

    const submission = parseAuditInquirySubmission(parsed)
    if (!submission) {
      return errorResponse(400, 'invalid_request', 'Check the highlighted fields and try again.')
    }

    // Accept bot-filled honeypots without verifying tokens or creating side effects.
    if (submission.website) return successResponse()

    let attribution: ProductionCheckAttribution | null
    try {
      attribution = verifyAttribution(submission.attributionToken)
    } catch {
      attribution = null
    }
    if (!attribution) {
      return errorResponse(400, 'invalid_attribution', 'Refresh the page and try again.')
    }

    const requestContext = metaRequestContext(request, {
      fbclid: attribution.fbclid,
      receivedAt: now(),
    })
    let candidate: AuditInquiryLead
    try {
      candidate = createAuditInquiryLead(
        submission,
        attribution,
        requestContext,
        new URL('/ai-app-audit', request.url).toString(),
        now,
      )
    } catch (error) {
      if (error instanceof UnsafeAuditInquiryContentError) {
        return errorResponse(400, 'sensitive_content', error.message)
      }
      return errorResponse(500, 'lead_failed', 'We could not prepare this request. Please try again.')
    }

    let store: AuditInquiryLeadStore
    let lead: AuditInquiryLead
    let created: boolean
    try {
      store = leads ?? getAuditInquiryLeadStore()
      const result = await store.createOrGet(candidate)
      lead = result.lead
      created = result.created
      if (!created) {
        if (lead.notification.status === 'sent') return leadResponse(200, lead, 'sent')
        const claimedAt = now()
        const claimed = await store.claimNotification(
          lead.id,
          claimedAt.toISOString(),
          new Date(
            claimedAt.getTime() - AUDIT_INQUIRY_NOTIFICATION_LEASE_MS,
          ).toISOString(),
        )
        if (!claimed) return delayedLeadResponse(lead)
        lead = claimed
      }
    } catch {
      return errorResponse(
        503,
        'persistence_unavailable',
        'We could not save your request. Your details are still here—please try again.',
      )
    }

    const metaAttempt = attemptMetaLead(lead, request, sendMeta, now)
    const emailAttempt = send({
      replyTo: lead.email,
      subject: auditInquirySubject(lead.app),
      text: buildAuditInquiryLeadText(lead),
      idempotencyKey: `ai-app-audit/${lead.id}`,
    })
    const [metaResult, emailResult] = await Promise.allSettled([metaAttempt, emailAttempt])
    if (metaResult.status === 'fulfilled') lead = metaResult.value

    if (emailResult.status === 'fulfilled') {
      await store.save(markAuditInquiryNotification(lead, 'sent', now())).catch(() => undefined)
      return leadResponse(200, lead, 'sent')
    }
    await store.save(markAuditInquiryNotification(lead, 'failed', now())).catch(() => undefined)
    return delayedLeadResponse(lead)
  }
}

async function attemptMetaLead(
  lead: AuditInquiryLead,
  request: Request,
  sendMeta: MetaConversionSender,
  now: () => Date,
): Promise<AuditInquiryLead> {
  if (lead.metaTracking.lead.attemptedAt) return lead
  const attemptedAt = now()
  const requestContext = metaRequestContext(request, {
    fallbackIdentifiers: lead.metaTracking.identifiers,
  })
  try {
    const result = await sendMeta({
      eventName: 'Lead',
      eventId: lead.metaTracking.lead.eventId,
      eventTime: attemptedAt,
      eventSourceUrl: lead.metaTracking.eventSourceUrl,
      actionSource: 'website',
      consent: requestContext.consent,
      userData: {
        email: lead.email,
        identifiers: requestContext.identifiers,
        ...(requestContext.clientIp ? { clientIp: requestContext.clientIp } : {}),
        ...(requestContext.clientUserAgent
          ? { clientUserAgent: requestContext.clientUserAgent }
          : {}),
      },
    })
    return {
      ...lead,
      metaTracking: {
        ...lead.metaTracking,
        lead: {
          ...lead.metaTracking.lead,
          attemptedAt: attemptedAt.toISOString(),
          ...(result.status === 'sent' ? { sentAt: attemptedAt.toISOString() } : {}),
        },
      },
    }
  } catch {
    return {
      ...lead,
      metaTracking: {
        ...lead.metaTracking,
        lead: { ...lead.metaTracking.lead, attemptedAt: attemptedAt.toISOString() },
      },
    }
  }
}

function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get('origin')
  if (!origin) return true
  try {
    return new URL(origin).origin === new URL(request.url).origin
  } catch {
    return false
  }
}

function successResponse(): Response {
  return Response.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } })
}

function delayedLeadResponse(lead: AuditInquiryLead): Response {
  return leadResponse(
    202,
    lead,
    'delayed',
    'Your request is saved. Email notification is delayed, but your details were not lost.',
  )
}

function leadResponse(
  status: number,
  lead: AuditInquiryLead,
  notification: 'sent' | 'delayed',
  message?: string,
): Response {
  return Response.json(
    {
      ok: true,
      leadId: lead.id,
      notification,
      metaEvents: { primary: lead.metaTracking.lead.eventId },
      ...(message ? { message } : {}),
    },
    { status, headers: { 'Cache-Control': 'no-store' } },
  )
}

function errorResponse(status: number, code: string, message: string): Response {
  return Response.json(
    { ok: false, error: { code, message } },
    { status, headers: { 'Cache-Control': 'no-store' } },
  )
}

export const POST = createAuditInquiryPostHandler()
