import type { ProductionCheckScanMetaTracking } from '../meta/types'
import type {
  PersistedScan,
  PersistedScanStatus,
  LeadStore,
  ProductionCheckAttribution,
  ProductionCheckLead,
  ScanAnswers,
  ScanProgressSnapshot,
  ScanStore,
} from './types'
import {
  LEAD_RECORD_TTL_SECONDS,
  SCAN_RECORD_TTL_SECONDS,
  SCAN_STORE_TIMEOUT_MS,
} from './config'

const KEY_PREFIX = 'engisols:production-check:'
const LEAD_KEY_PREFIX = 'engisols:production-check:lead:'

export class ScanStoreConfigurationError extends Error {}

export class MemoryScanStore implements ScanStore {
  private readonly scans = new Map<string, PersistedScan>()

  constructor(private readonly now: () => Date = () => new Date()) {}

  async create(scan: PersistedScan): Promise<void> {
    this.scans.set(scan.publicId, structuredClone(scan))
  }

  async get(publicId: string): Promise<PersistedScan | null> {
    const scan = this.scans.get(publicId)
    if (!scan) return null
    if (new Date(scan.expiresAt).getTime() <= this.now().getTime()) {
      this.scans.delete(publicId)
      return null
    }
    return structuredClone(scan)
  }

  async updateProgress(publicId: string, progress: ScanProgressSnapshot): Promise<void> {
    this.update(publicId, (scan) => ({ ...scan, progress: structuredClone(progress) }))
  }

  async updateStatus(publicId: string, status: PersistedScanStatus): Promise<void> {
    this.update(publicId, (scan) => ({ ...scan, status }))
  }

  async updateAnswers(publicId: string, answers: ScanAnswers): Promise<boolean> {
    return this.update(publicId, (scan) => ({
      ...scan,
      answers: { ...scan.answers, ...answers },
    }))
  }

  async updateMetaTracking(
    publicId: string,
    metaTracking: ProductionCheckScanMetaTracking,
  ): Promise<boolean> {
    return this.update(publicId, (scan) => ({
      ...scan,
      metaTracking: structuredClone(metaTracking),
    }))
  }

  async complete(publicId: string, result: PersistedScan['result']): Promise<void> {
    if (!result) return
    this.update(publicId, (scan) => ({
      ...scan,
      status: result.status,
      result: structuredClone(result),
      error: undefined,
    }))
  }

  async fail(publicId: string, error: NonNullable<PersistedScan['error']>): Promise<void> {
    this.update(publicId, (scan) => ({ ...scan, status: 'failed', error }))
  }

  private update(publicId: string, mutate: (scan: PersistedScan) => PersistedScan): boolean {
    const scan = this.scans.get(publicId)
    if (!scan) return false
    if (new Date(scan.expiresAt).getTime() <= this.now().getTime()) {
      this.scans.delete(publicId)
      return false
    }
    this.scans.set(publicId, mutate(scan))
    return true
  }
}

export class MemoryLeadStore implements LeadStore {
  private readonly leads = new Map<string, ProductionCheckLead>()

  constructor(private readonly now: () => Date = () => new Date()) {}

  async createOrGet(lead: ProductionCheckLead): Promise<{
    lead: ProductionCheckLead
    created: boolean
  }> {
    this.evictExpired()
    const existing = this.leads.get(lead.id)
    if (existing) return { lead: structuredClone(existing), created: false }
    this.leads.set(lead.id, structuredClone(lead))
    return { lead: structuredClone(lead), created: true }
  }

  async claimFailedNotification(
    id: string,
    updatedAt: string,
  ): Promise<ProductionCheckLead | null> {
    this.evictExpired()
    const existing = this.leads.get(id)
    if (!existing || existing.notification.status !== 'failed') return null
    const claimed: ProductionCheckLead = {
      ...existing,
      updatedAt,
      notification: { status: 'pending' },
    }
    this.leads.set(id, structuredClone(claimed))
    return structuredClone(claimed)
  }

  async save(lead: ProductionCheckLead): Promise<void> {
    this.evictExpired()
    const existing = this.leads.get(lead.id)
    if (existing?.notification.status === 'sent' && lead.notification.status !== 'sent') return
    this.leads.set(lead.id, structuredClone(lead))
  }

  async get(id: string): Promise<ProductionCheckLead | null> {
    const lead = this.leads.get(id)
    if (!lead) return null
    if (new Date(lead.expiresAt).getTime() <= this.now().getTime()) {
      this.leads.delete(id)
      return null
    }
    return structuredClone(lead)
  }

  private evictExpired(): void {
    const now = this.now().getTime()
    for (const [id, existing] of this.leads) {
      if (new Date(existing.expiresAt).getTime() <= now) this.leads.delete(id)
    }
  }
}

class UpstashRestClient {
  constructor(
    private readonly url: string,
    private readonly token: string,
    private readonly unavailableMessage: string,
  ) {}

  async command<T = unknown>(command: string[]): Promise<T> {
    try {
      const response = await fetch(this.url, {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify(command),
        cache: 'no-store',
        signal: AbortSignal.timeout(SCAN_STORE_TIMEOUT_MS),
      })
      if (!response.ok) throw new Error('persistence request failed')
      const body = (await response.json()) as { result?: T; error?: string }
      if (body.error) throw new Error('persistence command failed')
      return body.result as T
    } catch {
      throw new Error(this.unavailableMessage)
    }
  }

  private headers(): HeadersInit {
    return {
      Authorization: `Bearer ${this.token}`,
      'Content-Type': 'application/json',
    }
  }
}

export class UpstashScanStore implements ScanStore {
  private readonly client: UpstashRestClient

  constructor(
    url: string,
    token: string,
    private readonly now: () => Date = () => new Date(),
  ) {
    this.client = new UpstashRestClient(
      url,
      token,
      'Scan persistence is temporarily unavailable.',
    )
  }

  async create(scan: PersistedScan): Promise<void> {
    const fields = this.fieldArgs({
      publicId: scan.publicId,
      status: scan.status,
      requestedUrl: scan.requestedUrl,
      progress: scan.progress,
      ...(scan.answers.builder ? { builder: scan.answers.builder } : {}),
      ...(scan.answers.launchStage ? { launchStage: scan.answers.launchStage } : {}),
      attribution: scan.attribution,
      ...(scan.metaTracking ? { metaTracking: scan.metaTracking } : {}),
      createdAt: scan.createdAt,
      expiresAt: scan.expiresAt,
    })
    await this.client.command<number>([
      'EVAL',
      "for i = 1, #ARGV - 1, 2 do redis.call('HSET', KEYS[1], ARGV[i], ARGV[i + 1]) end; redis.call('EXPIRE', KEYS[1], ARGV[#ARGV]); return 1",
      '1',
      this.key(scan.publicId),
      ...fields,
      String(this.remainingTtlSeconds(scan.expiresAt)),
    ])
  }

  async get(publicId: string): Promise<PersistedScan | null> {
    const values = await this.client.command<Array<string>>(['HGETALL', this.key(publicId)])
    if (!values || values.length === 0) return null
    const fields = Object.fromEntries(
      Array.from({ length: Math.floor(values.length / 2) }, (_, index) => [
        values[index * 2] as string,
        values[index * 2 + 1] as string,
      ]),
    )
    const scan: PersistedScan = {
      publicId: fields.publicId,
      status: fields.status as PersistedScanStatus,
      requestedUrl: fields.requestedUrl,
      progress: JSON.parse(fields.progress) as ScanProgressSnapshot,
      answers: {
        ...(fields.builder ? { builder: fields.builder as ScanAnswers['builder'] } : {}),
        ...(fields.launchStage ? { launchStage: fields.launchStage as ScanAnswers['launchStage'] } : {}),
      },
      attribution: fields.attribution
        ? JSON.parse(fields.attribution) as ProductionCheckAttribution
        : {},
      ...(fields.metaTracking
        ? {
            metaTracking: JSON.parse(fields.metaTracking) as ProductionCheckScanMetaTracking,
          }
        : {}),
      ...(fields.result ? { result: JSON.parse(fields.result) as PersistedScan['result'] } : {}),
      ...(fields.error ? { error: JSON.parse(fields.error) as PersistedScan['error'] } : {}),
      createdAt: fields.createdAt,
      expiresAt: fields.expiresAt,
    }
    return new Date(scan.expiresAt).getTime() > this.now().getTime() ? scan : null
  }

  async updateProgress(publicId: string, progress: ScanProgressSnapshot): Promise<void> {
    await this.hset(publicId, { progress })
  }

  async updateStatus(publicId: string, status: PersistedScanStatus): Promise<void> {
    await this.hset(publicId, { status })
  }

  async updateAnswers(publicId: string, answers: ScanAnswers): Promise<boolean> {
    const fields = {
      ...(answers.builder ? { builder: answers.builder } : {}),
      ...(answers.launchStage ? { launchStage: answers.launchStage } : {}),
    }
    const fieldArgs = this.fieldArgs(fields)
    const result = await this.client.command<number | string>([
      'EVAL',
      "if redis.call('EXISTS', KEYS[1]) == 0 then return 0 end; for i = 1, #ARGV, 2 do redis.call('HSET', KEYS[1], ARGV[i], ARGV[i + 1]) end; return 1",
      '1',
      this.key(publicId),
      ...fieldArgs,
    ])
    return Number(result) === 1
  }

  async updateMetaTracking(
    publicId: string,
    metaTracking: ProductionCheckScanMetaTracking,
  ): Promise<boolean> {
    return this.hsetExisting(publicId, { metaTracking })
  }

  async complete(publicId: string, result: NonNullable<PersistedScan['result']>): Promise<void> {
    await this.hset(publicId, { status: result.status, result })
  }

  async fail(publicId: string, error: NonNullable<PersistedScan['error']>): Promise<void> {
    await this.hset(publicId, { status: 'failed', error })
  }

  private async hset(publicId: string, fields: Record<string, unknown>): Promise<void> {
    await this.hsetExisting(publicId, fields)
  }

  private async hsetExisting(
    publicId: string,
    fields: Record<string, unknown>,
  ): Promise<boolean> {
    const result = await this.client.command<number | string>([
      'EVAL',
      "if redis.call('EXISTS', KEYS[1]) == 0 then return 0 end; for i = 1, #ARGV, 2 do redis.call('HSET', KEYS[1], ARGV[i], ARGV[i + 1]) end; return 1",
      '1',
      this.key(publicId),
      ...this.fieldArgs(fields),
    ])
    return Number(result) === 1
  }

  private key(publicId: string): string {
    return `${KEY_PREFIX}${publicId}`
  }

  private fieldArgs(fields: Record<string, unknown>): string[] {
    return Object.entries(fields).flatMap(([name, value]) => [
      name,
      typeof value === 'string' ? value : JSON.stringify(value),
    ])
  }

  private remainingTtlSeconds(expiresAt: string): number {
    const seconds = Math.ceil((new Date(expiresAt).getTime() - this.now().getTime()) / 1_000)
    if (!Number.isFinite(seconds) || seconds <= 0) {
      throw new Error('Cannot persist an expired scan.')
    }
    return Math.min(seconds, SCAN_RECORD_TTL_SECONDS)
  }
}

export class UpstashLeadStore implements LeadStore {
  private readonly client: UpstashRestClient

  constructor(
    url: string,
    token: string,
    private readonly now: () => Date = () => new Date(),
  ) {
    this.client = new UpstashRestClient(
      url,
      token,
      'Lead persistence is temporarily unavailable.',
    )
  }

  async createOrGet(lead: ProductionCheckLead): Promise<{
    lead: ProductionCheckLead
    created: boolean
  }> {
    const record = JSON.stringify(lead)
    const result = await this.client.command<[number | string, string]>([
      'EVAL',
      "local existing = redis.call('HGET', KEYS[1], 'record'); if existing then return {0, existing} end; redis.call('HSET', KEYS[1], 'record', ARGV[1]); redis.call('EXPIRE', KEYS[1], ARGV[2]); return {1, ARGV[1]}",
      '1',
      this.key(lead.id),
      record,
      String(this.remainingTtlSeconds(lead.expiresAt)),
    ])
    return {
      lead: JSON.parse(result[1]) as ProductionCheckLead,
      created: Number(result[0]) === 1,
    }
  }

  async claimFailedNotification(
    id: string,
    updatedAt: string,
  ): Promise<ProductionCheckLead | null> {
    const result = await this.client.command<string | null>([
      'EVAL',
      "local existing = redis.call('HGET', KEYS[1], 'record'); if not existing then return nil end; local lead = cjson.decode(existing); if not lead.notification or lead.notification.status ~= 'failed' then return nil end; lead.updatedAt = ARGV[1]; lead.notification = {status = 'pending'}; local claimed = cjson.encode(lead); redis.call('HSET', KEYS[1], 'record', claimed); return claimed",
      '1',
      this.key(id),
      updatedAt,
    ])
    return result ? JSON.parse(result) as ProductionCheckLead : null
  }

  async save(lead: ProductionCheckLead): Promise<void> {
    await this.client.command<string>([
      'EVAL',
      "local existing = redis.call('HGET', KEYS[1], 'record'); if existing then local stored = cjson.decode(existing); local incoming = cjson.decode(ARGV[1]); if stored.notification and stored.notification.status == 'sent' and incoming.notification and incoming.notification.status ~= 'sent' then return existing end end; redis.call('HSET', KEYS[1], 'record', ARGV[1]); redis.call('EXPIRE', KEYS[1], ARGV[2]); return ARGV[1]",
      '1',
      this.key(lead.id),
      JSON.stringify(lead),
      String(this.remainingTtlSeconds(lead.expiresAt)),
    ])
  }

  async get(id: string): Promise<ProductionCheckLead | null> {
    const value = await this.client.command<string | null>([
      'HGET',
      this.key(id),
      'record',
    ])
    if (!value) return null
    const lead = JSON.parse(value) as ProductionCheckLead
    return new Date(lead.expiresAt).getTime() > this.now().getTime() ? lead : null
  }

  private key(id: string): string {
    return `${LEAD_KEY_PREFIX}${id}`
  }

  private remainingTtlSeconds(expiresAt: string): number {
    const seconds = Math.ceil((new Date(expiresAt).getTime() - this.now().getTime()) / 1_000)
    if (!Number.isFinite(seconds) || seconds <= 0) {
      throw new Error('Cannot persist an expired lead.')
    }
    return Math.min(seconds, LEAD_RECORD_TTL_SECONDS)
  }
}

declare global {
  // Next.js may evaluate route modules in separate bundles during development.
  // Keeping the fallback on globalThis makes those bundles share one store.
  var __engisolsProductionCheckStore: MemoryScanStore | undefined
  var __engisolsProductionCheckLeadStore: MemoryLeadStore | undefined
}

const memoryStore =
  globalThis.__engisolsProductionCheckStore ?? new MemoryScanStore()
globalThis.__engisolsProductionCheckStore = memoryStore
const memoryLeadStore =
  globalThis.__engisolsProductionCheckLeadStore ?? new MemoryLeadStore()
globalThis.__engisolsProductionCheckLeadStore = memoryLeadStore
let configuredStore: ScanStore | undefined
let configuredLeadStore: LeadStore | undefined

export function getScanStore(): ScanStore {
  if (configuredStore) return configuredStore
  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN
  if (url && token) {
    configuredStore = new UpstashScanStore(url, token)
    return configuredStore
  }
  if (process.env.NODE_ENV === 'production') {
    throw new ScanStoreConfigurationError(
      'Production scan persistence requires Upstash Redis REST configuration.',
    )
  }
  return memoryStore
}

export function getLeadStore(): LeadStore {
  if (configuredLeadStore) return configuredLeadStore
  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN
  if (url && token) {
    configuredLeadStore = new UpstashLeadStore(url, token)
    return configuredLeadStore
  }
  if (process.env.NODE_ENV === 'production') {
    throw new ScanStoreConfigurationError(
      'Production lead persistence requires Upstash Redis REST configuration.',
    )
  }
  return memoryLeadStore
}

export function setScanStoreForTests(store: ScanStore | undefined): void {
  configuredStore = store
}

export function setLeadStoreForTests(store: LeadStore | undefined): void {
  configuredLeadStore = store
}
