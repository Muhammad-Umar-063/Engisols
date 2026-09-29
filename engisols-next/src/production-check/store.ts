import type { ProductionCheckScanMetaTracking } from '../meta/types'
import { createGrowthOutcomeEventFactory, type GrowthOutcomeEventFactory } from '../growth/outcome-events'
import {
  GROWTH_REDIS_OFFER_EXPIRY_KEY,
  MemoryGrowthOutboxStore,
  UpstashGrowthOutboxStore,
  prepareRedisGrowthEvents,
} from '../growth/outbox-store'
import type { GrowthOutboxAppend, GrowthOutboxOperations } from '../growth/outbox-types'
import {
  UpstashRetainedNotificationStore,
} from '../persistence/retained-notification-store'
import { UpstashRestClient } from '../persistence/upstash-rest-client'
import type {
  PersistedScan,
  PersistedScanStatus,
  LeadStore,
  ProductionCheckAttribution,
  ProductionCheckLead,
  ProductionScopeOffer,
  ProductionScopeReview,
  ScanAnswers,
  ScanProgressSnapshot,
  ScanStore,
  ScopeOfferStore,
  ScopeReviewStore,
} from './types'
import {
  LEAD_RECORD_TTL_SECONDS,
  SCAN_RECORD_TTL_SECONDS,
  SCAN_STORE_TIMEOUT_MS,
  SCOPE_OFFER_RETENTION_SECONDS,
  SCOPE_REVIEW_RECORD_TTL_SECONDS,
} from './config'

const KEY_PREFIX = 'engisols:production-check:'
const LEAD_KEY_PREFIX = 'engisols:production-check:lead:'
const SCOPE_REVIEW_KEY_PREFIX = 'engisols:production-check:scope-review:'
const SCOPE_OFFER_KEY_PREFIX = 'engisols:production-check:scope-offer:'
const SCOPE_OFFER_REVIEW_KEY_PREFIX = 'engisols:production-check:scope-offer-review:'

export interface MemoryGrowthStoreOptions {
  readonly outbox: MemoryGrowthOutboxStore
  readonly events: GrowthOutcomeEventFactory
}

interface RedisGrowthStoreOptions {
  readonly events: GrowthOutcomeEventFactory
}

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
  private readonly records = new Map<string, ProductionCheckLead>()
  private operationCount = 0

  constructor(
    protected readonly now: () => Date = () => new Date(),
    private readonly growth?: MemoryGrowthStoreOptions,
  ) {}

  async createOrGet(lead: ProductionCheckLead) {
    this.maintain(lead.id)
    const existing = this.records.get(lead.id)
    if (existing) return { lead: structuredClone(existing), created: false }
    const previous = this.records.get(lead.id)
    try {
      this.commitGrowth([
        { event: this.growth?.events.leadCreated(lead), retainedUntil: lead.expiresAt },
        { event: this.growth?.events.leadSegmented(lead), retainedUntil: lead.expiresAt },
      ], () => this.records.set(lead.id, structuredClone(lead)))
    } catch (error) {
      if (previous) this.records.set(lead.id, previous)
      else this.records.delete(lead.id)
      throw error
    }
    return { lead: structuredClone(lead), created: true }
  }

  async claimFailedNotification(id: string, updatedAt: string): Promise<ProductionCheckLead | null> {
    this.maintain(id)
    const existing = this.records.get(id)
    if (!existing || existing.notification.status !== 'failed') return null
    const claimed = { ...existing, updatedAt, notification: { status: 'pending' as const } }
    this.records.set(id, structuredClone(claimed))
    return structuredClone(claimed)
  }

  async save(lead: ProductionCheckLead): Promise<void> {
    this.maintain(lead.id)
    const existing = this.records.get(lead.id)
    if (existing?.notification.status === 'sent' && lead.notification.status !== 'sent') return
    this.records.set(lead.id, structuredClone(lead))
  }

  async get(id: string): Promise<ProductionCheckLead | null> {
    this.maintain(id)
    const record = this.records.get(id)
    return record ? structuredClone(record) : null
  }

  private commitGrowth(events: Array<{ event: ReturnType<GrowthOutcomeEventFactory['leadCreated']> | undefined; retainedUntil: string }>, mutate: () => void): void {
    const prepared: GrowthOutboxAppend[] = events.flatMap((item) => item.event
      ? [{ event: item.event, retainedUntil: item.retainedUntil }]
      : [])
    if (this.growth) this.growth.outbox.commit(prepared, mutate)
    else mutate()
  }

  private maintain(accessedId: string): void {
    const current = this.now().getTime()
    const accessed = this.records.get(accessedId)
    if (accessed && new Date(accessed.expiresAt).getTime() <= current) this.records.delete(accessedId)
    this.operationCount += 1
    if (this.operationCount % 128 !== 0) return
    for (const [id, record] of this.records) {
      if (new Date(record.expiresAt).getTime() <= current) this.records.delete(id)
    }
  }
}

export class MemoryScopeReviewStore implements ScopeReviewStore {
  private readonly reviews = new Map<string, ProductionScopeReview>()

  constructor(
    private readonly now: () => Date = () => new Date(),
    private readonly growth?: MemoryGrowthStoreOptions,
  ) {}

  async createOrGet(review: ProductionScopeReview) {
    this.evictExpired()
    const existing = this.reviews.get(review.id)
    if (existing) return { review: structuredClone(existing), created: false }
    const previous = this.reviews.get(review.id)
    try {
      const mutate = () => this.reviews.set(review.id, structuredClone(review))
      if (this.growth) {
        this.growth.outbox.commit([
          { event: this.growth.events.scopeReviewRequested(review), retainedUntil: review.expiresAt },
        ], mutate)
      } else mutate()
    } catch (error) {
      if (previous) this.reviews.set(review.id, previous)
      else this.reviews.delete(review.id)
      throw error
    }
    return { review: structuredClone(review), created: true }
  }

  async save(review: ProductionScopeReview): Promise<void> {
    this.evictExpired()
    const existing = this.reviews.get(review.id)
    const isNewDecision = Boolean(
      review.decision
      && review.status !== 'pending_review'
      && (!existing?.decision || existing.decision !== review.decision || existing.status !== review.status),
    )
    const revision = isNewDecision ? (existing?.growthEventRevisions?.decisionRecorded ?? 0) + 1 : undefined
    const persisted = revision
      ? { ...review, growthEventRevisions: { ...review.growthEventRevisions, decisionRecorded: revision } }
      : existing?.growthEventRevisions
        ? { ...review, growthEventRevisions: structuredClone(existing.growthEventRevisions) }
        : review
    try {
      const mutate = () => this.reviews.set(review.id, structuredClone(persisted))
      if (this.growth && revision) {
        this.growth.outbox.commit([
          { event: this.growth.events.scopeReviewDecision(persisted, revision), retainedUntil: persisted.expiresAt },
        ], mutate)
      } else mutate()
    } catch (error) {
      if (existing) this.reviews.set(review.id, existing)
      else this.reviews.delete(review.id)
      throw error
    }
  }

  async get(id: string): Promise<ProductionScopeReview | null> {
    this.evictExpired()
    const review = this.reviews.get(id)
    return review ? structuredClone(review) : null
  }

  private evictExpired(): void {
    const current = this.now().getTime()
    for (const [id, review] of this.reviews) {
      if (new Date(review.expiresAt).getTime() <= current) this.reviews.delete(id)
    }
  }
}

export class MemoryScopeOfferStore implements ScopeOfferStore {
  private readonly offers = new Map<string, ProductionScopeOffer>()
  private readonly offerIdsByReview = new Map<string, string>()

  constructor(
    private readonly now: () => Date = () => new Date(),
    private readonly growth?: MemoryGrowthStoreOptions,
  ) {}

  async claimForReview(offer: ProductionScopeOffer) {
    this.evictExpired()
    const claimedId = this.offerIdsByReview.get(offer.scopeReviewId)
    const claimed = claimedId ? this.offers.get(claimedId) : undefined
    if (claimed) return { offer: structuredClone(claimed), created: false }
    const existing = this.offers.get(offer.id)
    if (existing) {
      this.offerIdsByReview.set(existing.scopeReviewId, existing.id)
      return { offer: structuredClone(existing), created: false }
    }
    const previousOffer = this.offers.get(offer.id)
    const previousClaim = this.offerIdsByReview.get(offer.scopeReviewId)
    try {
      const mutate = () => {
        this.offers.set(offer.id, structuredClone(offer))
        this.offerIdsByReview.set(offer.scopeReviewId, offer.id)
      }
      if (this.growth) {
        this.growth.outbox.commit([
          { event: this.growth.events.offerCreated(offer), retainedUntil: offer.retainedUntil },
        ], mutate)
      } else mutate()
    } catch (error) {
      if (previousOffer) this.offers.set(offer.id, previousOffer)
      else this.offers.delete(offer.id)
      if (previousClaim) this.offerIdsByReview.set(offer.scopeReviewId, previousClaim)
      else this.offerIdsByReview.delete(offer.scopeReviewId)
      throw error
    }
    return { offer: structuredClone(offer), created: true }
  }

  async markSent(id: string, sentAt: string): Promise<ProductionScopeOffer | null> {
    this.evictExpired()
    const existing = this.offers.get(id)
    if (!existing) return null
    if (existing.status !== 'draft') return structuredClone(existing)
    const sent: ProductionScopeOffer = {
      ...existing,
      status: 'sent',
      sentAt,
      notification: { status: 'sent', attemptedAt: sentAt },
    }
    this.commitOfferTransition(existing, sent, this.growth?.events.offerSent(sent))
    return structuredClone(sent)
  }

  async markSendFailed(id: string, attemptedAt: string): Promise<ProductionScopeOffer | null> {
    this.evictExpired()
    const existing = this.offers.get(id)
    if (!existing) return null
    if (existing.status !== 'draft') return structuredClone(existing)
    const failed: ProductionScopeOffer = {
      ...existing,
      notification: { status: 'failed', attemptedAt },
    }
    this.offers.set(id, structuredClone(failed))
    return structuredClone(failed)
  }

  async get(id: string): Promise<ProductionScopeOffer | null> {
    this.evictExpired()
    const offer = this.offers.get(id)
    return offer ? structuredClone(offer) : null
  }

  async transitionDecision(
    id: string,
    decision: 'accepted' | 'declined',
    decidedAt: string,
  ): Promise<ProductionScopeOffer | null> {
    this.evictExpired()
    const existing = this.offers.get(id)
    if (!existing) return null
    if (existing.status === 'accepted' || existing.status === 'declined' || existing.status === 'expired') {
      return structuredClone(existing)
    }
    if (new Date(existing.expiresAt).getTime() <= new Date(decidedAt).getTime()) {
      const expired = { ...existing, status: 'expired' as const }
      this.commitOfferTransition(existing, expired, this.growth?.events.offerExpired(expired, decidedAt))
      return structuredClone(expired)
    }
    if (existing.status !== 'sent') return structuredClone(existing)
    const updated: ProductionScopeOffer = {
      ...existing,
      status: decision,
      ...(decision === 'accepted' ? { acceptedAt: decidedAt } : { declinedAt: decidedAt }),
      decisionReviewSync: { status: 'pending' },
      decisionNotification: { status: 'pending' },
    }
    this.commitOfferTransition(existing, updated, this.growth?.events.offerDecision(updated))
    return structuredClone(updated)
  }

  async recordDecisionReconciliation(
    id: string,
    update: {
      reviewSync?: 'synced' | 'failed'
      notification?: 'sent' | 'failed'
    },
    attemptedAt: string,
  ): Promise<ProductionScopeOffer | null> {
    this.evictExpired()
    const existing = this.offers.get(id)
    if (!existing || (existing.status !== 'accepted' && existing.status !== 'declined')) return existing ? structuredClone(existing) : null
    const reviewSync = update.reviewSync && existing.decisionReviewSync?.status !== 'synced'
      ? { status: update.reviewSync, attemptedAt } as const
      : existing.decisionReviewSync
    const notification = update.notification && existing.decisionNotification?.status !== 'sent'
      ? { status: update.notification, attemptedAt } as const
      : existing.decisionNotification
    const reconciled: ProductionScopeOffer = {
      ...existing,
      ...(reviewSync ? { decisionReviewSync: reviewSync } : {}),
      ...(notification ? { decisionNotification: notification } : {}),
    }
    this.offers.set(id, structuredClone(reconciled))
    return structuredClone(reconciled)
  }

  async materializeExpired(now: Date, limit: number): Promise<number> {
    if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100) throw new Error('Offer expiry limit is invalid')
    const dueIds = [...this.offers.values()]
      .filter((offer) => !['accepted', 'declined', 'expired'].includes(offer.status))
      .filter((offer) => Date.parse(offer.expiresAt) <= now.getTime())
      .sort((left, right) => Date.parse(left.expiresAt) - Date.parse(right.expiresAt))
      .slice(0, limit)
      .map((offer) => offer.id)
    let materialized = 0
    for (const id of dueIds) {
      const result = await this.transitionDecision(id, 'declined', now.toISOString())
      if (result?.status === 'expired') materialized += 1
    }
    return materialized
  }

  private evictExpired(): void {
    const current = this.now().getTime()
    for (const [id, offer] of this.offers) {
      if (new Date(offer.retainedUntil).getTime() <= current) {
        this.offers.delete(id)
        if (this.offerIdsByReview.get(offer.scopeReviewId) === id) {
          this.offerIdsByReview.delete(offer.scopeReviewId)
        }
      }
    }
  }

  private commitOfferTransition(
    existing: ProductionScopeOffer,
    updated: ProductionScopeOffer,
    event: ReturnType<GrowthOutcomeEventFactory['offerSent']> | undefined,
  ): void {
    try {
      const mutate = () => this.offers.set(updated.id, structuredClone(updated))
      if (this.growth && event) {
        this.growth.outbox.commit([{ event, retainedUntil: updated.retainedUntil }], mutate)
      } else mutate()
    } catch (error) {
      this.offers.set(existing.id, existing)
      throw error
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
      SCAN_STORE_TIMEOUT_MS,
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

export class UpstashLeadStore
  extends UpstashRetainedNotificationStore<ProductionCheckLead>
  implements LeadStore {
  private readonly growth?: RedisGrowthStoreOptions

  constructor(
    url: string,
    token: string,
    now: () => Date = () => new Date(),
    growth?: RedisGrowthStoreOptions,
  ) {
    super(
      url,
      token,
      'Lead persistence is temporarily unavailable.',
      LEAD_KEY_PREFIX,
      LEAD_RECORD_TTL_SECONDS,
      now,
      SCAN_STORE_TIMEOUT_MS,
    )
    this.growth = growth
  }

  override async createOrGet(lead: ProductionCheckLead) {
    if (!this.growth) return super.createOrGet(lead)
    const serialized = JSON.stringify(lead)
    const ttl = String(this.remainingTtlSeconds(lead.expiresAt))
    const prepared = prepareRedisGrowthEvents([
      { event: this.growth.events.leadCreated(lead), retainedUntil: lead.expiresAt },
      { event: this.growth.events.leadSegmented(lead), retainedUntil: lead.expiresAt },
    ], this.now(), 2, 3)
    const result = await this.client.command<[number | string, string]>([
      'EVAL',
      `${prepared.collisionGuardLua}; local existing = redis.call('HGET', KEYS[1], 'record'); if existing then return {0, existing} end; redis.call('HSET', KEYS[1], 'record', ARGV[1]); redis.call('EXPIRE', KEYS[1], ARGV[2]); ${prepared.appendLua}; return {1, ARGV[1]}`,
      String(1 + prepared.keys.length),
      this.key(lead.id),
      ...prepared.keys,
      serialized,
      ttl,
      ...prepared.args,
    ])
    return { lead: JSON.parse(result[1]) as ProductionCheckLead, created: Number(result[0]) === 1 }
  }
}

abstract class UpstashJsonStore<T extends { id: string }> {
  protected readonly client: UpstashRestClient

  constructor(
    url: string,
    token: string,
    unavailableMessage: string,
    private readonly keyPrefix: string,
    private readonly maximumTtlSeconds: number,
    protected readonly now: () => Date = () => new Date(),
  ) {
    this.client = new UpstashRestClient(url, token, unavailableMessage, SCAN_STORE_TIMEOUT_MS)
  }

  protected async createOrGetRecord(record: T, retainedUntil: string) {
    const serialized = JSON.stringify(record)
    const result = await this.client.command<[number | string, string]>([
      'EVAL',
      "local existing = redis.call('GET', KEYS[1]); if existing then return {0, existing} end; redis.call('SET', KEYS[1], ARGV[1], 'EX', ARGV[2]); return {1, ARGV[1]}",
      '1',
      this.key(record.id),
      serialized,
      String(this.remainingTtlSeconds(retainedUntil)),
    ])
    return { record: JSON.parse(result[1]) as T, created: Number(result[0]) === 1 }
  }

  protected async saveRecord(record: T, retainedUntil: string): Promise<void> {
    await this.client.command<string>([
      'SET',
      this.key(record.id),
      JSON.stringify(record),
      'EX',
      String(this.remainingTtlSeconds(retainedUntil)),
    ])
  }

  protected async getRecord(id: string): Promise<T | null> {
    const value = await this.client.command<string | null>(['GET', this.key(id)])
    return value ? JSON.parse(value) as T : null
  }

  protected key(id: string): string {
    return `${this.keyPrefix}${id}`
  }

  protected remainingTtlSeconds(retainedUntil: string): number {
    const seconds = Math.ceil((new Date(retainedUntil).getTime() - this.now().getTime()) / 1_000)
    if (!Number.isFinite(seconds) || seconds <= 0) throw new Error('Cannot persist an expired record.')
    return Math.min(seconds, this.maximumTtlSeconds)
  }
}

export class UpstashScopeReviewStore
  extends UpstashJsonStore<ProductionScopeReview>
  implements ScopeReviewStore {
  private readonly growth?: RedisGrowthStoreOptions

  constructor(url: string, token: string, now: () => Date = () => new Date(), growth?: RedisGrowthStoreOptions) {
    super(url, token, 'Scope review persistence is temporarily unavailable.', SCOPE_REVIEW_KEY_PREFIX, SCOPE_REVIEW_RECORD_TTL_SECONDS, now)
    this.growth = growth
  }

  async createOrGet(review: ProductionScopeReview) {
    if (this.growth) {
      const serialized = JSON.stringify(review)
      const ttl = String(this.remainingTtlSeconds(review.expiresAt))
      const prepared = prepareRedisGrowthEvents([
        { event: this.growth.events.scopeReviewRequested(review), retainedUntil: review.expiresAt },
      ], this.now(), 2, 3)
      const result = await this.client.command<[number | string, string]>([
        'EVAL',
        `${prepared.collisionGuardLua}; local existing = redis.call('GET', KEYS[1]); if existing then return {0, existing} end; redis.call('SET', KEYS[1], ARGV[1], 'EX', ARGV[2]); ${prepared.appendLua}; return {1, ARGV[1]}`,
        String(1 + prepared.keys.length),
        this.key(review.id),
        ...prepared.keys,
        serialized,
        ttl,
        ...prepared.args,
      ])
      return { review: JSON.parse(result[1]) as ProductionScopeReview, created: Number(result[0]) === 1 }
    }
    const result = await this.createOrGetRecord(review, review.expiresAt)
    return { review: result.record, created: result.created }
  }

  async save(review: ProductionScopeReview): Promise<void> {
    const canEmit = Boolean(this.growth && review.decision && review.status !== 'pending_review')
    if (!canEmit || !this.growth) {
      await this.saveRecord(review, review.expiresAt)
      return
    }
    const revision = (review.growthEventRevisions?.decisionRecorded ?? 0) + 1
    const persisted = { ...review, growthEventRevisions: { ...review.growthEventRevisions, decisionRecorded: revision } }
    const prepared = prepareRedisGrowthEvents([
      { event: this.growth.events.scopeReviewDecision(persisted, revision), retainedUntil: review.expiresAt },
    ], this.now(), 2, 3)
    await this.client.command<string>([
      'EVAL',
      `${prepared.collisionGuardLua}; local incoming = cjson.decode(ARGV[1]); local existingJson = redis.call('GET', KEYS[1]); if existingJson then local existing = cjson.decode(existingJson); if existing.decision == incoming.decision and existing.status == incoming.status then incoming.growthEventRevisions = existing.growthEventRevisions; local same = cjson.encode(incoming); redis.call('SET', KEYS[1], same, 'EX', ARGV[2]); return same end end; redis.call('SET', KEYS[1], ARGV[1], 'EX', ARGV[2]); ${prepared.appendLua}; return ARGV[1]`,
      String(1 + prepared.keys.length),
      this.key(review.id),
      ...prepared.keys,
      JSON.stringify(persisted),
      String(this.remainingTtlSeconds(review.expiresAt)),
      ...prepared.args,
    ])
  }

  get(id: string): Promise<ProductionScopeReview | null> {
    return this.getRecord(id)
  }
}

export class UpstashScopeOfferStore
  extends UpstashJsonStore<ProductionScopeOffer>
  implements ScopeOfferStore {
  private readonly growth?: RedisGrowthStoreOptions

  constructor(url: string, token: string, now: () => Date = () => new Date(), growth?: RedisGrowthStoreOptions) {
    super(url, token, 'Scope offer persistence is temporarily unavailable.', SCOPE_OFFER_KEY_PREFIX, SCOPE_OFFER_RETENTION_SECONDS, now)
    this.growth = growth
  }

  async claimForReview(offer: ProductionScopeOffer) {
    const serialized = JSON.stringify(offer)
    const ttl = String(this.remainingTtlSeconds(offer.retainedUntil))
    const prepared = this.growth
      ? prepareRedisGrowthEvents([
          { event: this.growth.events.offerCreated(offer), retainedUntil: offer.retainedUntil },
        ], this.now(), 4, 7)
      : undefined
    const result = await this.client.command<[number | string, string]>([
      'EVAL',
      `${prepared?.collisionGuardLua ?? ''}; local claimedId = redis.call('GET', KEYS[1]); if claimedId then local claimed = redis.call('GET', ARGV[3] .. claimedId); if claimed then return {0, claimed} end; redis.call('DEL', KEYS[1]) end; local byId = redis.call('GET', KEYS[2]); if byId then local existing = cjson.decode(byId); if existing.scopeReviewId == ARGV[4] then redis.call('SET', KEYS[1], existing.id, 'EX', ARGV[2]) end; return {0, byId} end; redis.call('SET', KEYS[2], ARGV[1], 'EX', ARGV[2]); redis.call('SET', KEYS[1], ARGV[5], 'EX', ARGV[2]); redis.call('ZADD', KEYS[3], ARGV[6], ARGV[5]); ${prepared?.appendLua ?? ''}; return {1, ARGV[1]}`,
      String(3 + (prepared?.keys.length ?? 0)),
      this.reviewKey(offer.scopeReviewId),
      this.key(offer.id),
      GROWTH_REDIS_OFFER_EXPIRY_KEY,
      ...(prepared?.keys ?? []),
      serialized,
      ttl,
      SCOPE_OFFER_KEY_PREFIX,
      offer.scopeReviewId,
      offer.id,
      String(new Date(offer.expiresAt).getTime()),
      ...(prepared?.args ?? []),
    ])
    return {
      offer: JSON.parse(result[1]) as ProductionScopeOffer,
      created: Number(result[0]) === 1,
    }
  }

  async markSent(id: string, sentAt: string): Promise<ProductionScopeOffer | null> {
    const before = this.growth ? await this.getRecord(id) : null
    const projected = before && before.status === 'draft'
      ? { ...before, status: 'sent' as const, sentAt, notification: { status: 'sent' as const, attemptedAt: sentAt } }
      : null
    const prepared = projected && this.growth
      ? prepareRedisGrowthEvents([
          { event: this.growth.events.offerSent(projected), retainedUntil: projected.retainedUntil },
        ], this.now(), 2, 2)
      : undefined
    const result = await this.client.command<string | null>([
      'EVAL',
      `${prepared?.collisionGuardLua ?? ''}; local existing = redis.call('GET', KEYS[1]); if not existing then return nil end; local offer = cjson.decode(existing); if offer.status ~= 'draft' then return existing end; offer.status = 'sent'; offer.sentAt = ARGV[1]; offer.notification = {status = 'sent', attemptedAt = ARGV[1]}; local updated = cjson.encode(offer); redis.call('SET', KEYS[1], updated, 'KEEPTTL'); ${prepared?.appendLua ?? ''}; return updated`,
      String(1 + (prepared?.keys.length ?? 0)),
      this.key(id),
      ...(prepared?.keys ?? []),
      sentAt,
      ...(prepared?.args ?? []),
    ])
    return result ? JSON.parse(result) as ProductionScopeOffer : null
  }

  async markSendFailed(id: string, attemptedAt: string): Promise<ProductionScopeOffer | null> {
    const result = await this.client.command<string | null>([
      'EVAL',
      "local existing = redis.call('GET', KEYS[1]); if not existing then return nil end; local offer = cjson.decode(existing); if offer.status ~= 'draft' then return existing end; offer.notification = {status = 'failed', attemptedAt = ARGV[1]}; local updated = cjson.encode(offer); redis.call('SET', KEYS[1], updated, 'KEEPTTL'); return updated",
      '1',
      this.key(id),
      attemptedAt,
    ])
    return result ? JSON.parse(result) as ProductionScopeOffer : null
  }

  get(id: string): Promise<ProductionScopeOffer | null> {
    return this.getRecord(id)
  }

  async transitionDecision(
    id: string,
    decision: 'accepted' | 'declined',
    decidedAt: string,
  ): Promise<ProductionScopeOffer | null> {
    const before = this.growth ? await this.getRecord(id) : null
    let projected: ProductionScopeOffer | null = null
    let projectedEvent: ReturnType<GrowthOutcomeEventFactory['offerDecision']> | undefined
    if (before && before.status === 'sent') {
      if (new Date(before.expiresAt).getTime() <= new Date(decidedAt).getTime()) {
        projected = { ...before, status: 'expired' }
        projectedEvent = this.growth?.events.offerExpired(projected, decidedAt)
      } else {
        projected = {
          ...before,
          status: decision,
          ...(decision === 'accepted' ? { acceptedAt: decidedAt } : { declinedAt: decidedAt }),
          decisionReviewSync: { status: 'pending' },
          decisionNotification: { status: 'pending' },
        }
        projectedEvent = this.growth?.events.offerDecision(projected)
      }
    }
    const prepared = projected && projectedEvent
      ? prepareRedisGrowthEvents([
          { event: projectedEvent, retainedUntil: projected.retainedUntil },
        ], this.now(), 3, 4)
      : undefined
    const result = await this.client.command<string | null>([
      'EVAL',
      `${prepared?.collisionGuardLua ?? ''}; local existing = redis.call('GET', KEYS[1]); if not existing then redis.call('ZREM', KEYS[2], ARGV[3]); return nil end; local offer = cjson.decode(existing); if offer.status == 'accepted' or offer.status == 'declined' or offer.status == 'expired' then redis.call('ZREM', KEYS[2], ARGV[3]); return existing end; if offer.expiresAt <= ARGV[2] then offer.status = 'expired'; local expired = cjson.encode(offer); redis.call('SET', KEYS[1], expired, 'KEEPTTL'); redis.call('ZREM', KEYS[2], ARGV[3]); ${prepared?.appendLua ?? ''}; return expired end; if offer.status ~= 'sent' then return existing end; offer.status = ARGV[1]; if ARGV[1] == 'accepted' then offer.acceptedAt = ARGV[2] else offer.declinedAt = ARGV[2] end; offer.decisionReviewSync = {status = 'pending'}; offer.decisionNotification = {status = 'pending'}; local updated = cjson.encode(offer); redis.call('SET', KEYS[1], updated, 'KEEPTTL'); redis.call('ZREM', KEYS[2], ARGV[3]); ${prepared?.appendLua ?? ''}; return updated`,
      String(2 + (prepared?.keys.length ?? 0)),
      this.key(id),
      GROWTH_REDIS_OFFER_EXPIRY_KEY,
      ...(prepared?.keys ?? []),
      decision,
      decidedAt,
      id,
      ...(prepared?.args ?? []),
    ])
    return result ? JSON.parse(result) as ProductionScopeOffer : null
  }

  async recordDecisionReconciliation(
    id: string,
    update: {
      reviewSync?: 'synced' | 'failed'
      notification?: 'sent' | 'failed'
    },
    attemptedAt: string,
  ): Promise<ProductionScopeOffer | null> {
    const result = await this.client.command<string | null>([
      'EVAL',
      "local existing = redis.call('GET', KEYS[1]); if not existing then return nil end; local offer = cjson.decode(existing); if offer.status ~= 'accepted' and offer.status ~= 'declined' then return existing end; if ARGV[1] ~= '' and (not offer.decisionReviewSync or offer.decisionReviewSync.status ~= 'synced') then offer.decisionReviewSync = {status = ARGV[1], attemptedAt = ARGV[3]} end; if ARGV[2] ~= '' and (not offer.decisionNotification or offer.decisionNotification.status ~= 'sent') then offer.decisionNotification = {status = ARGV[2], attemptedAt = ARGV[3]} end; local updated = cjson.encode(offer); redis.call('SET', KEYS[1], updated, 'KEEPTTL'); return updated",
      '1',
      this.key(id),
      update.reviewSync ?? '',
      update.notification ?? '',
      attemptedAt,
    ])
    return result ? JSON.parse(result) as ProductionScopeOffer : null
  }

  async materializeExpired(now: Date, limit: number): Promise<number> {
    if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100) throw new Error('Offer expiry limit is invalid')
    const dueIds = await this.client.command<string[]>([
      'ZRANGEBYSCORE',
      GROWTH_REDIS_OFFER_EXPIRY_KEY,
      '-inf',
      String(now.getTime()),
      'LIMIT',
      '0',
      String(limit),
    ])
    let materialized = 0
    for (const id of dueIds) {
      const result = await this.transitionDecision(id, 'declined', now.toISOString())
      if (result?.status === 'expired') materialized += 1
    }
    return materialized
  }

  private reviewKey(scopeReviewId: string): string {
    return `${SCOPE_OFFER_REVIEW_KEY_PREFIX}${scopeReviewId}`
  }
}

declare global {
  // Next.js may evaluate route modules in separate bundles during development.
  // Keeping the fallback on globalThis makes those bundles share one store.
  var __engisolsProductionCheckStore: MemoryScanStore | undefined
  var __engisolsProductionCheckLeadStore: MemoryLeadStore | undefined
  var __engisolsProductionCheckScopeReviewStore: MemoryScopeReviewStore | undefined
  var __engisolsProductionCheckScopeOfferStore: MemoryScopeOfferStore | undefined
  var __engisolsGrowthOutboxStore: MemoryGrowthOutboxStore | undefined
}

const memoryGrowthOutbox = globalThis.__engisolsGrowthOutboxStore ?? new MemoryGrowthOutboxStore()
globalThis.__engisolsGrowthOutboxStore = memoryGrowthOutbox
const memoryGrowthOptions = process.env.GROWTH_ANALYTICS_ID_KEY
  ? {
      outbox: memoryGrowthOutbox,
      events: createGrowthOutcomeEventFactory(process.env.GROWTH_ANALYTICS_ID_KEY),
    }
  : undefined
const memoryStore =
  globalThis.__engisolsProductionCheckStore ?? new MemoryScanStore()
globalThis.__engisolsProductionCheckStore = memoryStore
const memoryLeadStore =
  globalThis.__engisolsProductionCheckLeadStore ?? new MemoryLeadStore(undefined, memoryGrowthOptions)
globalThis.__engisolsProductionCheckLeadStore = memoryLeadStore
const memoryScopeReviewStore = globalThis.__engisolsProductionCheckScopeReviewStore ?? new MemoryScopeReviewStore(undefined, memoryGrowthOptions)
globalThis.__engisolsProductionCheckScopeReviewStore = memoryScopeReviewStore
const memoryScopeOfferStore = globalThis.__engisolsProductionCheckScopeOfferStore ?? new MemoryScopeOfferStore(undefined, memoryGrowthOptions)
globalThis.__engisolsProductionCheckScopeOfferStore = memoryScopeOfferStore
let configuredStore: ScanStore | undefined
let configuredLeadStore: LeadStore | undefined
let configuredScopeReviewStore: ScopeReviewStore | undefined
let configuredScopeOfferStore: ScopeOfferStore | undefined
let configuredGrowthOutboxStore: GrowthOutboxOperations | undefined

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
    configuredLeadStore = new UpstashLeadStore(url, token, undefined, configuredRedisGrowthOptions())
    return configuredLeadStore
  }
  if (process.env.NODE_ENV === 'production') {
    throw new ScanStoreConfigurationError(
      'Production lead persistence requires Upstash Redis REST configuration.',
    )
  }
  return memoryLeadStore
}

export function getScopeReviewStore(): ScopeReviewStore {
  if (configuredScopeReviewStore) return configuredScopeReviewStore
  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN
  if (url && token) {
    configuredScopeReviewStore = new UpstashScopeReviewStore(url, token, undefined, configuredRedisGrowthOptions())
    return configuredScopeReviewStore
  }
  if (process.env.NODE_ENV === 'production') {
    throw new ScanStoreConfigurationError('Production scope review persistence requires Upstash Redis REST configuration.')
  }
  return memoryScopeReviewStore
}

export function getScopeOfferStore(): ScopeOfferStore {
  if (configuredScopeOfferStore) return configuredScopeOfferStore
  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN
  if (url && token) {
    configuredScopeOfferStore = new UpstashScopeOfferStore(url, token, undefined, configuredRedisGrowthOptions())
    return configuredScopeOfferStore
  }
  if (process.env.NODE_ENV === 'production') {
    throw new ScanStoreConfigurationError('Production scope offer persistence requires Upstash Redis REST configuration.')
  }
  return memoryScopeOfferStore
}

export function setScanStoreForTests(store: ScanStore | undefined): void {
  configuredStore = store
}

export function setLeadStoreForTests(store: LeadStore | undefined): void {
  configuredLeadStore = store
}

export function setScopeReviewStoreForTests(store: ScopeReviewStore | undefined): void {
  configuredScopeReviewStore = store
}

export function setScopeOfferStoreForTests(store: ScopeOfferStore | undefined): void {
  configuredScopeOfferStore = store
}

export function getMemoryGrowthOutboxStoreForTests(): MemoryGrowthOutboxStore {
  return memoryGrowthOutbox
}

export function getGrowthOutboxStore(): GrowthOutboxOperations {
  if (configuredGrowthOutboxStore) return configuredGrowthOutboxStore
  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN
  if (url && token) {
    configuredGrowthOutboxStore = new UpstashGrowthOutboxStore(url, token, SCAN_STORE_TIMEOUT_MS)
    return configuredGrowthOutboxStore
  }
  if (process.env.NODE_ENV === 'production') {
    throw new ScanStoreConfigurationError(
      'Production growth outcome persistence requires Upstash Redis REST configuration.',
    )
  }
  return memoryGrowthOutbox
}

export function setGrowthOutboxStoreForTests(store: GrowthOutboxOperations | undefined): void {
  configuredGrowthOutboxStore = store
}

function configuredRedisGrowthOptions(): RedisGrowthStoreOptions | undefined {
  // Production activation is deliberately fail-closed until operations records
  // non-evicting Redis policy and sufficient capacity headroom.
  if (process.env.GROWTH_REDIS_DURABILITY_VERIFIED !== 'true') return undefined
  const key = process.env.GROWTH_ANALYTICS_ID_KEY
  if (!key) throw new ScanStoreConfigurationError('Growth outcome events require GROWTH_ANALYTICS_ID_KEY.')
  return { events: createGrowthOutcomeEventFactory(key) }
}
