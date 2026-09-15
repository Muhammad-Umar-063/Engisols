import posthog from 'posthog-js'

import {
  INTERNAL_PRODUCTION_CHECK_URL_PATTERN,
  POSTHOG_REPLAY_BLOCK_SELECTOR,
  POSTHOG_ROUTER_COMMIT_EVENT,
  PRODUCTION_CHECK_OFFER_URL_PATTERN,
  isInternalProductionCheckUrl,
  protectPostHogEvent,
  sanitizePostHogUrl,
} from './src/production-check/analytics-privacy'

const projectToken = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN
const host = process.env.NEXT_PUBLIC_POSTHOG_HOST
const posthogConfigured = Boolean(projectToken && host)
const initialUrl = globalThis.location?.href ?? ''
let posthogInitialized = false
let replayNavigationGeneration = 0

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
  globalThis.addEventListener(POSTHOG_ROUTER_COMMIT_EVENT, resumeReplayAfterPublicCommit)

  // The initial document is already committed. Internal documents must not
  // initialize PostHog because its first /flags request includes the page URL.
  if (!isInternalProductionCheckUrl(initialUrl)) initializePostHog(false)
}

function initializePostHog(recordingDisabled: boolean): void {
  if (posthogInitialized || !projectToken || !host) return

  posthog.init(projectToken, {
    api_host: host,
    defaults: '2026-01-30',
    disable_session_recording: recordingDisabled,
    mask_all_text: true,
    autocapture: {
      capture_copied_text: false,
      url_ignorelist: [
        PRODUCTION_CHECK_OFFER_URL_PATTERN,
        INTERNAL_PRODUCTION_CHECK_URL_PATTERN,
      ],
    },
    session_recording: {
      maskAllInputs: true,
      blockSelector: POSTHOG_REPLAY_BLOCK_SELECTOR,
      recordHeaders: false,
      recordBody: false,
    },
    before_send: (event) => protectPostHogEvent(
      event,
      globalThis.location?.href ?? '',
    ),
    capture_exceptions: true,
    debug: process.env.NODE_ENV === 'development',
    get_current_url: sanitizePostHogUrl,
  })
  posthogInitialized = true
}

/**
 * Stop before an internal navigation can render customer/operator evidence.
 * When leaving an internal route, wait until the public URL has committed and
 * two animation frames have passed so the outgoing private DOM is not included
 * in the new recording. Calling start without overrides preserves project-side
 * replay sampling and trigger rules.
 */
export function onRouterTransitionStart(url: string): void {
  if (!posthogConfigured) return

  replayNavigationGeneration += 1
  if (isInternalProductionCheckUrl(url)) {
    if (posthogInitialized) posthog.stopSessionRecording()
    return
  }

  if (
    posthogInitialized &&
    !isInternalProductionCheckUrl(globalThis.location?.href ?? '')
  ) {
    if (!posthog.sessionRecordingStarted()) posthog.startSessionRecording()
    return
  }

  // The root route observer resumes recording once the destination DOM has
  // committed. Until then, keeping recording stopped protects the outgoing
  // internal page even when a navigation is slow or cancelled.
}

function resumeReplayAfterPublicCommit(): void {
  const generation = replayNavigationGeneration
  if (isInternalProductionCheckUrl(globalThis.location?.href ?? '')) return

  // A fresh internal load reaches initialization only after a public DOM has
  // committed. Start disabled so the outgoing private DOM remains protected
  // until the same two-frame barrier used by initialized navigations passes.
  initializePostHog(true)

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      if (
        generation === replayNavigationGeneration &&
        posthogInitialized &&
        !isInternalProductionCheckUrl(globalThis.location?.href ?? '')
      ) {
        posthog.startSessionRecording()
      }
    })
  })
}
