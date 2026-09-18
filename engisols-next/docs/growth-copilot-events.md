# Growth Copilot outcome events

Engisols publishes only sanitized, durable Production Check outcomes under
`engisols-growth-event/v1`. The producer supports `lead.created`,
`lead.segmented`, `scope_review.requested`,
`scope_review.decision_recorded`, `offer.created`, `offer.sent`,
`offer.accepted`, `offer.declined`, and `offer.expired`.
`payment.received` and `revenue.recorded` are reserved names and have no
producer. An accepted offer is not revenue.

Every envelope contains a stable opaque event ID, the original occurrence
time, fixed source `engisols-production-check`, analytical subject IDs,
bounded first-touch attribution, and a typed outcome. Money uses integer minor
units plus an uppercase ISO currency. Event identity includes the persisted
transition revision, so retries reuse one ID while a later decision receives a
new ID.

Allowed data includes internal lead IDs, keyed analytical scan/offer IDs,
scope-review IDs, segments, statuses, decisions, offer type/amount/currency,
builder, launch stage, timestamps, UTMs, and Meta campaign/ad-set/ad/placement
identifiers. Payload validation rejects unknown fields.

The boundary excludes names, email addresses, companies, submitted URLs,
free text, internal notes, scanner evidence, source-code details, operator
material, tokens, signed URLs, and public report/offer capabilities. Analytical
scan and offer IDs are versioned HMAC derivatives made with the dedicated
server-only `GROWTH_ANALYTICS_ID_KEY`; they cannot open a customer route.

PostHog uses the canonical funnel:

`landing viewed` → `scan_started` → `scan_completed` → `report_viewed` →
`scope_review_requested` → `lead_created` → `lead_qualified` → `offer_sent` →
`offer_accepted`.

Existing `scope_offer_viewed`, `scope_offer_approved`, and
`scope_offer_declined` events remain available through documented compatibility
mapping. Stable `$insert_id` values suppress rerender, remount, refresh, and
retry duplicates. Server-confirmed outcome capture is best effort and cannot
fail a customer workflow. QA traffic carrying `utm_source=meta_test` is kept
out of Meta CAPI and browser Pixel conversion emission.

The webhook secret must match Growth Copilot's `ENGISOLS_WEBHOOK_SECRET`; the
export token must match `ENGISOLS_EXPORT_TOKEN`. Use separate preview and
production values. During rotation, configure the receiver's current and
previous credential first, rotate the sender, drain the five-minute webhook
window and pending requests, then remove the previous value. Logs record only
credential-version labels.
