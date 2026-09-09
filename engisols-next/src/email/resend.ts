const RESEND_EMAIL_ENDPOINT = 'https://api.resend.com/emails'
const EMAIL_TIMEOUT_MS = 8_000

export interface ResendEmailMessage {
  replyTo: string
  subject: string
  text: string
  idempotencyKey: string
  tags: Array<{ name: string; value: string }>
}

export interface ResendConfiguration {
  apiKey: string
  from: string
  to: string
  userAgent: string
}

export class ResendDeliveryError extends Error {}

/**
 * Small provider adapter shared by campaign forms. Keeping the HTTP transport
 * here prevents each funnel from drifting on timeouts, idempotency, or which
 * provider response details are safe to expose.
 */
export async function sendEmailWithResend(
  message: ResendEmailMessage,
  configuration: ResendConfiguration,
  fetcher: typeof fetch = fetch,
): Promise<void> {
  let response: Response
  try {
    response = await fetcher(RESEND_EMAIL_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${configuration.apiKey}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': message.idempotencyKey,
        'User-Agent': configuration.userAgent,
      },
      body: JSON.stringify({
        from: configuration.from,
        to: [configuration.to],
        reply_to: message.replyTo,
        subject: message.subject,
        text: message.text,
        tags: message.tags,
      }),
      cache: 'no-store',
      signal: AbortSignal.timeout(EMAIL_TIMEOUT_MS),
    })
  } catch {
    throw new ResendDeliveryError('The email provider could not be reached.')
  }

  if (!response.ok) {
    throw new ResendDeliveryError('The email provider rejected the request.')
  }
}
