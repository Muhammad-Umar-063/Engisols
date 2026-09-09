# Production Check lead persistence

The Production Check funnel stores qualification and attribution separately from the public report experience. Scanner findings and scoring remain unchanged.

## Persistence flow

`POST /api/production-check/review` validates the low-friction intake, reloads the completed scan from server-side persistence, calculates a deterministic qualification score, saves the lead, and only then attempts the Resend notification. A provider failure leaves the durable lead intact and records the notification as failed so the request can be recovered without asking the visitor to submit again.

Production uses the existing Upstash Redis REST configuration. Scan records retain the existing `engisols:production-check:<report-id>` key shape; lead records use `engisols:production-check:lead:<lead-id>`.

## Retention

- Sanitized scans and shareable reports expire after 90 days.
- Lead records expire after 365 days.

The one-year lead window supports a normal B2B evaluation and delivery cycle while providing a finite deletion boundary. If Engisols adopts a shorter legal or privacy retention schedule, update `LEAD_RECORD_LIFETIME_MS` and the corresponding Upstash TTL together.

## Data boundaries

Lead records contain contact and qualification fields, the server-owned campaign attribution captured with the scan, and a sanitized aggregate scan summary. They do not contain raw HTML, JavaScript bundles, raw scanner internals, or finding evidence. Credential-like content is rejected before lead persistence. First-landing attribution is signed into a short-lived, tamper-evident token on the server; the scan endpoint verifies that token before storing attribution. Attribution is removed from scan data sent to public pages and status clients, but remains on the server-side scan record for lead creation.

Set `PRODUCTION_CHECK_ATTRIBUTION_SECRET` to a dedicated high-entropy value in production. If it is absent, the server uses the configured Upstash/KV REST token as the signing secret; development and tests use a local-only fallback.

Internal segments are stored as `nurture`, `maybe`, or `qualified`. Public API responses expose only the corresponding next-step contract: `report_guidance`, `launch_blocker_fix`, or `senior_engineer_review`.
