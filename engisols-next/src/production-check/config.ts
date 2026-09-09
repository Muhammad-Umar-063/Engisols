export const SCAN_RECORD_LIFETIME_MS = 90 * 24 * 60 * 60 * 1_000
export const SCAN_RECORD_TTL_SECONDS = SCAN_RECORD_LIFETIME_MS / 1_000
export const LEAD_RECORD_LIFETIME_MS = 365 * 24 * 60 * 60 * 1_000
export const LEAD_RECORD_TTL_SECONDS = LEAD_RECORD_LIFETIME_MS / 1_000
export const SCAN_STORE_TIMEOUT_MS = 2_000
export const LAUNCH_BLOCKER_FIX_PRICE_USD = 499

export function formatProductionCheckPrice(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount)
}
