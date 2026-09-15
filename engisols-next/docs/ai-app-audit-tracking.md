# AI App Audit tracking

`/ai-app-audit` is measured as a complete, privacy-bounded campaign funnel. The page uses the global PostHog and Meta Pixel integrations; a valid inquiry is also persisted and sent to Meta CAPI and Resend from the server.

## Funnel events

PostHog receives these explicit events in addition to its configured pageview, autocapture, and session-replay data:

| Event | When it fires | Allowed custom properties |
| --- | --- | --- |
| `ai_audit_viewed` | The campaign experience mounts | None |
| `ai_audit_inquiry_opened` | A header, hero, final, or mobile-dock CTA opens the form | `cta_location` |
| `ai_audit_inquiry_submitted` | A locally valid form starts its request | `cta_location` |
| `ai_audit_inquiry_sent` | The durable lead and inbox notification both succeed | `cta_location`, `notification`, `http_status` |
| `ai_audit_inquiry_delayed` | The lead is durable but inbox notification is delayed | `cta_location`, `notification`, `http_status` |
| `ai_audit_inquiry_failed` | Validation-independent request, attribution, or persistence delivery fails | `cta_location`, `http_status`, `error_code` |

The property allowlist drops names, emails, app details, concerns, attribution tokens, Meta event IDs, and any other unexpected values before PostHog capture. The inquiry and confirmation subtrees use PostHog's `ph-no-capture` boundary so autocapture and session replay cannot record the form or the rendered confirmation email; global replay configuration also explicitly masks all input values.

## Attribution and durable leads

The server page reads `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`, and `fbclid`, normalizes them, and signs them into a 24-hour first-touch token. The form returns that token rather than editable attribution fields. The inquiry route rejects missing, expired, or tampered tokens.

Each accepted inquiry becomes an `audit_lead_<id>` record in Upstash before Meta or Resend is attempted. Records retain the submitted contact/context, signed attribution, notification state, and Meta delivery state for 365 days. Identical submissions atomically reuse the same lead, email idempotency key, and Meta event ID. Production submissions fail safely when durable storage is unavailable; they are never sent to analytics or email first.

Notification delivery uses a 60-second lease. Concurrent retries return the saved delayed state while a fresh lease is active. A failed notification is immediately claimable, and a pending notification can be atomically reclaimed after the lease becomes stale, so an interrupted request or failed final-state save cannot strand a lead permanently. Reclaimed sends retain the original provider idempotency key and Meta event ID, and a persisted `sent` state cannot be downgraded by a late request.

## Meta conversion

A durable inquiry emits standard `Lead` in both the browser Pixel and server CAPI with the same deterministic event ID. A saved inquiry counts even when its inbox notification is delayed. Meta and browser local storage deduplicate retries.

CAPI uses only the shared allowlist: normalized SHA-256 email, valid `_fbp`/`_fbc`, trusted proxy IP, and bounded user agent when available and consent permits. It never receives the app/product field, concern text, UTM values, `fbclid`, attribution token, or raw email. The event source URL is always `/ai-app-audit` without query parameters.

## Required production configuration

Configure `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN`, `NEXT_PUBLIC_POSTHOG_HOST`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `ENGISOLS_ATTRIBUTION_SECRET`, `NEXT_PUBLIC_META_PIXEL_ID`, `META_DATASET_ID`, `META_CONVERSIONS_API_TOKEN`, `RESEND_API_KEY`, `ENGISOLS_EMAIL_FROM`, and `ENGISOLS_EMAIL_TO` in each production deployment. `PRODUCTION_CHECK_ATTRIBUTION_SECRET` remains a supported fallback for existing deployments. Meta failure does not block lead persistence or email; missing Upstash configuration does block production submission because no lead should be lost.

Before launch, verify one real ad-click journey in PostHog and Meta Test Events, confirm the browser/server `Lead` IDs match, repeat the same submission to confirm deduplication, and test both denied-consent and delayed-email paths.
