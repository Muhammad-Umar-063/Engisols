import { isProductionCheckCapabilityUrl } from '../production-check/analytics-privacy'

export const GOOGLE_ANALYTICS_ID = 'G-4909ZTX9F3'

declare global {
  interface Window {
    'ga-disable-G-4909ZTX9F3'?: boolean
  }
}

/**
 * Disable before Google initializes or the router exposes a private URL.
 * Keep disabled for the rest of this document: enhanced measurement can use
 * the previous history URL as a referrer after returning to a public page.
 * A fresh public document enables normal collection again.
 */
export function protectGoogleAnalyticsRoute(url: string): void {
  if (typeof window !== 'undefined' && isProductionCheckCapabilityUrl(url)) {
    window[`ga-disable-${GOOGLE_ANALYTICS_ID}`] = true
  }
}
