import { createHash } from 'node:crypto'

import { loadScan } from '../../../../src/production-check/load'
import { productionReportPath } from '../../../../src/production-check/paths'
import { buildFounderReport, isValidPublicScanId } from '../../../../src/production-check/report'
import { readLimitedJson } from '../../../../src/production-check/request'
import {
  ReviewEmailConfigurationError,
  sendReviewEmail,
  type ReviewEmailSender,
} from '../../../../src/production-check/review-email'
import {
  buildReviewRequestText,
  parseReviewRequestSubmission,
  reviewRequestSubject,
  type ReviewRequestContext,
} from '../../../../src/production-check/review-intake'
import type { PersistedScan } from '../../../../src/production-check/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 15

interface HandlerDependencies {
  load?: (publicId: string) => Promise<PersistedScan | null>
  send?: ReviewEmailSender
}

export function createReviewRequestPostHandler({
  load = loadScan,
  send = sendReviewEmail,
}: HandlerDependencies = {}) {
  return async function POST(request: Request): Promise<Response> {
    if (!isSameOrigin(request)) return errorResponse(403, 'request_blocked', 'This request could not be submitted.')

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

    // Silently accept bot-filled honeypots without sending an email.
    if (submission.website) return successResponse()

    let scan: PersistedScan | null
    try {
      scan = await load(submission.reportId)
    } catch {
      return errorResponse(503, 'review_unavailable', 'Review requests are temporarily unavailable. Please try again.')
    }
    if (!scan) {
      return errorResponse(404, 'report_not_found', 'This report could not be found or has expired.')
    }
    if (!scan.result || (scan.status !== 'completed' && scan.status !== 'partial')) {
      return errorResponse(409, 'report_not_ready', 'Wait for the production check to finish before requesting a review.')
    }

    const report = buildFounderReport(scan.result, scan.answers.builder)
    const reviewContext: ReviewRequestContext = {
      reportId: scan.publicId,
      targetUrl: scan.result.target.finalUrl,
      verdict: report.verdict,
      recommendedAction: report.startHere.action,
      fixNow: report.counts.fixNow,
      review: report.counts.review,
      expected: report.counts.expected,
      needsCodeReview: report.productionProof.needsCodeReview,
      builder: scan.answers.builder,
      launchStage: scan.answers.launchStage,
    }
    const reportUrl = new URL(productionReportPath(scan.publicId), request.url).toString()
    const text = buildReviewRequestText(submission, reviewContext, reportUrl)

    try {
      await send({
        replyTo: submission.email,
        subject: reviewRequestSubject(reviewContext.targetUrl),
        text,
        idempotencyKey: idempotencyKeyFor(submission.reportId, submission.email, text),
      })
      return successResponse()
    } catch (error) {
      const message = error instanceof ReviewEmailConfigurationError
        ? 'Online requests are not configured yet. Copy the request and email it to us directly.'
        : 'We could not send your request. Your details are still here—try again or copy the request.'
      return errorResponse(503, 'delivery_failed', message)
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

function idempotencyKeyFor(reportId: string, email: string, text: string): string {
  const fingerprint = createHash('sha256').update(`${email.toLowerCase()}\n${text}`).digest('hex').slice(0, 32)
  return `production-check/${reportId}/${fingerprint}`
}

function successResponse(): Response {
  return Response.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } })
}

function errorResponse(status: number, code: string, message: string): Response {
  return Response.json(
    { ok: false, error: { code, message } },
    { status, headers: { 'Cache-Control': 'no-store' } },
  )
}

export const POST = createReviewRequestPostHandler()
