# Production Check engineer scope review

## Why the human layer exists

Scanner v1.1 is a conservative public-surface diagnostic. It can quickly identify supported public signals and state what it could not verify, but it cannot prove database policies, server-side authorization, private API behavior, internal architecture, source quality, deployment configuration, or operational readiness.

The engineer scope review supplies that missing application context. Its purpose is to determine whether uncertain items matter for this application and to recommend the smallest sensible next step. “No paid work” is a valid, important outcome.

## Funnel

```text
Production Check → report → free engineer scope check → human decision
  → no paid work
  → needs information
  → scoped Launch Blocker Fix
  → scoped Production Harden
  → ongoing engineering
  → custom scope
```

The report never turns a `maybe` qualification into an automatic $499 recommendation. Paid work is shown only after an Engisols operator validates and writes a specific scope.

## Scope review intake and state

The existing review intake remains the one place where a founder supplies contact, launch stage, help intent, and timeline. The same submission adds only:

- one main concern;
- an optional short concern detail; and
- willingness to provide limited technical access or screenshots after review.

It never requests repository access, passwords, credentials, or secrets. A deterministic, high-entropy `scope_…` ID binds one scope review to the existing durable lead and scan. Identical submissions atomically reuse both records.

Review states are `pending_review`, `needs_information`, `no_paid_work`, `offer_prepared`, `offer_sent`, `accepted`, and `declined`. Decisions are `no_paid_work`, `needs_information`, `launch_blocker_fix`, `production_harden`, `ongoing_engineering`, and `custom`.

The lead and scope-review records are retained for 365 days. Scope reviews contain sanitized scan aggregates, not raw HTML, JavaScript, secrets, credentials, or raw scanner evidence.

## Qualification scoring

Qualification is deterministic, isolated in `src/production-check/qualification.ts`, and intentionally weights commercial maturity and intent more heavily than scanner output.

| Signal | Value | Points |
| --- | --- | ---: |
| Launch stage | experimenting / preparing / users / payments | 0 / 2 / 3 / 4 |
| Help intent | verify / plan-or-fix / ongoing engineering | 0 / 3 / 4 |
| Timeline | exploring / quarter / month / now | 0 / 1 / 2 / 3 |
| Domain | custom production domain | 1 |
| Scanner | FIX NOW / otherwise REVIEW / neither | 2 / 1 / 0 |

Segments are `0–3 nurture`, `4–8 maybe`, and `9+ qualified`. Segment labels remain server-only. Public responses expose `report_guidance` or `engineer_scope_check`; neither is an offer.

## Operator workflow and signed-link security

There is no pre-existing authenticated staff area. A scope-review request therefore emails the internal Engisols inbox an expiring HMAC-SHA-256 link signed with `PRODUCTION_CHECK_OPERATOR_SECRET`. The token is bound to the scope-review ID, server-validated, tamper resistant, and valid for seven days.

The access route exchanges the query token for a `Secure`, `HttpOnly`, `SameSite=Strict`, review-path-scoped cookie, then redirects to a URL without the token. Mutation requests also require a matching same-origin `Origin`. The operator secret is never imported by a Client Component. Operator pages are no-index and marked out of PostHog capture; neither token nor internal notes are sent to Meta or PostHog.

The operator sees lead contact, sanitized app/report context, maturity and intent answers, concern, scan counts, and sanitized public finding titles. Exactly one outcome can be selected. Internal notes remain on the scope review and are never copied into a customer offer.

Configure a random secret of at least 32 bytes in every deployed environment:

```text
PRODUCTION_CHECK_OPERATOR_SECRET=<high-entropy server-only secret>
```

Rotating the secret invalidates outstanding operator links. Submit a new request or resend a newly generated internal notification after rotation.

## Human outcomes

- **No paid work:** email states that nothing currently justifies a paid engagement, gives a brief explanation/monitoring direction, and suggests re-scanning after material changes.
- **Needs information:** email states exactly which screenshots or limited read-only evidence are needed and warns against sending passwords or credentials.
- **Paid scope:** operator supplies the recommendation, exact included items, exclusions, delivery window, and editable server-side price before the offer is emailed.

Known defaults are $499 one-time for Launch Blocker Fix, $1,999 one-time for Production Harden, and $2,000/month for Production Engineering. Launch Blocker Fix accepts at most three specifically agreed blockers. Custom title, value, and billing are supported.

## Offer model and customer flow

Offers use non-sequential `offer_…` public IDs and store the review, lead, and scan IDs; type; title; summary; exact inclusions and exclusions; USD price; billing model; delivery window; status; timestamps; and delivery notification state. Raw scanner evidence is not duplicated. An offer is valid for 30 days and retained for 365 days for operational history.

`/production-check/offer/[offerId]` shows the recommendation, exact work, exclusions, delivery, and server-owned price. Draft offers are not publicly rendered. The customer may approve or decline. The decision endpoint accepts only `{ action: "approve" | "decline" }`; browser-supplied price or scope fields are rejected.

Approval changes only the offer/review state to `accepted` and notifies Engisols. It does not create a payment, mark anything paid, fire Meta `Purchase` or `InitiateCheckout`, or start checkout. The confirmation says payment and onboarding instructions will follow separately.

## Email delivery and failure behavior

Resend remains the transport. Initial requests are persisted before the internal notification. Human decisions and offers are persisted before customer email. A Resend failure leaves the scope review and any prepared offer intact, records delayed/failed delivery state, and supports an idempotent retry.

## Analytics

PostHog product events are:

- `scope_review_cta_clicked`
- `scope_review_requested`
- `scope_review_confirmation_viewed`
- `scope_offer_viewed`
- `scope_offer_approved`
- `scope_offer_declined`
- `scope_more_info_requested` (reserved for a future customer evidence-response surface)

PostHog properties are allowlisted to `scan_id`, `scope_review_id`, `offer_type`, `offer_amount`, `currency`, `launch_stage`, `builder`, and `lead_segment`. Email, name, company, free text, app URL, scanner evidence, internal notes, and operator tokens are dropped before capture.

Meta Lead and QualifiedLead behavior is unchanged. Scope-review and offer actions do not produce Meta commerce events.

## Future payment integration

Payment remains deliberately out of scope. A future server-owned integration may implement `startCheckout(offerId)` only after loading an accepted, unexpired offer and deriving price/currency from persistence. No client-supplied amount should cross that boundary.
