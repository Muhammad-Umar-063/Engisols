import {
  ENGISOLS_GROWTH_EXPORT_SCHEMA_VERSION,
  signGrowthExportCursor,
  verifyGrowthExportCursor,
  type GrowthExportCursorClaims,
} from '../../../../../src/growth/export-cursor'
import type { GrowthInternalRateLimiter } from '../../../../../src/growth/export-rate-limit'
import { growthInternalRateLimiter } from '../../../../../src/growth/export-rate-limit'
import { ENGISOLS_GROWTH_EVENT_SOURCE } from '../../../../../src/growth/event-contract'
import { assertRotatingCredential, authorizeRotatingBearer } from '../../../../../src/growth/internal-auth'
import type { GrowthEventLedgerRecord, GrowthOutboxOperations } from '../../../../../src/growth/outbox-types'
import { getGrowthOutboxStore } from '../../../../../src/production-check/store'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 20

const DEFAULT_RANGE_MS = 24 * 60 * 60 * 1_000
const MAX_RANGE_MS = 31 * 24 * 60 * 60 * 1_000
const MAX_FUTURE_MS = 5 * 60 * 1_000
const MAX_PAGE_SIZE = 500
const MAX_SCAN_BATCHES = 10

interface Dependencies {
  readonly environment?: NodeJS.ProcessEnv
  readonly now?: () => Date
  readonly outbox?: GrowthOutboxOperations
  readonly limiter?: GrowthInternalRateLimiter
  readonly audit?: (metadata: Record<string, string | number | boolean>) => void
}

export function createGrowthOutcomesGetHandler({
  environment = process.env,
  now = () => new Date(),
  outbox,
  limiter,
  audit = (metadata) => console.info(JSON.stringify(metadata)),
}: Dependencies = {}) {
  return async function GET(request: Request): Promise<Response> {
    const reject = (status: number, code: string, credentialVersion = 'none') => {
      audit({ event: 'growth_outcomes_export', credentialVersion, result: code, count: 0, complete: false })
      return safeError(status, code)
    }
    const credential = {
      current: environment.GROWTH_COPILOT_EXPORT_TOKEN,
      previous: environment.GROWTH_COPILOT_EXPORT_TOKEN_PREVIOUS,
    }
    const credentialVersion = authorizeRotatingBearer(request, credential)
    if (!credentialVersion) return reject(401, 'unauthorized')
    try { assertRotatingCredential(credential, 'Growth export') } catch { return reject(503, 'not_configured', credentialVersion) }
    const cursorCredential = {
      current: environment.GROWTH_COPILOT_EXPORT_CURSOR_SECRET,
      previous: environment.GROWTH_COPILOT_EXPORT_CURSOR_SECRET_PREVIOUS,
    }
    try { assertRotatingCredential(cursorCredential, 'Growth export cursor') } catch { return reject(503, 'not_configured', credentialVersion) }

    let activeLimiter: GrowthInternalRateLimiter
    try { activeLimiter = limiter ?? growthInternalRateLimiter(environment) } catch { return reject(503, 'temporarily_unavailable', credentialVersion) }
    try {
      if (!await activeLimiter.consume('export', credentialVersion, now())) return reject(429, 'rate_limited', credentialVersion)
    } catch {
      return reject(503, 'temporarily_unavailable', credentialVersion)
    }

    const target = new URL(request.url)
    if ([...target.searchParams.keys()].some((key) => !['since', 'until', 'cursor', 'limit'].includes(key))) {
      return reject(400, 'invalid_query', credentialVersion)
    }
    const secrets = [cursorCredential.current, cursorCredential.previous].filter((value): value is string => Boolean(value))
    const suppliedCursor = target.searchParams.get('cursor')
    const cursor = suppliedCursor ? verifyGrowthExportCursor(suppliedCursor, secrets) : null
    if (suppliedCursor && !cursor) return reject(400, 'invalid_cursor', credentialVersion)

    const range = resolveRange(target.searchParams, cursor, now())
    if (!range) return reject(400, 'invalid_range', credentialVersion)
    const limit = parseLimit(target.searchParams.get('limit'))
    if (limit === null) return reject(400, 'invalid_limit', credentialVersion)

    try {
      const store = outbox ?? getGrowthOutboxStore()
      const currentMax = await store.getMaxSequence()
      const snapshotMaxSequence = cursor && !cursor.complete
        ? cursor.snapshotMaxSequence
        : currentMax
      let afterSequence = cursor?.afterSequence ?? 0
      const events: GrowthEventLedgerRecord['event'][] = []
      let batches = 0

      while (afterSequence < snapshotMaxSequence && events.length < limit && batches < MAX_SCAN_BATCHES) {
        const records = await store.listLedger(afterSequence, Math.min(MAX_PAGE_SIZE, Math.max(limit, 100)), snapshotMaxSequence)
        batches += 1
        if (!records.length) {
          afterSequence = snapshotMaxSequence
          break
        }
        for (const record of records) {
          afterSequence = record.sequence
          const occurredAt = Date.parse(record.event.occurredAt)
          if (occurredAt >= range.sinceMs && occurredAt <= range.untilMs) events.push(record.event)
          if (events.length === limit) break
        }
      }

      const complete = afterSequence >= snapshotMaxSequence
      const deliveryHealth = await store.getDeliveryHealth(now())
      const claims: GrowthExportCursorClaims = {
        version: 1,
        afterSequence,
        snapshotMaxSequence,
        since: range.since,
        until: range.until,
        complete,
      }
      const checkpointCursor = signGrowthExportCursor(claims, cursorCredential.current as string)
      const nextCursor = complete ? null : checkpointCursor
      audit({
        event: 'growth_outcomes_export',
        credentialVersion,
        result: 'success',
        count: events.length,
        complete,
      })
      return Response.json(
        {
          schemaVersion: ENGISOLS_GROWTH_EXPORT_SCHEMA_VERSION,
          source: ENGISOLS_GROWTH_EVENT_SOURCE,
          since: range.since,
          until: range.until,
          events,
          deliveryHealth,
          checkpointCursor,
          nextCursor,
        },
        { headers: { 'Cache-Control': 'no-store, private' } },
      )
    } catch {
      audit({ event: 'growth_outcomes_export', credentialVersion, result: 'failure', count: 0, complete: false })
      return safeError(503, 'temporarily_unavailable')
    }
  }
}

function resolveRange(
  search: URLSearchParams,
  cursor: GrowthExportCursorClaims | null,
  now: Date,
): { since: string; until: string; sinceMs: number; untilMs: number } | null {
  const requestedSince = search.get('since')
  const requestedUntil = search.get('until')
  const untilMs = requestedUntil ? Date.parse(requestedUntil) : cursor ? Date.parse(cursor.until) : now.getTime()
  const sinceMs = requestedSince ? Date.parse(requestedSince) : cursor ? Date.parse(cursor.since) : untilMs - DEFAULT_RANGE_MS
  if (!Number.isFinite(sinceMs) || !Number.isFinite(untilMs) || untilMs <= sinceMs) return null
  if (untilMs - sinceMs > MAX_RANGE_MS || untilMs > now.getTime() + MAX_FUTURE_MS) return null
  const since = new Date(sinceMs).toISOString()
  const until = new Date(untilMs).toISOString()
  if (cursor && (cursor.since !== since || cursor.until !== until)) return null
  return { since, until, sinceMs, untilMs }
}

function parseLimit(value: string | null): number | null {
  if (value === null) return 100
  if (!/^\d+$/.test(value)) return null
  const parsed = Number(value)
  return Number.isSafeInteger(parsed) && parsed >= 1 && parsed <= MAX_PAGE_SIZE ? parsed : null
}

function safeError(status: number, code: string): Response {
  return Response.json(
    { ok: false, error: { code, message: 'Growth outcome export could not be completed.' } },
    { status, headers: { 'Cache-Control': 'no-store, private' } },
  )
}

export const GET = createGrowthOutcomesGetHandler()
