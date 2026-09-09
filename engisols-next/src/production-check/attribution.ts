import type { ProductionCheckAttribution } from './types'
import { containsCredentialLikeValue } from './security'

const ATTRIBUTION_MAX_LENGTH = 200
const attributionKeys = ['source', 'medium', 'campaign', 'content', 'term', 'fbclid'] as const
const searchParamByKey: Record<(typeof attributionKeys)[number], string> = {
  source: 'utm_source',
  medium: 'utm_medium',
  campaign: 'utm_campaign',
  content: 'utm_content',
  term: 'utm_term',
  fbclid: 'fbclid',
}

export function attributionFromSearchParams(
  searchParams: Pick<URLSearchParams, 'get'>,
): ProductionCheckAttribution {
  const attribution: ProductionCheckAttribution = {}
  for (const key of attributionKeys) {
    const value = normalizeAttributionValue(searchParams.get(searchParamByKey[key]))
    if (
      value &&
      value.length <= ATTRIBUTION_MAX_LENGTH &&
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
    const normalized = normalizeAttributionValue(raw)
    if (!normalized) continue
    if (normalized.length > ATTRIBUTION_MAX_LENGTH) return null
    attribution[key] = normalized
  }
  return attribution
}

function normalizeAttributionValue(value: string | null): string {
  return value?.trim().replace(/[\u0000-\u001f\u007f]/g, '') ?? ''
}
