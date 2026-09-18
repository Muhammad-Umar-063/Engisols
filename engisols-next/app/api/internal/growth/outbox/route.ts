import type { GrowthInternalRateLimiter } from '../../../../../src/growth/export-rate-limit'
import { growthInternalRateLimiter } from '../../../../../src/growth/export-rate-limit'
import { assertRotatingCredential, authorizeRotatingBearer } from '../../../../../src/growth/internal-auth'
import type { GrowthOutboxOperations } from '../../../../../src/growth/outbox-types'
import {
  deliverGrowthOutboxBatch,
  growthWebhookConfiguration,
  type GrowthDeliverySummary,
} from '../../../../../src/growth/webhook-delivery'
import {
  getGrowthOutboxStore,
  getScopeOfferStore,
} from '../../../../../src/production-check/store'
import type { ScopeOfferStore } from '../../../../../src/production-check/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 30

interface Dependencies {
  readonly environment?: NodeJS.ProcessEnv
  readonly now?: () => Date
  readonly outbox?: GrowthOutboxOperations
  readonly offers?: ScopeOfferStore
  readonly limiter?: GrowthInternalRateLimiter
  readonly deliver?: () => Promise<GrowthDeliverySummary>
}

export function createGrowthOutboxPostHandler({
  environment = process.env,
  now = () => new Date(),
  outbox,
  offers,
  limiter,
  deliver,
}: Dependencies = {}) {
  return async function POST(request: Request): Promise<Response> {
    const credential = {
      current: environment.GROWTH_COPILOT_OUTBOX_CRON_SECRET,
      previous: environment.GROWTH_COPILOT_OUTBOX_CRON_SECRET_PREVIOUS,
    }
    const credentialVersion = authorizeRotatingBearer(request, credential)
    if (!credentialVersion) return safeError(401, 'unauthorized')
    try { assertRotatingCredential(credential, 'Growth outbox cron') } catch { return safeError(503, 'not_configured') }

    let activeLimiter: GrowthInternalRateLimiter
    try { activeLimiter = limiter ?? growthInternalRateLimiter(environment) } catch { return safeError(503, 'temporarily_unavailable') }
    try {
      if (!await activeLimiter.consume('outbox', credentialVersion, now())) return safeError(429, 'rate_limited')
    } catch {
      return safeError(503, 'temporarily_unavailable')
    }

    try {
      const activeOutbox = outbox ?? getGrowthOutboxStore()
      const activeOffers = offers ?? getScopeOfferStore()
      // Expiration is a durable domain transition; it runs before delivery so
      // newly materialized expiration events can be claimed in this batch.
      const expired = await activeOffers.materializeExpired(now(), 50)
      const reclaimed = await activeOutbox.reclaimStale(now())
      const summary = deliver
        ? await deliver()
        : await deliverGrowthOutboxBatch({
            store: activeOutbox,
            configuration: growthWebhookConfiguration(environment),
            now,
          })
      return Response.json(
        { ok: true, expired, reclaimed, ...summary },
        { headers: { 'Cache-Control': 'no-store' } },
      )
    } catch {
      return safeError(503, 'temporarily_unavailable')
    }
  }
}

function safeError(status: number, code: string): Response {
  return Response.json(
    { ok: false, error: { code, message: 'Growth outbox processing could not be completed.' } },
    { status, headers: { 'Cache-Control': 'no-store' } },
  )
}

export const POST = createGrowthOutboxPostHandler()
