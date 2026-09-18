import type { ProductionCheckAttribution } from './types'
import { containsCredentialLikeValue } from './security'

const ATTRIBUTION_MAX_LENGTH = 200
const attributionKeys = [
  'source',
  'medium',
  'campaign',
  'content',
  'term',
  'fbclid',
  'metaCampaignId',
  'metaAdsetId',
  'metaAdId',
  'metaPlacement',
  'metaSource',
] as const
const searchParamByKey: Record<(typeof attributionKeys)[number], string> = {
  source: 'utm_source',
  medium: 'utm_medium',
  campaign: 'utm_campaign',
  content: 'utm_content',
  term: 'utm_term',
  fbclid: 'fbclid',
  metaCampaignId: 'meta_campaign_id',
  metaAdsetId: 'meta_adset_id',
  metaAdId: 'meta_ad_id',
  metaPlacement: 'meta_placement',
  metaSource: 'meta_source',
}

export type ProductionCheckPostHogAttribution = Partial<Record<
  | 'utm_source'
  | 'utm_medium'
  | 'utm_campaign'
  | 'utm_content'
  | 'utm_term'
  | 'meta_campaign_id'
  | 'meta_adset_id'
  | 'meta_ad_id'
  | 'meta_placement'
  | 'meta_source',
  string
>>

export function attributionFromSearchParams(
  searchParams: Pick<URLSearchParams, 'get'>,
): ProductionCheckAttribution {
  const attribution: ProductionCheckAttribution = {}
  for (const key of attributionKeys) {
    const raw = searchParams.get(searchParamByKey[key])
    const value = normalizeAttributionValue(raw)
    if (
      value &&
      value.length <= ATTRIBUTION_MAX_LENGTH &&
      !hasControlCharacter(raw) &&
      isValidAttributionValue(key, value) &&
      !containsCredentialLikeValue(value)
    ) {
      attribution[key] = value
    }
  }
  return attribution
}

export function parseAttributionInput(value: unknown): ProductionCheckAttribution | null {
  if (value === undefined) return {}
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  if (Object.keys(value).some((key) => !attributionKeys.includes(key as never))) return null

  const input = value as Record<string, unknown>
  const attribution: ProductionCheckAttribution = {}
  for (const key of attributionKeys) {
    const raw = input[key]
    if (raw === undefined || raw === '') continue
    if (typeof raw !== 'string') return null
    if (hasControlCharacter(raw)) return null
    const normalized = normalizeAttributionValue(raw)
    if (!normalized) continue
    if (normalized.length > ATTRIBUTION_MAX_LENGTH) return null
    if (!isValidAttributionValue(key, normalized)) return null
    attribution[key] = normalized
  }
  if (containsCredentialLikeValue(attribution)) return null
  return attribution
}

export function isControlledQaAttribution(
  attribution: ProductionCheckAttribution,
): boolean {
  return attribution.source?.toLowerCase() === 'meta_test'
}

export function toPostHogAttributionProperties(
  attribution: ProductionCheckAttribution,
): ProductionCheckPostHogAttribution {
  return {
    ...(attribution.source ? { utm_source: attribution.source } : {}),
    ...(attribution.medium ? { utm_medium: attribution.medium } : {}),
    ...(attribution.campaign ? { utm_campaign: attribution.campaign } : {}),
    ...(attribution.content ? { utm_content: attribution.content } : {}),
    ...(attribution.term ? { utm_term: attribution.term } : {}),
    ...(attribution.metaCampaignId ? { meta_campaign_id: attribution.metaCampaignId } : {}),
    ...(attribution.metaAdsetId ? { meta_adset_id: attribution.metaAdsetId } : {}),
    ...(attribution.metaAdId ? { meta_ad_id: attribution.metaAdId } : {}),
    ...(attribution.metaPlacement ? { meta_placement: attribution.metaPlacement } : {}),
    ...(attribution.metaSource ? { meta_source: attribution.metaSource } : {}),
  }
}

function normalizeAttributionValue(value: string | null): string {
  return value?.trim().replace(/[\u0000-\u001f\u007f]/g, '') ?? ''
}

function hasControlCharacter(value: string | null): boolean {
  return value !== null && /[\u0000-\u001f\u007f]/.test(value)
}

function isValidAttributionValue(
  key: (typeof attributionKeys)[number],
  value: string,
): boolean {
  if (key === 'metaCampaignId' || key === 'metaAdsetId' || key === 'metaAdId') {
    return /^\d{3,40}$/.test(value)
  }
  if (key === 'metaPlacement' || key === 'metaSource') {
    return /^[A-Za-z0-9._-]{1,80}$/.test(value)
  }
  return true
}
