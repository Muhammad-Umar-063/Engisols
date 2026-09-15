import { LEAD_RECORD_TTL_SECONDS, SCAN_STORE_TIMEOUT_MS } from '../production-check/config'
import {
  MemoryRetainedNotificationStore,
  UpstashRetainedNotificationStore,
} from '../persistence/retained-notification-store'
import type { AuditInquiryLead, AuditInquiryLeadStore } from './audit-inquiry-lead'

const KEY_PREFIX = 'engisols:ai-app-audit:lead:'

export class AuditInquiryStoreConfigurationError extends Error {}

export class MemoryAuditInquiryLeadStore
  extends MemoryRetainedNotificationStore<AuditInquiryLead>
  implements AuditInquiryLeadStore {}

export class UpstashAuditInquiryLeadStore
  extends UpstashRetainedNotificationStore<AuditInquiryLead>
  implements AuditInquiryLeadStore {
  constructor(
    url: string,
    token: string,
    now: () => Date = () => new Date(),
  ) {
    super(
      url,
      token,
      'AI App Audit lead persistence is temporarily unavailable.',
      KEY_PREFIX,
      LEAD_RECORD_TTL_SECONDS,
      now,
      SCAN_STORE_TIMEOUT_MS,
    )
  }
}

declare global {
  var __engisolsAiAppAuditLeadStore: MemoryAuditInquiryLeadStore | undefined
}

const memoryStore = globalThis.__engisolsAiAppAuditLeadStore ?? new MemoryAuditInquiryLeadStore()
globalThis.__engisolsAiAppAuditLeadStore = memoryStore
let configuredStore: AuditInquiryLeadStore | undefined

export function getAuditInquiryLeadStore(): AuditInquiryLeadStore {
  if (configuredStore) return configuredStore
  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN
  if (url && token) {
    configuredStore = new UpstashAuditInquiryLeadStore(url, token)
    return configuredStore
  }
  if (process.env.NODE_ENV === 'production') {
    throw new AuditInquiryStoreConfigurationError(
      'Production AI App Audit lead persistence requires Upstash Redis REST configuration.',
    )
  }
  return memoryStore
}
