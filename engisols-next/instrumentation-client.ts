import posthog from 'posthog-js'

import {
  PRODUCTION_CHECK_OFFER_URL_PATTERN,
  protectProductionCheckPostHogEvent,
  redactProductionCheckOfferCapabilities,
} from './src/production-check/analytics-privacy'

const projectToken = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN
const host = process.env.NEXT_PUBLIC_POSTHOG_HOST

if (!projectToken || !host) {
  if (process.env.NODE_ENV === 'development') {
    const missingVariable = !projectToken
      ? 'NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN'
      : 'NEXT_PUBLIC_POSTHOG_HOST'

    throw new Error(
      `${missingVariable} variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once ${missingVariable} is configured`,
    )
  }
} else {
  posthog.init(projectToken, {
    api_host: host,
    defaults: '2026-01-30',
    autocapture: {
      url_ignorelist: [PRODUCTION_CHECK_OFFER_URL_PATTERN],
    },
    before_send: (event) => protectProductionCheckPostHogEvent(
      event,
      globalThis.location?.href ?? '',
    ),
    capture_exceptions: true,
    debug: process.env.NODE_ENV === 'development',
    get_current_url: redactProductionCheckOfferCapabilities,
  })
}
