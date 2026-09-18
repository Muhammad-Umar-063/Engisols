import type { GrowthOutboxOperations, GrowthOutboxSafeErrorCategory } from './outbox-types'
import { growthWebhookTimestamp, signGrowthWebhookBody } from './webhook-signature'

export const GROWTH_WEBHOOK_DEFAULT_TIMEOUT_MS = 8_000
export const GROWTH_OUTBOX_DEFAULT_LEASE_MS = 60_000
export const GROWTH_OUTBOX_DEFAULT_BATCH_SIZE = 10

export interface GrowthWebhookConfiguration {
  readonly url: string
  readonly secret: string
  readonly production: boolean
  readonly timeoutMs?: number | undefined
}

export interface GrowthDeliverySummary {
  readonly claimed: number
  readonly delivered: number
  readonly failed: number
  readonly deadLettered: number
}

interface DeliverGrowthOutboxOptions {
  readonly store: GrowthOutboxOperations
  readonly configuration: GrowthWebhookConfiguration
  readonly now?: () => Date
  readonly fetch?: typeof fetch
  readonly batchSize?: number
  readonly leaseMs?: number
  readonly concurrency?: number
}

export async function deliverGrowthOutboxBatch({
  store,
  configuration,
  now = () => new Date(),
  fetch: fetchImpl = fetch,
  batchSize = GROWTH_OUTBOX_DEFAULT_BATCH_SIZE,
  leaseMs = GROWTH_OUTBOX_DEFAULT_LEASE_MS,
  concurrency = 5,
}: DeliverGrowthOutboxOptions): Promise<GrowthDeliverySummary> {
  validateWebhookConfiguration(configuration)
  if (!Number.isSafeInteger(batchSize) || batchSize < 1 || batchSize > 100) throw new Error('Growth delivery batch size is invalid')
  if (!Number.isSafeInteger(concurrency) || concurrency < 1 || concurrency > 10) throw new Error('Growth delivery concurrency is invalid')
  const claimed = await store.claimDue(now(), leaseMs, batchSize)
  let delivered = 0
  let failed = 0
  let deadLettered = 0
  let cursor = 0

  const worker = async () => {
    while (cursor < claimed.length) {
      const item = claimed[cursor++]
      if (!item) continue
      const body = JSON.stringify(item.ledger.event)
      const timestamp = growthWebhookTimestamp(now())
      const signature = signGrowthWebhookBody(body, timestamp, configuration.secret)
      let failure: { category: GrowthOutboxSafeErrorCategory; terminal: boolean } | null = null
      try {
        const response = await fetchImpl(configuration.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Engisols-Event-Id': item.ledger.event.eventId,
            'X-Engisols-Timestamp': timestamp,
            'X-Engisols-Signature': signature,
          },
          body,
          redirect: 'error',
          cache: 'no-store',
          signal: AbortSignal.timeout(configuration.timeoutMs ?? GROWTH_WEBHOOK_DEFAULT_TIMEOUT_MS),
        })
        try { await response.body?.cancel() } catch { /* response bodies are intentionally ignored */ }
        if (response.status >= 200 && response.status < 300) {
          await store.markDelivered(item.ledger.event.eventId, now())
          delivered += 1
          continue
        }
        if (response.status === 408 || response.status === 425 || response.status === 429) {
          failure = { category: response.status === 429 ? 'rate_limited' : 'timeout', terminal: false }
        } else if (response.status >= 400 && response.status < 500) {
          failure = { category: 'provider_4xx', terminal: true }
        } else if (response.status >= 500 && response.status < 600) {
          failure = { category: 'provider_5xx', terminal: false }
        } else {
          failure = { category: 'invalid_response', terminal: false }
        }
      } catch (error) {
        const name = error instanceof Error ? error.name : ''
        failure = {
          category: name === 'AbortError' || name === 'TimeoutError' ? 'timeout' : 'network',
          terminal: false,
        }
      }

      const updated = await store.markFailed(
        item.ledger.event.eventId,
        now(),
        failure.category,
        failure.terminal,
      )
      failed += 1
      if (updated?.state === 'dead_letter') deadLettered += 1
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, claimed.length) }, () => worker()))
  return { claimed: claimed.length, delivered, failed, deadLettered }
}

export function growthWebhookConfiguration(environment: NodeJS.ProcessEnv = process.env): GrowthWebhookConfiguration {
  return {
    url: environment.GROWTH_COPILOT_WEBHOOK_URL ?? '',
    secret: environment.GROWTH_COPILOT_WEBHOOK_SECRET ?? '',
    production: environment.NODE_ENV === 'production',
  }
}

/** Best-effort post-response fast path. Durable retry remains authoritative. */
export async function attemptImmediateGrowthDelivery(): Promise<void> {
  try {
    const { getGrowthOutboxStore } = await import('../production-check/store')
    await deliverGrowthOutboxBatch({
      store: getGrowthOutboxStore(),
      configuration: growthWebhookConfiguration(),
      batchSize: 2,
      concurrency: 2,
    })
  } catch {
    // Customer workflows never depend on the shadow-mode consumer.
  }
}

function validateWebhookConfiguration(configuration: GrowthWebhookConfiguration): void {
  let target: URL
  try { target = new URL(configuration.url) } catch { throw new Error('Growth webhook URL is invalid') }
  if (target.username || target.password || target.hash) throw new Error('Growth webhook URL is invalid')
  if (configuration.production && target.protocol !== 'https:') throw new Error('Growth webhook URL must use HTTPS in production')
  if (!configuration.production && target.protocol !== 'https:' && target.protocol !== 'http:') {
    throw new Error('Growth webhook URL is invalid')
  }
  if (Buffer.byteLength(configuration.secret, 'utf8') < 32) {
    throw new Error('Growth webhook secret is not configured')
  }
  const timeout = configuration.timeoutMs ?? GROWTH_WEBHOOK_DEFAULT_TIMEOUT_MS
  if (!Number.isSafeInteger(timeout) || timeout < 500 || timeout > 30_000) throw new Error('Growth webhook timeout is invalid')
}
