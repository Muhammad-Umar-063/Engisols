import type { ScopeOfferBilling } from './types'

export const SCAN_RECORD_LIFETIME_MS = 90 * 24 * 60 * 60 * 1_000
export const SCAN_RECORD_TTL_SECONDS = SCAN_RECORD_LIFETIME_MS / 1_000
export const LEAD_RECORD_LIFETIME_MS = 365 * 24 * 60 * 60 * 1_000
export const LEAD_RECORD_TTL_SECONDS = LEAD_RECORD_LIFETIME_MS / 1_000
export const SCOPE_REVIEW_RECORD_LIFETIME_MS = 365 * 24 * 60 * 60 * 1_000
export const SCOPE_REVIEW_RECORD_TTL_SECONDS = SCOPE_REVIEW_RECORD_LIFETIME_MS / 1_000
export const SCOPE_OFFER_RETENTION_MS = 365 * 24 * 60 * 60 * 1_000
export const SCOPE_OFFER_RETENTION_SECONDS = SCOPE_OFFER_RETENTION_MS / 1_000
export const SCOPE_OFFER_VALIDITY_MS = 30 * 24 * 60 * 60 * 1_000
export const OPERATOR_LINK_LIFETIME_MS = 7 * 24 * 60 * 60 * 1_000
export const SCAN_STORE_TIMEOUT_MS = 2_000
export const LAUNCH_BLOCKER_FIX_PRICE_USD = 499
export const PRODUCTION_HARDEN_PRICE_USD = 1_999
export const PRODUCTION_ENGINEERING_PRICE_USD = 2_000

export function formatProductionCheckPrice(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatProductionScopeOfferPrice(
  amount: number | undefined,
  billing: ScopeOfferBilling,
): string {
  if (amount === undefined) return 'Custom'
  return `${formatProductionCheckPrice(amount)}${billing === 'monthly' ? ' / month' : ' fixed'}`
}
