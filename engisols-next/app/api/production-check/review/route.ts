import {
  buildLeadNotificationText,
  createProductionCheckLead,
  markLeadNotification,
  UnsafeLeadContentError,
} from '../../../../src/production-check/lead'
import { loadScan } from '../../../../src/production-check/load'
import { productionReportPath } from '../../../../src/production-check/paths'
import { nextStepForLeadSegment } from '../../../../src/production-check/qualification'
import { isValidPublicScanId } from '../../../../src/production-check/report'
import { readLimitedJson } from '../../../../src/production-check/request'
import {
  sendReviewEmail,
  type ReviewEmailSender,
} from '../../../../src/production-check/review-email'
import {
  parseReviewRequestSubmission,
  reviewRequestSubject,
} from '../../../../src/production-check/review-intake'
import { getLeadStore } from '../../../../src/production-check/store'
import type {
  LeadStore,
  PersistedScan,
  ProductionCheckLeadNextStep,
} from '../../../../src/production-check/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 15

interface HandlerDependencies {
  load?: (publicId: string) => Promise<PersistedScan | null>
  leads?: LeadStore
  send?: ReviewEmailSender
  now?: () => Date
  createId?: () => string
}

export function createReviewRequestPostHandler({
  load = loadScan,
  leads,
  send = sendReviewEmail,
  now = () => new Date(),
  createId,
}: HandlerDependencies = {}) {
  return async function POST(request: Request): Promise<Response> {
    if (!isSameOrigin(request)) {
      return errorResponse(403, 'request_blocked', 'This request could not be submitted.')
    }

    let parsed: unknown
    try {
      parsed = await readLimitedJson(request)
    } catch {
      return errorResponse(400, 'invalid_request', 'Check the form and try again.')
    }

    const submission = parseReviewRequestSubmission(parsed)
    if (!submission || !isValidPublicScanId(submission.reportId)) {
      return errorResponse(400, 'invalid_request', 'Check the form and try again.')
    }

    // Silently accept bot-filled honeypots without loading private state or notifying.
    if (submission.website) return successResponse()

    let scan: PersistedScan | null
    try {
      scan = await load(submission.reportId)
    } catch {
      return errorResponse(
        503,
        'review_unavailable',
        'Review requests are temporarily unavailable. Please try again.',
      )
    }
    if (!scan) {
      return errorResponse(404, 'report_not_found', 'This report could not be found or has expired.')
    }
    if (!scan.result || (scan.status !== 'completed' && scan.status !== 'partial')) {
      return errorResponse(
        409,
        'report_not_ready',
        'Wait for the production check to finish before requesting a review.',
      )
    }

    let candidateLead
    try {
      candidateLead = createProductionCheckLead(submission, scan, now, createId)
    } catch (error) {
      if (error instanceof UnsafeLeadContentError) {
        return errorResponse(400, 'sensitive_content', error.message)
      }
      return errorResponse(500, 'lead_failed', 'We could not prepare this request. Please try again.')
    }

    let leadStore: LeadStore
    let lead: typeof candidateLead
    let created: boolean
    try {
      leadStore = leads ?? getLeadStore()
      const resolved = await leadStore.createOrGet(candidateLead)
      lead = resolved.lead
      created = resolved.created
    } catch {
      return errorResponse(
        503,
        'persistence_unavailable',
        'We could not save your request. Your details are still here—please try again.',
      )
    }

    const nextStep = nextStepForLeadSegment(lead.segment)
    if (!created) {
      if (lead.notification.status === 'sent') {
        return leadResponse(200, lead.id, nextStep, 'sent')
      }
      if (lead.notification.status === 'pending') {
        return delayedLeadResponse(lead.id, nextStep)
      }

      try {
        const claimed = await leadStore.claimFailedNotification(lead.id, now().toISOString())
        if (!claimed) {
          const current = await leadStore.get(lead.id)
          if (current?.notification.status === 'sent') {
            return leadResponse(
              200,
              current.id,
              nextStepForLeadSegment(current.segment),
              'sent',
            )
          }
          return delayedLeadResponse(lead.id, nextStep)
        }
        lead = claimed
      } catch {
        return errorResponse(
          503,
          'persistence_unavailable',
          'Your request is saved, but notification retry is temporarily unavailable.',
        )
      }
    }

    const reportUrl = new URL(productionReportPath(scan.publicId), request.url).toString()
    const text = buildLeadNotificationText(lead, reportUrl)

    try {
      await send({
        replyTo: submission.email,
        subject: reviewRequestSubject(lead.appUrl),
        text,
        idempotencyKey: `production-check/${lead.id}`,
      })
      await leadStore.save(markLeadNotification(lead, 'sent', now())).catch(() => undefined)
      return leadResponse(200, lead.id, nextStep, 'sent')
    } catch {
      await leadStore.save(markLeadNotification(lead, 'failed', now())).catch(() => undefined)
      return delayedLeadResponse(lead.id, nextStep)
    }
  }
}

function delayedLeadResponse(
  requestId: string,
  nextStep: ProductionCheckLeadNextStep,
): Response {
  return leadResponse(
    202,
    requestId,
    nextStep,
    'delayed',
    'Your request is saved. Email notification is delayed, but your details were not lost.',
  )
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

function leadResponse(
  status: number,
  requestId: string,
  nextStep: ProductionCheckLeadNextStep,
  notification: 'sent' | 'delayed',
  message?: string,
): Response {
  return Response.json(
    { ok: true, requestId, nextStep, notification, ...(message ? { message } : {}) },
    { status, headers: { 'Cache-Control': 'no-store' } },
  )
}

function errorResponse(status: number, code: string, message: string): Response {
  return Response.json(
    { ok: false, error: { code, message } },
    { status, headers: { 'Cache-Control': 'no-store' } },
  )
}

export const POST = createReviewRequestPostHandler()
