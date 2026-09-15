# Legal and replay implementation review

Last reviewed: 15 September 2026

This document records the implementation behind the public legal pages and the PostHog replay privacy boundary. The Terms and Privacy Policy are operational business drafts. They still require review by qualified counsel and are not legal advice.

## Legal page architecture

- `/terms` and `/privacy` are the canonical, indexable global documents. Both use the shared Engisols site layout and `LegalDocument` component.
- The documents contain product-specific sections for the AI App Audit, Production Check, Engineer Scope Review, and scoped offers.
- The former `/ai-app-audit/terms` and `/ai-app-audit/privacy` paths permanently redirect to the global documents instead of maintaining duplicate policy text.
- The AI App Audit footer, Production Check landing page, report page, and scoped-offer page expose visible global Terms and Privacy links.
- Production Check places an authorization notice beside the scan action. The AI App Audit inquiry places a concise linked disclosure below its send action. Neither adds a mandatory checkbox.

## Disclosed data and providers

The Privacy Policy describes information entered voluntarily; Production Check targets, answers, sanitized reports, and share identifiers; scope-review concerns, access willingness, status, and offer decisions; campaign attribution; and browser/device context. It names the providers supported by the current implementation: Vercel, Upstash, Resend, PostHog, and Meta. It does not claim that a payment processor is integrated.

Application-record retention is documented from the constants used by storage:

- Sanitized scan and report records: 90 days.
- AI App Audit inquiry and Production Check lead records: 365 days.
- Engineer Scope Review and scoped-offer records: up to 365 days.
- Offer acceptance window: normally 30 days.
- Meta consent-choice cookie: 180 days.

These TTLs do not automatically delete copies already delivered through Resend, recipient inboxes, provider backups, or provider analytics accounts. Those systems have separate account and provider retention behavior.

## Missing-dialog root cause

The customer dialogs are rendered by the shared `SheetModal` as same-origin React portals attached to `document.body`; no customer popup uses an iframe. The portal architecture was not the fault, and the installed PostHog SDK supports the required replay controls.

The exact fault was overly broad element blocking. Both the entire AI App Audit `<form>` and its confirmation `<section>` carried `ph-no-capture`. PostHog therefore replaced each whole subtree in replay, hiding the dialog's labels, buttons, validation messages, and state changes along with the values it was intended to protect.

## Replay configuration before and after

| Control | Before | After |
| --- | --- | --- |
| Input values | `maskAllInputs: true` | `maskAllInputs: true` |
| Autocaptured element text | SDK default | Globally masked with `mask_all_text: true`; copied text capture disabled |
| Block selector | No explicit narrow replay selector; customer form/status used broad `ph-no-capture` roots | `[data-ph-sensitive-evidence]` only |
| Dialog shell | Hidden whenever its child form/status root was blocked | Portal, overlay, dialog, titles, labels, buttons, validation, and state transitions remain replay-visible |
| Network payload capture | Not explicitly disabled in local replay config | `recordHeaders: false`, `recordBody: false` |
| Internal operator routes | No route-wide replay stop | Fresh direct loads do not initialize PostHog; client navigation stops recording before render; PostHog drops every event from those URLs |
| Offer capability routes | Automatic capture already suppressed and URLs redacted | Existing suppression and URL redaction preserved |
| Report/active-scan capabilities | Raw report IDs could be properties and URLs could contain bearer tokens | Report IDs are excluded from event properties; report paths and `scanId` query values are redacted at the SDK boundary |
| Meta PageView on capability routes | Offer routes were suppressed | Offer, report, active-scan, and internal operator routes are suppressed in both browser and noscript PageView paths |

Input elements intentionally do not use `ph-no-capture`: their geometry, labels, focus, validation state, and clicks need to remain useful in replay, while `maskAllInputs: true` masks their values. Rendered personal data in success states and client-specific report/evidence text uses `data-ph-sensitive-evidence` so only those leaf areas are blocked.

## Areas that remain blocked

- Rendered inquiry email addresses and delivery messages.
- Scope-review email, review identifiers, target URL, verdict, recommendation, and response message.
- Production Check report target URLs, verdicts, recommended actions, selected finding details, technology/coverage evidence, source-proof details, and builder handoff content.
- Internal operator/review pages as a whole, including operator capability URLs, tokens, and internal notes.
- PostHog funnel properties continue to use allowlists. Names, emails, company/app details, free text, attribution tokens, report IDs, raw evidence, internal notes, operator tokens, and Meta deduplication event IDs are excluded.

Customer dialog containers and controls are not block-selected. If a future dialog embeds a cross-origin iframe, ordinary replay cannot observe the iframe document; this implementation does not attempt to bypass browser cross-origin protections. The surrounding Engisols container can remain observable.

## Code-to-policy audit

| Policy statement | Supporting implementation |
| --- | --- |
| Reports are retained for 90 days | `SCAN_RECORD_LIFETIME_MS` and `SCAN_RECORD_TTL_SECONDS` in `src/production-check/config.ts`, consumed by `src/production-check/store.ts` |
| Leads, scope reviews, and offers are retained for up to 365 days | `LEAD_RECORD_LIFETIME_MS`, `SCOPE_REVIEW_RECORD_LIFETIME_MS`, and `SCOPE_OFFER_RETENTION_MS` in `src/production-check/config.ts` |
| Input values are masked in replay | `session_recording.maskAllInputs: true` in `instrumentation-client.ts` |
| Sensitive rendered evidence is blocked | `POSTHOG_REPLAY_BLOCK_SELECTOR` plus `data-ph-sensitive-evidence` markers in inquiry, review, and report components |
| Internal operator pages do not reach PostHog | route detection and event suppression in `src/production-check/analytics-privacy.ts`; initial and navigation replay controls in `instrumentation-client.ts` |
| Meta Pixel and Conversions API are used | `components/meta/MetaPixel.tsx`, `src/meta/browser.ts`, and `src/meta/capi.server.ts` |
| A denied choice or Global Privacy Control suppresses Engisols-initiated Meta events | `src/meta/consent.ts`, `src/meta/browser.ts`, CAPI routes, and the noscript PageView route |
| Raw fetched pages and bundles are not persisted in scan records | scan projection and redaction in `src/production-check/report.ts`, persistence validation, and store tests |
| Inquiry and funnel event properties exclude customer text | allowlists in `src/campaign/analytics-properties.ts` and `src/production-check/analytics-properties.ts` |
| Report bearer capabilities do not reach analytics | URL sanitizers and property allowlists in `src/production-check/analytics-privacy.ts` and `src/production-check/analytics-properties.ts`; Meta PageView suppression in browser and noscript paths |
| Approval is not payment | scope-offer decision code records accepted/declined status and has no checkout or commerce event |

The raw-content safety checks are defensive pattern checks, not a guarantee that no novel credential format could ever pass. The public policy therefore describes design intent and controls rather than promising absolute prevention.

## QA record

- Contract tests cover canonical legal routes, product/footer links, authorization disclosure, provider/retention wording, replay selectors, masked inputs, sensitive report blocking, internal-route exclusion, and preserved funnel events.
- Fresh localhost tabs were created after a clean development-server restart; historical recordings were not used. Both the Production Check scope-review dialog and AI App Audit dialog rendered a replay-visible portal, overlay, shell, headings, labels, controls, and validation state. Neither form nor any input matched the replay block selector. The scope dialog exposed nine field controls outside blocked leaves, and close/reopen returned it from a 400-pixel test scroll to scroll position zero.
- PostHog debug telemetry in those fresh tabs reported active session recording, one expected dialog-open business event for each flow, and new `$snapshot` batches (two observed for Production Check and four for AI App Audit during the bounded checks). The generic typed QA name/email strings did not appear in PostHog logs. No PostHog errors or warnings occurred on the public dialog sessions.
- A fresh direct load of `/internal/production-check/...` left the PostHog browser global undefined and emitted no external PostHog initialization, flags, capture, or replay request. The application bundle still contains the statically imported PostHog module, but the SDK does not initialize on the private document.
- Fresh report and active-scan capability loads were inspected by decompressing the outgoing PostHog request bodies. Neither the raw report path ID nor the raw `scanId` appeared; the payloads contained `/production-check/report/redacted` and `scanId=redacted`. Neither route loaded a Meta browser resource.
- The development report fixture retained `data-ph-sensitive-evidence` on its target, verdict, recommended action, finding details, and evidence views. The dialog itself contained two targeted sensitive rendered-data leaves while leaving all nine field controls outside the block selector.
- Desktop and mobile screenshots are stored in `docs/screenshots/legal-replay/`. Both legal pages rendered the update date with no horizontal overflow at 1280/1440-class desktop and 390-pixel mobile widths.

## Attorney and operational review required

Counsel and the business owner should resolve these facts before treating the drafts as launch-approved:

- Contracting/legal entity name, controller identity, postal/privacy contact, registration details, governing law, and venue.
- Lawful basis and consent behavior for PostHog replay/error capture and Meta measurement in each target geography; Meta currently defaults to granted unless GPC or a stored denial is present, and the site does not currently expose a preference UI.
- Whether report capability links, scope identifiers, and offer approval links need additional access, revocation, or disclosure controls. Operator links expire after seven days but are not currently single-use or independently revocable.
- Provider regions, subprocessors, data-processing agreements, account retention, backups, and deletion workflows for Vercel, Upstash, Resend, PostHog, Meta, and recipient inboxes.
- Reconcile the separate paid-audit marketing claims about seven-day versus thirty-day code deletion, and verify encryption, NDA, sharing, and no-training claims operationally.
- Scan authorization, third-party misuse, rate limits, signed-link handling, takedown, security incident, and abuse-response procedures.
- Privacy-rights procedure, children/age positioning, targeted-advertising classification, offer formation, payment/refund mechanics, liability enforceability, intellectual-property terms, and case-study permissions.
