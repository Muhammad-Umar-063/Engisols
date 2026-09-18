import { growthEventPayloadDigest } from './event-contract'
import { parseEngisolsGrowthEvent } from './event-schema'
import {
  GROWTH_EVENT_RETENTION_SECONDS,
  GROWTH_OUTBOX_MAX_ATTEMPTS,
  growthOutboxBackoffMs,
  type ClaimedGrowthEvent,
  type GrowthEventLedgerRecord,
  type GrowthOutboxAppend,
  type GrowthOutboxRecord,
  type GrowthOutboxOperations,
  type GrowthOutboxSafeErrorCategory,
  type GrowthOutboxStore,
} from './outbox-types'
import { UpstashRestClient } from '../persistence/upstash-rest-client'

export const GROWTH_REDIS_SEQUENCE_KEY = 'engisols:growth:ledger:sequence'
export const GROWTH_REDIS_LEDGER_INDEX_KEY = 'engisols:growth:ledger:index'
export const GROWTH_REDIS_DUE_KEY = 'engisols:growth:outbox:due'
export const GROWTH_REDIS_LEASE_KEY = 'engisols:growth:outbox:leases'
export const GROWTH_REDIS_OFFER_EXPIRY_KEY = 'engisols:growth:offers:expires'
export const GROWTH_REDIS_LEDGER_KEY_PREFIX = 'engisols:growth:event:'
export const GROWTH_REDIS_OUTBOX_KEY_PREFIX = 'engisols:growth:outbox:'

export type MemoryGrowthOutboxFailurePoint =
  | 'before_business'
  | 'after_business'
  | 'after_ledger'

/**
 * In-memory transactional model used by local development and tests. A failure
 * restores the ledger/outbox snapshots; callers restore their business map.
 */
export class MemoryGrowthOutboxStore implements GrowthOutboxStore {
  private sequence = 0
  private ledger = new Map<string, GrowthEventLedgerRecord>()
  private outbox = new Map<string, GrowthOutboxRecord>()

  constructor(
    private readonly now: () => Date = () => new Date(),
    private readonly injectFailure?: (point: MemoryGrowthOutboxFailurePoint) => void,
  ) {}

  commit<T>(events: readonly GrowthOutboxAppend[], mutateBusinessState: () => T): T {
    const prepared = events.map((item) => this.prepare(item))
    const snapshot = {
      sequence: this.sequence,
      ledger: new Map(this.ledger),
      outbox: new Map(this.outbox),
    }
    try {
      this.injectFailure?.('before_business')
      const result = mutateBusinessState()
      this.injectFailure?.('after_business')
      for (const item of prepared) this.appendPrepared(item)
      this.injectFailure?.('after_ledger')
      return result
    } catch (error) {
      this.sequence = snapshot.sequence
      this.ledger = snapshot.ledger
      this.outbox = snapshot.outbox
      throw error
    }
  }

  async claimDue(now: Date, leaseMs: number, limit: number): Promise<ClaimedGrowthEvent[]> {
    if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100) throw new Error('Growth outbox claim limit is invalid')
    if (!Number.isSafeInteger(leaseMs) || leaseMs < 1_000 || leaseMs > 15 * 60_000) throw new Error('Growth outbox lease is invalid')
    this.evictExpired(now)
    await this.reclaimStale(now)
    const due = [...this.outbox.values()]
      .filter((record) => (record.state === 'pending' || record.state === 'failed') && Date.parse(record.nextAttemptAt) <= now.getTime())
      .sort((left, right) => Date.parse(left.nextAttemptAt) - Date.parse(right.nextAttemptAt))
      .slice(0, limit)
    return due.flatMap((record) => {
      const ledger = this.ledger.get(record.eventId)
      if (!ledger) return []
      const claimed: GrowthOutboxRecord = {
        ...record,
        state: 'delivering',
        attemptCount: record.attemptCount + 1,
        leaseExpiresAt: new Date(now.getTime() + leaseMs).toISOString(),
        updatedAt: now.toISOString(),
      }
      this.outbox.set(record.eventId, claimed)
      return [{ ledger: structuredClone(ledger), outbox: structuredClone(claimed) }]
    })
  }

  async markDelivered(eventId: string, deliveredAt: Date): Promise<GrowthOutboxRecord | null> {
    this.evictExpired(deliveredAt)
    const existing = this.outbox.get(eventId)
    if (!existing) return null
    if (existing.state === 'delivered' || existing.state === 'dead_letter') return structuredClone(existing)
    if (existing.state !== 'delivering') return structuredClone(existing)
    const delivered: GrowthOutboxRecord = {
      ...existing,
      state: 'delivered',
      deliveredAt: deliveredAt.toISOString(),
      updatedAt: deliveredAt.toISOString(),
      leaseExpiresAt: undefined,
      lastSafeErrorCategory: undefined,
    }
    this.outbox.set(eventId, delivered)
    return structuredClone(delivered)
  }

  async markFailed(
    eventId: string,
    failedAt: Date,
    category: GrowthOutboxSafeErrorCategory,
    terminal = false,
  ): Promise<GrowthOutboxRecord | null> {
    this.evictExpired(failedAt)
    const existing = this.outbox.get(eventId)
    if (!existing) return null
    if (existing.state === 'delivered' || existing.state === 'dead_letter') return structuredClone(existing)
    if (existing.state !== 'delivering') return structuredClone(existing)
    const exhausted = terminal || existing.attemptCount >= GROWTH_OUTBOX_MAX_ATTEMPTS
    const failed: GrowthOutboxRecord = {
      ...existing,
      state: exhausted ? 'dead_letter' : 'failed',
      nextAttemptAt: exhausted
        ? existing.nextAttemptAt
        : new Date(failedAt.getTime() + growthOutboxBackoffMs(existing.attemptCount)).toISOString(),
      updatedAt: failedAt.toISOString(),
      leaseExpiresAt: undefined,
      lastSafeErrorCategory: category,
    }
    this.outbox.set(eventId, failed)
    return structuredClone(failed)
  }

  async reclaimStale(now: Date): Promise<number> {
    this.evictExpired(now)
    let reclaimed = 0
    for (const [eventId, record] of this.outbox) {
      if (record.state !== 'delivering' || !record.leaseExpiresAt || Date.parse(record.leaseExpiresAt) > now.getTime()) continue
      const exhausted = record.attemptCount >= GROWTH_OUTBOX_MAX_ATTEMPTS
      this.outbox.set(eventId, {
        ...record,
        state: exhausted ? 'dead_letter' : 'failed',
        nextAttemptAt: now.toISOString(),
        updatedAt: now.toISOString(),
        leaseExpiresAt: undefined,
        lastSafeErrorCategory: 'timeout',
      })
      reclaimed += 1
    }
    return reclaimed
  }

  async getLedger(eventId: string): Promise<GrowthEventLedgerRecord | null> {
    this.evictExpired(this.now())
    const record = this.ledger.get(eventId)
    return record ? structuredClone(record) : null
  }

  async getOutbox(eventId: string): Promise<GrowthOutboxRecord | null> {
    this.evictExpired(this.now())
    const record = this.outbox.get(eventId)
    return record ? structuredClone(record) : null
  }

  async getMaxSequence(): Promise<number> {
    this.evictExpired(this.now())
    return this.sequence
  }

  async listLedger(afterSequence = 0, limit = 100, maxSequence = Number.MAX_SAFE_INTEGER): Promise<GrowthEventLedgerRecord[]> {
    this.evictExpired(this.now())
    if (!Number.isSafeInteger(afterSequence) || afterSequence < 0) throw new Error('Growth ledger cursor is invalid')
    if (!Number.isSafeInteger(limit) || limit < 1 || limit > 500) throw new Error('Growth ledger limit is invalid')
    if (!Number.isSafeInteger(maxSequence) || maxSequence < afterSequence) throw new Error('Growth ledger snapshot is invalid')
    return [...this.ledger.values()]
      .filter((record) => record.sequence > afterSequence && record.sequence <= maxSequence)
      .sort((left, right) => left.sequence - right.sequence)
      .slice(0, limit)
      .map((record) => structuredClone(record))
  }

  private prepare(item: GrowthOutboxAppend) {
    const event = parseEngisolsGrowthEvent(item.event)
    const serialized = JSON.stringify(event)
    const recordedAt = this.now()
    const retainedUntil = item.retainedUntil
      ? new Date(item.retainedUntil)
      : new Date(recordedAt.getTime() + GROWTH_EVENT_RETENTION_SECONDS * 1_000)
    if (!Number.isFinite(retainedUntil.getTime()) || retainedUntil.getTime() <= recordedAt.getTime()) {
      throw new Error('Growth event retention must end in the future')
    }
    return { event, serialized, payloadDigest: growthEventPayloadDigest(serialized), recordedAt, retainedUntil }
  }

  private appendPrepared(item: ReturnType<MemoryGrowthOutboxStore['prepare']>): void {
    const existing = this.ledger.get(item.event.eventId)
    if (existing) {
      if (existing.payloadDigest !== item.payloadDigest) throw new Error('Growth event ID collision')
      return
    }
    this.sequence += 1
    const ledger: GrowthEventLedgerRecord = {
      sequence: this.sequence,
      event: item.event,
      payloadDigest: item.payloadDigest,
      recordedAt: item.recordedAt.toISOString(),
      retainedUntil: item.retainedUntil.toISOString(),
    }
    const outbox: GrowthOutboxRecord = {
      eventId: item.event.eventId,
      state: 'pending',
      attemptCount: 0,
      nextAttemptAt: item.recordedAt.toISOString(),
      createdAt: item.recordedAt.toISOString(),
      updatedAt: item.recordedAt.toISOString(),
    }
    this.ledger.set(item.event.eventId, ledger)
    this.outbox.set(item.event.eventId, outbox)
  }

  private evictExpired(now: Date): void {
    for (const [eventId, ledger] of this.ledger) {
      if (Date.parse(ledger.retainedUntil) > now.getTime()) continue
      this.ledger.delete(eventId)
      this.outbox.delete(eventId)
    }
  }
}

export class UpstashGrowthOutboxStore implements GrowthOutboxOperations {
  private readonly client: UpstashRestClient

  constructor(url: string, token: string, timeoutMs = 5_000) {
    this.client = new UpstashRestClient(
      url,
      token,
      'Growth outcome persistence is temporarily unavailable.',
      timeoutMs,
    )
  }

  async claimDue(now: Date, leaseMs: number, limit: number): Promise<ClaimedGrowthEvent[]> {
    if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100) throw new Error('Growth outbox claim limit is invalid')
    if (!Number.isSafeInteger(leaseMs) || leaseMs < 1_000 || leaseMs > 15 * 60_000) throw new Error('Growth outbox lease is invalid')
    await this.reclaimStale(now)
    const claimedIds = await this.client.command<string[]>([
      'EVAL',
      "local ids = redis.call('ZRANGEBYSCORE', KEYS[1], '-inf', ARGV[1], 'LIMIT', 0, ARGV[2]); local claimed = {}; for _, id in ipairs(ids) do local key = ARGV[5] .. id; local state = redis.call('HGET', key, 'state'); if state == 'pending' or state == 'failed' then local attempts = redis.call('HINCRBY', key, 'attemptCount', 1); redis.call('HSET', key, 'state', 'delivering', 'leaseExpiresAt', ARGV[3], 'updatedAt', ARGV[4]); redis.call('ZREM', KEYS[1], id); redis.call('ZADD', KEYS[2], ARGV[6], id); table.insert(claimed, id) end end; return claimed",
      '2',
      GROWTH_REDIS_DUE_KEY,
      GROWTH_REDIS_LEASE_KEY,
      String(now.getTime()),
      String(limit),
      new Date(now.getTime() + leaseMs).toISOString(),
      now.toISOString(),
      GROWTH_REDIS_OUTBOX_KEY_PREFIX,
      String(now.getTime() + leaseMs),
    ])
    const results = await Promise.all(claimedIds.map(async (eventId) => {
      const [ledger, outbox] = await Promise.all([this.getLedger(eventId), this.getOutbox(eventId)])
      return ledger && outbox ? { ledger, outbox } : null
    }))
    return results.filter((item): item is ClaimedGrowthEvent => item !== null)
  }

  async markDelivered(eventId: string, deliveredAt: Date): Promise<GrowthOutboxRecord | null> {
    const values = await this.client.command<string[]>([
      'EVAL',
      "local state = redis.call('HGET', KEYS[1], 'state'); if not state then return {} end; if state == 'delivering' then redis.call('HSET', KEYS[1], 'state', 'delivered', 'deliveredAt', ARGV[1], 'updatedAt', ARGV[1]); redis.call('HDEL', KEYS[1], 'leaseExpiresAt', 'lastSafeErrorCategory'); redis.call('ZREM', KEYS[2], ARGV[2]); redis.call('ZREM', KEYS[3], ARGV[2]) end; return redis.call('HGETALL', KEYS[1])",
      '3',
      `${GROWTH_REDIS_OUTBOX_KEY_PREFIX}${eventId}`,
      GROWTH_REDIS_LEASE_KEY,
      GROWTH_REDIS_DUE_KEY,
      deliveredAt.toISOString(),
      eventId,
    ])
    return values.length ? parseOutboxHash(values) : null
  }

  async markFailed(
    eventId: string,
    failedAt: Date,
    category: GrowthOutboxSafeErrorCategory,
    terminal = false,
  ): Promise<GrowthOutboxRecord | null> {
    const values = await this.client.command<string[]>([
      'EVAL',
      "local state = redis.call('HGET', KEYS[1], 'state'); if not state then return {} end; if state ~= 'delivering' then return redis.call('HGETALL', KEYS[1]) end; local attempts = tonumber(redis.call('HGET', KEYS[1], 'attemptCount') or '0'); redis.call('ZREM', KEYS[2], ARGV[2]); redis.call('HDEL', KEYS[1], 'leaseExpiresAt'); if ARGV[8] == '1' or attempts >= tonumber(ARGV[3]) then redis.call('HSET', KEYS[1], 'state', 'dead_letter', 'updatedAt', ARGV[1], 'lastSafeErrorCategory', ARGV[4]) else local delay = math.min(tonumber(ARGV[5]) * (2 ^ math.max(attempts - 1, 0)), tonumber(ARGV[6])); local nextMs = tonumber(ARGV[7]) + delay; local nextIso = ARGV[8 + attempts]; redis.call('HSET', KEYS[1], 'state', 'failed', 'nextAttemptAt', nextIso, 'updatedAt', ARGV[1], 'lastSafeErrorCategory', ARGV[4]); redis.call('ZADD', KEYS[3], nextMs, ARGV[2]) end; return redis.call('HGETALL', KEYS[1])",
      '3',
      `${GROWTH_REDIS_OUTBOX_KEY_PREFIX}${eventId}`,
      GROWTH_REDIS_LEASE_KEY,
      GROWTH_REDIS_DUE_KEY,
      failedAt.toISOString(),
      eventId,
      String(GROWTH_OUTBOX_MAX_ATTEMPTS),
      category,
      '30000',
      String(6 * 60 * 60 * 1_000),
      String(failedAt.getTime()),
      terminal ? '1' : '0',
      ...Array.from({ length: GROWTH_OUTBOX_MAX_ATTEMPTS }, (_, index) =>
        new Date(failedAt.getTime() + growthOutboxBackoffMs(index + 1)).toISOString()),
    ])
    return values.length ? parseOutboxHash(values) : null
  }

  async reclaimStale(now: Date): Promise<number> {
    const result = await this.client.command<number | string>([
      'EVAL',
      "local ids = redis.call('ZRANGEBYSCORE', KEYS[1], '-inf', ARGV[1]); local count = 0; for _, id in ipairs(ids) do local key = ARGV[4] .. id; if redis.call('HGET', key, 'state') == 'delivering' then local attempts = tonumber(redis.call('HGET', key, 'attemptCount') or '0'); redis.call('HDEL', key, 'leaseExpiresAt'); if attempts >= tonumber(ARGV[3]) then redis.call('HSET', key, 'state', 'dead_letter', 'updatedAt', ARGV[2], 'lastSafeErrorCategory', 'timeout') else redis.call('HSET', key, 'state', 'failed', 'nextAttemptAt', ARGV[2], 'updatedAt', ARGV[2], 'lastSafeErrorCategory', 'timeout'); redis.call('ZADD', KEYS[2], ARGV[1], id) end; count = count + 1 end; redis.call('ZREM', KEYS[1], id) end; return count",
      '2',
      GROWTH_REDIS_LEASE_KEY,
      GROWTH_REDIS_DUE_KEY,
      String(now.getTime()),
      now.toISOString(),
      String(GROWTH_OUTBOX_MAX_ATTEMPTS),
      GROWTH_REDIS_OUTBOX_KEY_PREFIX,
    ])
    return Number(result)
  }

  async getLedger(eventId: string): Promise<GrowthEventLedgerRecord | null> {
    const values = await this.client.command<string[]>(['HGETALL', `${GROWTH_REDIS_LEDGER_KEY_PREFIX}${eventId}`])
    if (!values.length) return null
    const hash = hashFields(values)
    return {
      sequence: Number(hash.sequence),
      event: parseEngisolsGrowthEvent(JSON.parse(hash.event ?? 'null')),
      payloadDigest: hash.payloadDigest ?? '',
      recordedAt: hash.recordedAt ?? '',
      retainedUntil: hash.retainedUntil ?? '',
    }
  }

  async getOutbox(eventId: string): Promise<GrowthOutboxRecord | null> {
    const values = await this.client.command<string[]>(['HGETALL', `${GROWTH_REDIS_OUTBOX_KEY_PREFIX}${eventId}`])
    return values.length ? parseOutboxHash(values) : null
  }

  async getMaxSequence(): Promise<number> {
    const values = await this.client.command<string[]>([
      'ZREVRANGE',
      GROWTH_REDIS_LEDGER_INDEX_KEY,
      '0',
      '0',
      'WITHSCORES',
    ])
    return values.length >= 2 ? Number(values[1]) : 0
  }

  async listLedger(afterSequence = 0, limit = 100, maxSequence = Number.MAX_SAFE_INTEGER): Promise<GrowthEventLedgerRecord[]> {
    if (!Number.isSafeInteger(afterSequence) || afterSequence < 0) throw new Error('Growth ledger cursor is invalid')
    if (!Number.isSafeInteger(limit) || limit < 1 || limit > 500) throw new Error('Growth ledger limit is invalid')
    if (!Number.isSafeInteger(maxSequence) || maxSequence < afterSequence) throw new Error('Growth ledger snapshot is invalid')
    const ids = await this.client.command<string[]>([
      'ZRANGEBYSCORE',
      GROWTH_REDIS_LEDGER_INDEX_KEY,
      `(${afterSequence}`,
      String(maxSequence),
      'LIMIT',
      '0',
      String(limit),
    ])
    const records = await Promise.all(ids.map((eventId) => this.getLedger(eventId)))
    return records.filter((record): record is GrowthEventLedgerRecord => record !== null)
  }
}

function hashFields(values: string[]): Record<string, string> {
  const result: Record<string, string> = {}
  for (let index = 0; index + 1 < values.length; index += 2) {
    result[values[index] as string] = values[index + 1] as string
  }
  return result
}

function parseOutboxHash(values: string[]): GrowthOutboxRecord {
  const hash = hashFields(values)
  return {
    eventId: hash.eventId ?? '',
    state: hash.state as GrowthOutboxRecord['state'],
    attemptCount: Number(hash.attemptCount ?? 0),
    nextAttemptAt: hash.nextAttemptAt ?? '',
    createdAt: hash.createdAt ?? '',
    updatedAt: hash.updatedAt ?? '',
    ...(hash.leaseExpiresAt ? { leaseExpiresAt: hash.leaseExpiresAt } : {}),
    ...(hash.deliveredAt ? { deliveredAt: hash.deliveredAt } : {}),
    ...(hash.lastSafeErrorCategory
      ? { lastSafeErrorCategory: hash.lastSafeErrorCategory as GrowthOutboxSafeErrorCategory }
      : {}),
  }
}

export interface PreparedRedisGrowthEvents {
  readonly keys: string[]
  readonly args: string[]
  readonly collisionGuardLua: string
  readonly appendLua: string
}

/**
 * Produces validated Redis keys/arguments and two Lua fragments. The collision
 * guard must run before any business write because Redis does not roll back a
 * script after a runtime error. The append fragment contains only valid Redis
 * commands and follows the business mutation in the same EVAL.
 */
export function prepareRedisGrowthEvents(
  events: readonly GrowthOutboxAppend[],
  now: Date,
  firstKeyIndex: number,
  firstArgIndex: number,
): PreparedRedisGrowthEvents {
  const keys = [GROWTH_REDIS_SEQUENCE_KEY, GROWTH_REDIS_LEDGER_INDEX_KEY, GROWTH_REDIS_DUE_KEY]
  const args: string[] = []
  const guards: string[] = []
  const appends: string[] = []
  events.forEach((item, index) => {
    const event = parseEngisolsGrowthEvent(item.event)
    const serialized = JSON.stringify(event)
    const digest = growthEventPayloadDigest(serialized)
    const retainedUntil = item.retainedUntil
      ? new Date(item.retainedUntil)
      : new Date(now.getTime() + GROWTH_EVENT_RETENTION_SECONDS * 1_000)
    const ttl = Math.ceil((retainedUntil.getTime() - now.getTime()) / 1_000)
    if (!Number.isSafeInteger(ttl) || ttl < 1) throw new Error('Growth event retention must end in the future')
    keys.push(`${GROWTH_REDIS_LEDGER_KEY_PREFIX}${event.eventId}`, `${GROWTH_REDIS_OUTBOX_KEY_PREFIX}${event.eventId}`)
    const eventKey = firstKeyIndex + 3 + index * 2
    const outboxKey = eventKey + 1
    const arg = firstArgIndex + index * 7
    args.push(serialized, digest, event.eventId, now.toISOString(), retainedUntil.toISOString(), String(ttl), String(now.getTime()))
    guards.push(`local existingDigest${index} = redis.call('HGET', KEYS[${eventKey}], 'payloadDigest'); if existingDigest${index} and existingDigest${index} ~= ARGV[${arg + 1}] then return redis.error_reply('growth event id collision') end`)
    appends.push(`if not existingDigest${index} then local seq${index} = redis.call('INCR', KEYS[${firstKeyIndex}]); redis.call('HSET', KEYS[${eventKey}], 'event', ARGV[${arg}], 'payloadDigest', ARGV[${arg + 1}], 'sequence', seq${index}, 'recordedAt', ARGV[${arg + 3}], 'retainedUntil', ARGV[${arg + 4}]); redis.call('EXPIRE', KEYS[${eventKey}], ARGV[${arg + 5}]); redis.call('HSET', KEYS[${outboxKey}], 'eventId', ARGV[${arg + 2}], 'state', 'pending', 'attemptCount', '0', 'nextAttemptAt', ARGV[${arg + 3}], 'createdAt', ARGV[${arg + 3}], 'updatedAt', ARGV[${arg + 3}]); redis.call('EXPIRE', KEYS[${outboxKey}], ARGV[${arg + 5}]); redis.call('ZADD', KEYS[${firstKeyIndex + 1}], seq${index}, ARGV[${arg + 2}]); redis.call('ZADD', KEYS[${firstKeyIndex + 2}], ARGV[${arg + 6}], ARGV[${arg + 2}]) end`)
  })
  return { keys, args, collisionGuardLua: guards.join('; '), appendLua: appends.join('; ') }
}
