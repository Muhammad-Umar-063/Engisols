import type { EngisolsGrowthEvent } from './event-contract'

export const GROWTH_EVENT_RETENTION_SECONDS = 365 * 24 * 60 * 60
export const GROWTH_OUTBOX_MAX_ATTEMPTS = 8
export const GROWTH_OUTBOX_BASE_BACKOFF_MS = 30_000
export const GROWTH_OUTBOX_MAX_BACKOFF_MS = 6 * 60 * 60 * 1_000

export type GrowthOutboxState =
  | 'pending'
  | 'delivering'
  | 'delivered'
  | 'failed'
  | 'dead_letter'

export type GrowthOutboxSafeErrorCategory =
  | 'configuration'
  | 'network'
  | 'timeout'
  | 'provider_4xx'
  | 'provider_5xx'
  | 'rate_limited'
  | 'invalid_response'
  | 'unknown'

export interface GrowthEventLedgerRecord {
  readonly sequence: number
  readonly event: EngisolsGrowthEvent
  readonly payloadDigest: string
  readonly recordedAt: string
  readonly retainedUntil: string
}

export interface GrowthOutboxRecord {
  readonly eventId: string
  readonly state: GrowthOutboxState
  readonly attemptCount: number
  readonly nextAttemptAt: string
  readonly createdAt: string
  readonly updatedAt: string
  readonly leaseExpiresAt?: string | undefined
  readonly deliveredAt?: string | undefined
  readonly lastSafeErrorCategory?: GrowthOutboxSafeErrorCategory | undefined
}

export interface ClaimedGrowthEvent {
  readonly ledger: GrowthEventLedgerRecord
  readonly outbox: GrowthOutboxRecord
}

export interface GrowthOutboxAppend {
  readonly event: EngisolsGrowthEvent
  readonly retainedUntil?: string | undefined
}

export interface GrowthOutboxDeliveryHealth {
  readonly asOf: string
  readonly failed: number
  readonly deadLetter: number
}

export interface GrowthOutboxOperations {
  claimDue(now: Date, leaseMs: number, limit: number): Promise<ClaimedGrowthEvent[]>
  markDelivered(eventId: string, deliveredAt: Date): Promise<GrowthOutboxRecord | null>
  markFailed(
    eventId: string,
    failedAt: Date,
    category: GrowthOutboxSafeErrorCategory,
    terminal?: boolean,
  ): Promise<GrowthOutboxRecord | null>
  reclaimStale(now: Date): Promise<number>
  getLedger(eventId: string): Promise<GrowthEventLedgerRecord | null>
  getOutbox(eventId: string): Promise<GrowthOutboxRecord | null>
  getMaxSequence(): Promise<number>
  listLedger(afterSequence?: number, limit?: number, maxSequence?: number): Promise<GrowthEventLedgerRecord[]>
  getDeliveryHealth(now: Date): Promise<GrowthOutboxDeliveryHealth>
}

export interface GrowthOutboxStore extends GrowthOutboxOperations {
  commit<T>(events: readonly GrowthOutboxAppend[], mutateBusinessState: () => T): T
}

export function growthOutboxBackoffMs(attemptCount: number): number {
  if (!Number.isSafeInteger(attemptCount) || attemptCount < 1) {
    throw new Error('Growth outbox attempt count must be a positive safe integer')
  }
  return Math.min(
    GROWTH_OUTBOX_BASE_BACKOFF_MS * (2 ** Math.min(attemptCount - 1, 20)),
    GROWTH_OUTBOX_MAX_BACKOFF_MS,
  )
}
