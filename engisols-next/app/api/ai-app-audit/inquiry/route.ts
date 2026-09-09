import { createHash } from 'node:crypto'

import {
  auditInquirySubject,
  buildAuditInquiryText,
  parseAuditInquirySubmission,
} from '../../../../src/campaign/audit-inquiry'
import {
  AuditInquiryEmailConfigurationError,
  sendAuditInquiryEmail,
  type AuditInquiryEmailSender,
} from '../../../../src/campaign/audit-inquiry-email'
import { readLimitedJson } from '../../../../src/production-check/request'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 15

export function createAuditInquiryPostHandler(
  send: AuditInquiryEmailSender = sendAuditInquiryEmail,
) {
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

    // Accept bot-filled honeypots without creating a delivery side effect.
    if (submission.website) return successResponse()

    const text = buildAuditInquiryText(submission)
    try {
      await send({
        replyTo: submission.email,
        subject: auditInquirySubject(submission.app),
        text,
        idempotencyKey: idempotencyKeyFor(submission.email, text),
      })
      return successResponse()
    } catch (error) {
      const message = error instanceof AuditInquiryEmailConfigurationError
        ? 'Online requests are not configured yet. Please try again shortly.'
        : 'We could not send your request. Your details are still here—please try again.'
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

function idempotencyKeyFor(email: string, text: string): string {
  const fingerprint = createHash('sha256').update(`${email.toLowerCase()}\n${text}`).digest('hex').slice(0, 32)
  return `ai-app-audit/${fingerprint}`
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

export const POST = createAuditInquiryPostHandler()
