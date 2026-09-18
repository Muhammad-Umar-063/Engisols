import { containsCredentialLikeValue } from './security'

const allowedPostHogProperties = new Set([
  'scan_id',
  'lead_id',
  'scope_review_id',
  'offer_id',
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
  'meta_campaign_id',
  'meta_adset_id',
  'meta_ad_id',
  'meta_placement',
  'meta_source',
  'offer_type',
  'offer_amount',
  'currency',
  'launch_stage',
  'builder',
  'lead_segment',
  'findingId',
  'label',
  'expanded',
  'filter',
  'lens',
  'answer',
  'layout',
  'urgent',
  'location',
  'nextStep',
])

export function productionCheckPostHogProperties(
  detail: Readonly<Record<string, string | number | boolean>>,
): Record<string, string | number | boolean> {
  return Object.fromEntries(
    Object.entries(detail).filter(([key, value]) => {
      if (!allowedPostHogProperties.has(key)) return false
      if (typeof value === 'number') return Number.isFinite(value)
      if (typeof value === 'boolean') return true
      if (typeof value !== 'string' || !isSafeString(value)) return false
      if (key === 'scan_id') return /^scan_v1_[A-Za-z0-9_-]{20,}$/.test(value)
      if (key === 'offer_id') return /^offer_v1_[A-Za-z0-9_-]{20,}$/.test(value)
      if (key === 'lead_id') return /^lead_[A-Za-z0-9_-]{20,}$/.test(value)
      if (key === 'scope_review_id') return /^scope_[A-Za-z0-9_-]{20,}$/.test(value)
      if (key === 'meta_campaign_id' || key === 'meta_adset_id' || key === 'meta_ad_id') {
        return /^\d{3,40}$/.test(value)
      }
      return true
    }),
  )
}

function isSafeString(value: string): boolean {
  return value.length <= 160 &&
    !/[\u0000-\u001f\u007f]/.test(value) &&
    !/^[a-z][a-z\d+.-]*:\/\//i.test(value) &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) &&
    !containsCredentialLikeValue(value)
}
