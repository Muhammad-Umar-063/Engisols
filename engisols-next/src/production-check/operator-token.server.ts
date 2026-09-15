import { createHmac, timingSafeEqual } from 'node:crypto'

import { OPERATOR_LINK_LIFETIME_MS } from './config'

interface CreateOperatorTokenOptions {
  now?: () => Date
  lifetimeMs?: number
}

interface OperatorTokenPayload {
  reviewId: string
  expiresAt: number
}

export function createOperatorToken(
  reviewId: string,
  secret: string,
  options: CreateOperatorTokenOptions = {},
): string {
  assertSecret(secret)
  const now = options.now?.() ?? new Date()
  const payload: OperatorTokenPayload = {
    reviewId,
    expiresAt: now.getTime() + (options.lifetimeMs ?? OPERATOR_LINK_LIFETIME_MS),
  }
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url')
  return `${encodedPayload}.${sign(encodedPayload, secret)}`
}

export function verifyOperatorToken(
  token: string,
  expectedReviewId: string,
  secret: string,
  now: () => Date = () => new Date(),
): boolean {
  try {
    assertSecret(secret)
    const [encodedPayload, suppliedSignature, extra] = token.split('.')
    if (!encodedPayload || !suppliedSignature || extra) return false
    const expectedSignature = sign(encodedPayload, secret)
    const supplied = Buffer.from(suppliedSignature, 'base64url')
    const expected = Buffer.from(expectedSignature, 'base64url')
    if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) return false
    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8')) as Partial<OperatorTokenPayload>
    return payload.reviewId === expectedReviewId &&
      typeof payload.expiresAt === 'number' &&
      Number.isSafeInteger(payload.expiresAt) &&
      payload.expiresAt > now().getTime()
  } catch {
    return false
  }
}

export function productionCheckOperatorSecret(): string {
  const secret = process.env.PRODUCTION_CHECK_OPERATOR_SECRET
  if (!secret) throw new Error('Production Check operator access is not configured.')
  assertSecret(secret)
  return secret
}

function sign(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('base64url')
}

function assertSecret(secret: string): void {
  if (Buffer.byteLength(secret, 'utf8') < 32) {
    throw new Error('PRODUCTION_CHECK_OPERATOR_SECRET must be at least 32 bytes.')
  }
}
