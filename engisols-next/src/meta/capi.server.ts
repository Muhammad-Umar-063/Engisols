import { createHash } from 'node:crypto'
import { isIP } from 'node:net'

import { normalizeMetaCookie } from './identifiers'
import type {
  MetaCommerceData,
  MetaConsentDecision,
  MetaIdentifiers,
  MetaServerEventName,
} from './types'

export const META_GRAPH_API_VERSION = 'v26.0'
const META_CAPI_TIMEOUT_MS = 5_000
const SHA256_PATTERN = /^[A-Fa-f0-9]{64}$/
const DATASET_ID_PATTERN = /^\d{5,32}$/
const EVENT_ID_PATTERN = /^[A-Za-z0-9_-]{16,100}$/

export interface MetaConversionEvent {
  eventName: MetaServerEventName
  eventId: string
  eventTime: Date
  eventSourceUrl: string
  actionSource: 'website'
  consent: MetaConsentDecision
  userData: {
    email?: string
    clientIp?: string
    clientUserAgent?: string
    identifiers?: MetaIdentifiers
  }
  customData?: MetaCommerceData
}

export interface MetaCapiResult {
  status: 'sent' | 'skipped' | 'failed'
  httpStatus?: number
  traceId?: string
  reason?: 'not_configured' | 'consent_denied' | 'invalid_event' | 'missing_user_data'
}

export type MetaConversionSender = (event: MetaConversionEvent) => Promise<MetaCapiResult>

interface MetaCapiOptions {
  env?: NodeJS.ProcessEnv
  fetch?: typeof fetch
  log?: (message: string, fields: Readonly<Record<string, string | number>>) => void
}

interface MetaCapiPayload {
  data: Array<{
    event_name: MetaServerEventName
    event_time: number
    event_id: string
    event_source_url: string
    action_source: 'website'
    user_data: {
      em?: string[]
      client_ip_address?: string
      client_user_agent?: string
      fbp?: string
      fbc?: string
    }
    custom_data?: MetaCommerceData
  }>
  test_event_code?: string
}

export function normalizeEmail(value: string): string {
  return value.normalize('NFKC').trim().toLocaleLowerCase('en-US')
}

export function hashEmail(value: string): string {
  const normalized = normalizeEmail(value)
  if (SHA256_PATTERN.test(normalized)) return normalized.toLowerCase()
  return createHash('sha256').update(normalized).digest('hex')
}

export function buildMetaCapiPayload(
  event: MetaConversionEvent,
  options: { testEventCode?: string; environment?: string } = {},
): MetaCapiPayload | null {
  if (
    event.consent !== 'granted' ||
    !EVENT_ID_PATTERN.test(event.eventId) ||
    !Number.isFinite(event.eventTime.getTime()) ||
    !isAllowedEvent(event.eventName)
  ) {
    return null
  }

  let sourceUrl: URL
  try {
    sourceUrl = new URL(event.eventSourceUrl)
  } catch {
    return null
  }
  if (sourceUrl.protocol !== 'https:' && sourceUrl.protocol !== 'http:') return null
  sourceUrl.username = ''
  sourceUrl.password = ''
  sourceUrl.hash = ''

  const normalizedEmail = event.userData.email
    ? normalizeEmail(event.userData.email)
    : undefined
  const clientIp = event.userData.clientIp?.trim()
  const clientUserAgent = event.userData.clientUserAgent?.trim()
  const fbp = normalizeMetaCookie(event.userData.identifiers?.fbp)
  const fbc = normalizeMetaCookie(event.userData.identifiers?.fbc)
  const userData = {
    ...(normalizedEmail && normalizedEmail.length <= 254
      ? { em: [hashEmail(normalizedEmail)] }
      : {}),
    ...(clientIp && isIP(clientIp) ? { client_ip_address: clientIp } : {}),
    ...(clientUserAgent && clientUserAgent.length <= 512 && !/[\u0000-\u001f\u007f]/.test(clientUserAgent)
      ? { client_user_agent: clientUserAgent }
      : {}),
    ...(fbp ? { fbp } : {}),
    ...(fbc ? { fbc } : {}),
  }
  if (Object.keys(userData).length === 0) return null

  const payload: MetaCapiPayload = {
    data: [{
      event_name: event.eventName,
      event_time: Math.floor(event.eventTime.getTime() / 1_000),
      event_id: event.eventId,
      event_source_url: sourceUrl.toString(),
      action_source: 'website',
      user_data: userData,
      ...(event.customData && (event.eventName === 'Purchase' || event.eventName === 'Schedule')
        ? { custom_data: { currency: event.customData.currency, value: event.customData.value } }
        : {}),
    }],
  }
  if (options.environment !== 'production' && options.testEventCode) {
    payload.test_event_code = options.testEventCode
  }
  return payload
}

export async function sendMetaConversion(
  event: MetaConversionEvent,
  options: MetaCapiOptions = {},
): Promise<MetaCapiResult> {
  if (event.consent !== 'granted') return { status: 'skipped', reason: 'consent_denied' }
  const env = options.env ?? process.env
  const token = env.META_CONVERSIONS_API_TOKEN
  const datasetId = env.META_DATASET_ID
  if (!token || !datasetId || !DATASET_ID_PATTERN.test(datasetId)) {
    return { status: 'skipped', reason: 'not_configured' }
  }
  const payload = buildMetaCapiPayload(event, {
    environment: env.NODE_ENV,
    testEventCode: env.META_TEST_EVENT_CODE,
  })
  if (!payload) {
    const hasUserData = Boolean(
      event.userData.email ||
      event.userData.clientIp ||
      event.userData.clientUserAgent ||
      event.userData.identifiers?.fbp ||
      event.userData.identifiers?.fbc,
    )
    return {
      status: 'skipped',
      reason: hasUserData ? 'invalid_event' : 'missing_user_data',
    }
  }

  const endpoint = new URL(
    `https://graph.facebook.com/${META_GRAPH_API_VERSION}/${datasetId}/events`,
  )
  endpoint.searchParams.set('access_token', token)
  const log = options.log ?? safeMetaLog
  try {
    const response = await (options.fetch ?? fetch)(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      cache: 'no-store',
      signal: AbortSignal.timeout(META_CAPI_TIMEOUT_MS),
    })
    const traceId = await readTraceId(response)
    const fields = {
      eventName: event.eventName,
      eventId: event.eventId,
      httpStatus: response.status,
      ...(traceId ? { traceId } : {}),
    }
    if (!response.ok) {
      log('Meta CAPI delivery failed', fields)
      return { status: 'failed', httpStatus: response.status, ...(traceId ? { traceId } : {}) }
    }
    log('Meta CAPI event sent', fields)
    return { status: 'sent', httpStatus: response.status, ...(traceId ? { traceId } : {}) }
  } catch {
    log('Meta CAPI delivery failed', {
      eventName: event.eventName,
      eventId: event.eventId,
      httpStatus: 0,
    })
    return { status: 'failed' }
  }
}

function safeMetaLog(
  message: string,
  fields: Readonly<Record<string, string | number>>,
): void {
  console.info(message, fields)
}

function isAllowedEvent(value: string): value is MetaServerEventName {
  return ['ScanCompleted', 'Lead', 'QualifiedLead', 'Schedule', 'Purchase'].includes(value)
}

async function readTraceId(response: Response): Promise<string | undefined> {
  try {
    const body = await response.json() as {
      fbtrace_id?: unknown
      error?: { fbtrace_id?: unknown }
    }
    const value = body.fbtrace_id ?? body.error?.fbtrace_id
    return typeof value === 'string' && /^[A-Za-z0-9_-]{1,200}$/.test(value)
      ? value
      : undefined
  } catch {
    return undefined
  }
}

export function createScheduleConversion(
  event: Omit<MetaConversionEvent, 'eventName'>,
): MetaConversionEvent {
  return { ...event, eventName: 'Schedule' }
}

export function createPurchaseConversion(
  event: Omit<MetaConversionEvent, 'eventName'> & { customData: MetaCommerceData },
): MetaConversionEvent {
  return { ...event, eventName: 'Purchase' }
}
