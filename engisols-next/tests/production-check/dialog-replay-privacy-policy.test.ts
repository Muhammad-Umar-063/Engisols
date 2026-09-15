import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const instrumentation = readFileSync('instrumentation-client.ts', 'utf8')
const privacy = readFileSync('src/production-check/analytics-privacy.ts', 'utf8')
const sheetModal = readFileSync('components/motion/SheetModal.tsx', 'utf8')
const booking = readFileSync('components/campaign/Booking.tsx', 'utf8')
const reviewIntake = readFileSync('components/production-check/CodeReviewIntake.tsx', 'utf8')
const findingExplorer = readFileSync('components/production-check/FindingExplorer.tsx', 'utf8')
const evidenceExplorer = readFileSync('components/production-check/ReportEvidenceExplorer.tsx', 'utf8')
const reportView = readFileSync('components/production-check/ReportView.tsx', 'utf8')
const reportActions = readFileSync('components/production-check/ReportActions.tsx', 'utf8')
const campaignAnalytics = readFileSync('src/campaign/analytics.ts', 'utf8')
const productionAnalytics = readFileSync('src/production-check/analytics.ts', 'utf8')
const routeCommit = readFileSync('components/analytics/PostHogRouteCommit.tsx', 'utf8')

test('shared dialog chrome and customer forms are replay-visible', () => {
  assert.doesNotMatch(sheetModal, /ph-no-capture|data-ph-sensitive-evidence/)
  assert.doesNotMatch(booking, /<form[^>]*(?:ph-no-capture|data-ph-sensitive-evidence)/)
  assert.doesNotMatch(reviewIntake, /<form[^>]*(?:ph-no-capture|data-ph-sensitive-evidence)/)
  assert.match(sheetModal, /data-ph-replay-visible="dialog-overlay"/)
  assert.ok((sheetModal.match(/data-ph-replay-visible="dialog"/g) ?? []).length >= 2)
})

test('global replay blocking targets sensitive leaves, never an ordinary customer popup', () => {
  assert.match(
    privacy,
    /POSTHOG_REPLAY_BLOCK_SELECTOR\s*=\s*'\[data-ph-sensitive-evidence\]'/,
  )
  assert.match(instrumentation, /blockSelector:\s*POSTHOG_REPLAY_BLOCK_SELECTOR/)
  assert.doesNotMatch(
    instrumentation,
    /blockSelector:\s*['"][^'"]*(?:dialog|modal|popup|form|role=)[^'"]*['"]/i,
  )
})

test('input shapes remain visible while values are globally masked and rendered evidence is targeted', () => {
  assert.match(instrumentation, /mask_all_text:\s*true/)
  assert.match(
    instrumentation,
    /autocapture:\s*{[\s\S]*?capture_copied_text:\s*false/,
  )
  assert.match(instrumentation, /session_recording:\s*{[\s\S]*?maskAllInputs:\s*true/)
  assert.doesNotMatch(
    instrumentation,
    /session_recording:\s*{[\s\S]*?maskAllText:\s*true/,
  )
  assert.match(instrumentation, /recordHeaders:\s*false/)
  assert.match(instrumentation, /recordBody:\s*false/)
  assert.doesNotMatch(booking, /ph-no-capture/)
  assert.doesNotMatch(reviewIntake, /ph-no-capture/)

  assert.match(booking, /data-ph-sensitive-evidence/)
  assert.ok((reviewIntake.match(/data-ph-sensitive-evidence/g) ?? []).length >= 5)
})

test('client-specific report evidence is blocked without hiding report controls', () => {
  assert.match(findingExplorer, /<article data-ph-sensitive-evidence/)
  assert.match(findingExplorer, /<button[\s\S]*?onClick=\{onClick\}/)
  assert.doesNotMatch(findingExplorer, /<button[^>]*data-ph-sensitive-evidence/)
  assert.ok((evidenceExplorer.match(/data-ph-sensitive-evidence/g) ?? []).length >= 5)
  assert.ok((reportView.match(/data-ph-sensitive-evidence/g) ?? []).length >= 6)
})

test('internal operator routes disable replay and redact all analytics URLs', () => {
  assert.match(privacy, /INTERNAL_PRODUCTION_CHECK_URL_PATTERN/)
  assert.match(privacy, /isInternalProductionCheckUrl/)
  assert.match(privacy, /if \(onInternalRoute\) return null/)
  assert.match(instrumentation, /disable_session_recording:\s*recordingDisabled/)
  assert.match(instrumentation, /posthog\.stopSessionRecording\(\)/)
  assert.match(instrumentation, /posthog\.startSessionRecording\(\)/)
  assert.match(instrumentation, /onRouterTransitionStart/)
  assert.match(instrumentation, /if \(!posthogConfigured\) return/)
  assert.match(routeCommit, /usePathname\(\)/)
  assert.match(routeCommit, /POSTHOG_ROUTER_COMMIT_EVENT/)
  assert.doesNotMatch(instrumentation, /framesRemaining|300/)
})

test('report capabilities never become analytics identifiers or Meta page views', () => {
  const properties = readFileSync('src/production-check/analytics-properties.ts', 'utf8')
  const metaBrowser = readFileSync('src/meta/browser.ts', 'utf8')
  const metaComponent = readFileSync('components/meta/MetaPixel.tsx', 'utf8')
  const metaNoscript = readFileSync('app/api/meta/page-view/route.ts', 'utf8')

  assert.match(privacy, /PRODUCTION_CHECK_REPORT_URL_PATTERN/)
  assert.match(privacy, /redactProductionCheckReportCapabilities/)
  assert.match(privacy, /redactProductionCheckScanCapabilities/)
  assert.doesNotMatch(properties, /['"](?:reportId|scan_id)['"]/)
  assert.match(metaBrowser, /isProductionCheckCapabilityUrl/)
  assert.match(metaComponent, /useSearchParams\(\)/)
  assert.match(metaNoscript, /isProductionCheckCapabilityUrl/)
})

test('fresh internal loads defer PostHog initialization until a public route commits', () => {
  assert.match(instrumentation, /let posthogInitialized = false/)
  assert.match(
    instrumentation,
    /if \(!projectToken \|\| !host\) {[\s\S]*?process\.env\.NODE_ENV === 'development'[\s\S]*?throw new Error\(/,
  )
  assert.match(
    instrumentation,
    /function initializePostHog\(recordingDisabled: boolean\): void {[\s\S]*?if \(posthogInitialized \|\| !projectToken \|\| !host\) return[\s\S]*?posthog\.init\(/,
  )
  assert.equal((instrumentation.match(/posthog\.init\(/g) ?? []).length, 1)
  assert.match(
    instrumentation,
    /addEventListener\(POSTHOG_ROUTER_COMMIT_EVENT, resumeReplayAfterPublicCommit\)[\s\S]*?if \(!isInternalProductionCheckUrl\(initialUrl\)\) initializePostHog\(false\)/,
  )
  assert.match(
    instrumentation,
    /function resumeReplayAfterPublicCommit\(\): void {[\s\S]*?if \(isInternalProductionCheckUrl\([\s\S]*?\)\) return[\s\S]*?initializePostHog\(true\)[\s\S]*?requestAnimationFrame\(\(\) => {[\s\S]*?requestAnimationFrame\(\(\) => {[\s\S]*?generation === replayNavigationGeneration/,
  )
})

test('business events and the Meta bridges remain intact', () => {
  assert.match(booking, /trackAiAppAudit\('inquiry_opened'/)
  assert.match(booking, /trackAiAppAudit\('inquiry_submitted'/)
  assert.match(booking, /trackAiAppAudit\(delivery === 'delayed' \? 'inquiry_delayed' : 'inquiry_sent'/)
  assert.match(reviewIntake, /trackProductionCheck\('scope_review_requested'/)
  assert.match(reportActions, /trackProductionCheck\('review_intake_opened'/)
  assert.match(reportActions, /trackProductionCheck\('scope_review_cta_clicked'/)
  assert.match(productionAnalytics, /'review_intake_opened'/)
  assert.match(productionAnalytics, /'scope_review_cta_clicked'/)
  assert.match(campaignAnalytics, /window\.dispatchEvent\(new CustomEvent\(AI_APP_AUDIT_META_EVENT/)
})

test('AI App Audit form links its legal disclosure without an embedded third-party UI', () => {
  assert.match(booking, /href="\/terms"/)
  assert.match(booking, /href="\/privacy"/)
  assert.doesNotMatch(booking, /<iframe\b/i)
  assert.doesNotMatch(reviewIntake, /<iframe\b/i)
})
