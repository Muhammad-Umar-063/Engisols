import { UpstashRestClient } from './upstash-rest-client'

export interface RetainedNotificationRecord {
  id: string
  updatedAt: string
  expiresAt: string
  notification: {
    status: 'pending' | 'sent' | 'failed'
    attemptedAt?: string
  }
}

/**
 * Atomically claims a failed notification or a pending notification whose
 * `updatedAt` lease began at or before `pendingStaleBefore`.
 */
export interface RetainedNotificationClaimStore<T extends RetainedNotificationRecord> {
  claimNotification(
    id: string,
    updatedAt: string,
    pendingStaleBefore: string,
  ): Promise<T | null>
}

export class MemoryRetainedNotificationStore<T extends RetainedNotificationRecord> {
  private readonly records = new Map<string, T>()
  private operationCount = 0

  constructor(private readonly now: () => Date = () => new Date()) {}

  async createOrGet(record: T): Promise<{ lead: T; created: boolean }> {
    this.maintain(record.id)
    const existing = this.records.get(record.id)
    if (existing) return { lead: structuredClone(existing), created: false }
    this.records.set(record.id, structuredClone(record))
    return { lead: structuredClone(record), created: true }
  }

  async claimFailedNotification(id: string, updatedAt: string): Promise<T | null> {
    this.maintain(id)
    const existing = this.records.get(id)
    if (!existing || existing.notification.status !== 'failed') return null
    const claimed = {
      ...existing,
      updatedAt,
      notification: { status: 'pending' as const },
    }
    this.records.set(id, structuredClone(claimed))
    return structuredClone(claimed)
  }

  async claimNotification(
    id: string,
    updatedAt: string,
    pendingStaleBefore: string,
  ): Promise<T | null> {
    this.maintain(id)
    const existing = this.records.get(id)
    if (!existing || !isNotificationClaimable(existing, pendingStaleBefore)) return null
    const claimed = {
      ...existing,
      updatedAt,
      notification: { status: 'pending' as const },
    }
    this.records.set(id, structuredClone(claimed))
    return structuredClone(claimed)
  }

  async save(record: T): Promise<void> {
    this.maintain(record.id)
    const existing = this.records.get(record.id)
    if (existing?.notification.status === 'sent' && record.notification.status !== 'sent') return
    this.records.set(record.id, structuredClone(record))
  }

  async get(id: string): Promise<T | null> {
    this.maintain(id)
    const record = this.records.get(id)
    return record ? structuredClone(record) : null
  }

  private maintain(accessedId: string): void {
    const current = this.now().getTime()
    const accessed = this.records.get(accessedId)
    if (accessed && new Date(accessed.expiresAt).getTime() <= current) {
      this.records.delete(accessedId)
    }
    this.operationCount += 1
    if (this.operationCount % 128 !== 0) return
    for (const [id, record] of this.records) {
      if (new Date(record.expiresAt).getTime() <= current) this.records.delete(id)
    }
  }
}

export class UpstashRetainedNotificationStore<T extends RetainedNotificationRecord> {
  private readonly client: UpstashRestClient

  constructor(
    url: string,
    token: string,
    unavailableMessage: string,
    private readonly keyPrefix: string,
    private readonly maximumTtlSeconds: number,
    private readonly now: () => Date,
    timeoutMs: number,
  ) {
    this.client = new UpstashRestClient(url, token, unavailableMessage, timeoutMs)
  }

  async createOrGet(record: T): Promise<{ lead: T; created: boolean }> {
    const serialized = JSON.stringify(record)
    const result = await this.client.command<[number | string, string]>([
      'EVAL',
      "local existing = redis.call('HGET', KEYS[1], 'record'); if existing then return {0, existing} end; redis.call('HSET', KEYS[1], 'record', ARGV[1]); redis.call('EXPIRE', KEYS[1], ARGV[2]); return {1, ARGV[1]}",
      '1',
      this.key(record.id),
      serialized,
      String(this.remainingTtlSeconds(record.expiresAt)),
    ])
    return {
      lead: JSON.parse(result[1]) as T,
      created: Number(result[0]) === 1,
    }
  }

  async claimFailedNotification(id: string, updatedAt: string): Promise<T | null> {
    const result = await this.client.command<string | null>([
      'EVAL',
      "local existing = redis.call('HGET', KEYS[1], 'record'); if not existing then return nil end; local lead = cjson.decode(existing); if not lead.notification or lead.notification.status ~= 'failed' then return nil end; lead.updatedAt = ARGV[1]; lead.notification = {status = 'pending'}; local claimed = cjson.encode(lead); redis.call('HSET', KEYS[1], 'record', claimed); return claimed",
      '1',
      this.key(id),
      updatedAt,
    ])
    return result ? JSON.parse(result) as T : null
  }

  async claimNotification(
    id: string,
    updatedAt: string,
    pendingStaleBefore: string,
  ): Promise<T | null> {
    const result = await this.client.command<string | null>([
      'EVAL',
      "local existing = redis.call('HGET', KEYS[1], 'record'); if not existing then return nil end; local lead = cjson.decode(existing); if not lead.notification then return nil end; local status = lead.notification.status; local claimable = status == 'failed'; if status == 'pending' and type(lead.updatedAt) == 'string' and lead.updatedAt <= ARGV[2] then claimable = true end; if not claimable then return nil end; lead.updatedAt = ARGV[1]; lead.notification = {status = 'pending'}; local claimed = cjson.encode(lead); redis.call('HSET', KEYS[1], 'record', claimed); return claimed",
      '1',
      this.key(id),
      updatedAt,
      pendingStaleBefore,
    ])
    return result ? JSON.parse(result) as T : null
  }

  async save(record: T): Promise<void> {
    await this.client.command<string>([
      'EVAL',
      "local existing = redis.call('HGET', KEYS[1], 'record'); if existing then local stored = cjson.decode(existing); local incoming = cjson.decode(ARGV[1]); if stored.notification and stored.notification.status == 'sent' and incoming.notification and incoming.notification.status ~= 'sent' then return existing end end; redis.call('HSET', KEYS[1], 'record', ARGV[1]); redis.call('EXPIRE', KEYS[1], ARGV[2]); return ARGV[1]",
      '1',
      this.key(record.id),
      JSON.stringify(record),
      String(this.remainingTtlSeconds(record.expiresAt)),
    ])
  }

  async get(id: string): Promise<T | null> {
    const value = await this.client.command<string | null>(['HGET', this.key(id), 'record'])
    if (!value) return null
    const record = JSON.parse(value) as T
    return new Date(record.expiresAt).getTime() > this.now().getTime() ? record : null
  }

  private key(id: string): string {
    return `${this.keyPrefix}${id}`
  }

  private remainingTtlSeconds(expiresAt: string): number {
    const seconds = Math.ceil((new Date(expiresAt).getTime() - this.now().getTime()) / 1_000)
    if (!Number.isFinite(seconds) || seconds <= 0) throw new Error('Cannot persist an expired record.')
    return Math.min(seconds, this.maximumTtlSeconds)
  }
}

function isNotificationClaimable(
  record: RetainedNotificationRecord,
  pendingStaleBefore: string,
): boolean {
  if (record.notification.status === 'failed') return true
  if (record.notification.status !== 'pending') return false
  const leaseStartedAt = Date.parse(record.updatedAt)
  const staleBefore = Date.parse(pendingStaleBefore)
  return Number.isFinite(leaseStartedAt)
    && Number.isFinite(staleBefore)
    && leaseStartedAt <= staleBefore
}
