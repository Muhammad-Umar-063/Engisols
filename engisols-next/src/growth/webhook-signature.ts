import { createHmac } from 'node:crypto'

const SIGNATURE_VERSION = 'v1'

export function signGrowthWebhookBody(
  rawBody: string | Uint8Array,
  timestamp: string,
  secret: string,
): string {
  assertWebhookSecret(secret)
  if (!/^\d{10,13}$/.test(timestamp)) throw new Error('Growth webhook timestamp is invalid')
  const body = typeof rawBody === 'string' ? Buffer.from(rawBody, 'utf8') : Buffer.from(rawBody)
  const digest = createHmac('sha256', secret)
    .update(timestamp, 'utf8')
    .update('.', 'utf8')
    .update(body)
    .digest('hex')
  return `${SIGNATURE_VERSION}=${digest}`
}

export function growthWebhookTimestamp(now: Date): string {
  const milliseconds = now.getTime()
  if (!Number.isFinite(milliseconds)) throw new Error('Growth webhook timestamp is invalid')
  return String(Math.floor(milliseconds / 1_000))
}

function assertWebhookSecret(secret: string): void {
  if (Buffer.byteLength(secret, 'utf8') < 32) {
    throw new Error('GROWTH_COPILOT_WEBHOOK_SECRET must contain at least 32 bytes')
  }
}
