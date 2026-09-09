import { createHmac, timingSafeEqual } from 'node:crypto'

import { parseAttributionInput } from './attribution'
import { containsCredentialLikeValue } from './security'
import type { ProductionCheckAttribution } from './types'

const ATTRIBUTION_TOKEN_VERSION = 1
const ATTRIBUTION_TOKEN_LIFETIME_MS = 24 * 60 * 60 * 1_000
const MAX_ATTRIBUTION_TOKEN_LENGTH = 4_096
const DEVELOPMENT_ONLY_SECRET =
  'engisols-production-check-attribution-development-only-secret-v1'

interface AttributionTokenPayload {
  version: typeof ATTRIBUTION_TOKEN_VERSION
  issuedAt: number
  expiresAt: number
  attribution: ProductionCheckAttribution
}

interface AttributionTokenOptions {
  now?: Date
  secret?: string
  env?: NodeJS.ProcessEnv
}

export function signAttributionToken(
  attribution: ProductionCheckAttribution,
  options: AttributionTokenOptions = {},
): string {
  const parsedAttribution = parseAttributionInput(attribution)
  if (!parsedAttribution || containsCredentialLikeValue(parsedAttribution)) {
    throw new Error('Attribution contains a credential-like value.')
  }

  const issuedAt = (options.now ?? new Date()).getTime()
  const payload: AttributionTokenPayload = {
    version: ATTRIBUTION_TOKEN_VERSION,
    issuedAt,
    expiresAt: issuedAt + ATTRIBUTION_TOKEN_LIFETIME_MS,
    attribution: parsedAttribution,
  }
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const signature = sign(encodedPayload, resolveSigningSecret(options))
  return `${encodedPayload}.${signature}`
}

export function verifyAttributionToken(
  token: string,
  options: AttributionTokenOptions = {},
): ProductionCheckAttribution | null {
  if (!token || token.length > MAX_ATTRIBUTION_TOKEN_LENGTH) return null
  const parts = token.split('.')
  if (parts.length !== 2) return null
  const [encodedPayload, encodedSignature] = parts
  if (
    !encodedPayload ||
    !encodedSignature ||
    !/^[A-Za-z0-9_-]+$/.test(encodedPayload) ||
    !/^[A-Za-z0-9_-]+$/.test(encodedSignature)
  ) {
    return null
  }

  const expectedSignature = Buffer.from(
    sign(encodedPayload, resolveSigningSecret(options)),
    'base64url',
  )
  const suppliedSignature = Buffer.from(encodedSignature, 'base64url')
  if (
    suppliedSignature.length !== expectedSignature.length ||
    !timingSafeEqual(suppliedSignature, expectedSignature)
  ) {
    return null
  }

  let payload: unknown
  try {
    payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'))
  } catch {
    return null
  }
  if (!isValidPayload(payload, options.now ?? new Date())) return null
  return structuredClone(payload.attribution)
}

function sign(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('base64url')
}

function resolveSigningSecret(options: AttributionTokenOptions): string {
  const env = options.env ?? process.env
  const secret =
    options.secret ??
    env.PRODUCTION_CHECK_ATTRIBUTION_SECRET ??
    env.UPSTASH_REDIS_REST_TOKEN ??
    env.KV_REST_API_TOKEN
  if (secret) return secret
  if (env.NODE_ENV === 'production') {
    throw new Error(
      'Production attribution signing requires PRODUCTION_CHECK_ATTRIBUTION_SECRET or the configured REST persistence token.',
    )
  }
  return DEVELOPMENT_ONLY_SECRET
}

function isValidPayload(
  value: unknown,
  now: Date,
): value is AttributionTokenPayload {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const payload = value as Record<string, unknown>
  if (
    Object.keys(payload).some(
      (key) => !['version', 'issuedAt', 'expiresAt', 'attribution'].includes(key),
    ) ||
    payload.version !== ATTRIBUTION_TOKEN_VERSION ||
    !Number.isInteger(payload.issuedAt) ||
    !Number.isInteger(payload.expiresAt)
  ) {
    return false
  }

  const issuedAt = payload.issuedAt as number
  const expiresAt = payload.expiresAt as number
  const nowMs = now.getTime()
  if (
    issuedAt > nowMs + 5 * 60 * 1_000 ||
    expiresAt <= nowMs ||
    expiresAt <= issuedAt ||
    expiresAt - issuedAt > ATTRIBUTION_TOKEN_LIFETIME_MS
  ) {
    return false
  }

  const attribution = parseAttributionInput(payload.attribution)
  if (!attribution || containsCredentialLikeValue(attribution)) return false
  payload.attribution = attribution
  return true
}
