# Production Check Meta measurement

This integration adds one global Meta Pixel plus allowlisted event bridges for Production Check and AI App Audit. Lead and QualifiedLead server events use the Conversions API (CAPI) after the corresponding lead is durably saved. Scanner output, lead persistence, and notification delivery do not depend on Meta.

## Environment configuration

Set these values in each Vercel environment that should send Meta events:

```text
NEXT_PUBLIC_META_PIXEL_ID=1707563313639134
META_DATASET_ID=<dataset ID copied from Meta Events Manager>
META_CONVERSIONS_API_TOKEN=<server-only Events Manager token>
```

`NEXT_PUBLIC_META_PIXEL_ID` is intentionally public and is frozen into the client bundle at build time. `META_DATASET_ID` and `META_CONVERSIONS_API_TOKEN` are server-only and must not use the `NEXT_PUBLIC_` prefix.

The existing Pixel is `1707563313639134`. Meta often associates a Pixel and Dataset under the same identifier, but this code does not assume that relationship. Copy the Dataset ID shown for this data source in Events Manager into `META_DATASET_ID`.

For development or a staging deployment only, set:

```text
META_TEST_EVENT_CODE=TEST...
```

The server omits the test code whenever `NODE_ENV=production`, even if the variable was left configured. Missing or malformed Meta configuration makes tracking a no-op and does not affect the funnel.

## Event map

| Engisols action | Browser Pixel | Server CAPI | Notes |
| --- | --- | --- | --- |
| Meaningful route view | `PageView` | — | One initial event and one per pathname change. Query-only scan recovery does not add a view. |
| Successful scan creation | `ScanStarted` | — | Never fires on input or validation alone. |
| Persisted completed or partial scan | `ScanCompleted` | `ScanCompleted` | Browser and server share one stored event ID. |
| Durable review lead | standard `Lead` | standard `Lead` | Primary campaign conversion; persistence happens first. |
| Durable AI App Audit inquiry | standard `Lead` | standard `Lead` | Sent and delayed-notification inquiries count after persistence, with no form context in Meta. |
| Durable qualified lead | `QualifiedLead` | `QualifiedLead` | Separate event ID; never sent for maybe/nurture leads. |
| Booking | interface only | interface only | Use standard `Schedule` after a real booking integration exists. |
| Payment | interface only | interface only | Use standard `Purchase` after a successful payment exists. Reserved values are USD 499 and USD 1999. |

The Production Check bridge listens to `engisols:production-check` but accepts only `scan_started`, `scan_completed`, `scan_partial`, `lead_created`, and `lead_qualified`. The AI App Audit bridge listens to `engisols:ai-app-audit` and accepts only `inquiry_sent` and `inquiry_delayed`. Both require a server-issued, event-specific ID and do not forward event details or arbitrary internal analytics.

## Deduplication and retry behavior

Event IDs are deterministic SHA-256 projections of the durable scan or lead ID, namespaced by event name. The source IDs already contain non-sequential high entropy. IDs are stored on the corresponding scan or lead record before delivery:

- ScanCompleted uses `scancomplete_<32 base64url characters>`.
- Lead uses `lead_<32 base64url characters>`.
- QualifiedLead uses a different `ql_<32 base64url characters>` value.

The same exact ID is passed as Pixel `eventID` and CAPI `event_id`. Browser delivery records that ID in local storage to prevent repeat sends after a refresh; Meta's own event-name/event-ID matching provides cross-channel deduplication. An identical lead retry atomically reuses the existing lead and its event IDs.

Tracking timestamps are written without changing the absolute scan or lead expiry. Meta attempts occur after durable lead creation and before Resend. Meta failure is recorded as an analytics attempt but does not retry the lead, duplicate it, block Resend, or change the customer response.

## Data boundary

CAPI payloads are built from an allowlist. Depending on availability and consent, `user_data` can contain:

- email normalized with NFKC, trimmed, lowercased, and SHA-256 hashed once;
- the request IP address supplied by the trusted deployment proxy;
- the bounded request user agent;
- valid `_fbp` and `_fbc` identifiers.

When an `_fbc` cookie is absent and signed first-touch attribution contains a valid `fbclid`, the server derives `fb.1.<received-time-ms>.<fbclid>`. It never invents an fbc without a real click ID. Existing UTM and `fbclid` attribution remain unchanged and separately persisted.

Meta never receives scan findings, detected issues, source code, scanned app URLs, report content, builder answers, qualification scores, segment labels, shipping-context text, credentials, or raw customer email. Event source URLs are Engisols production-check URLs with credentials and fragments removed.

## Consent and privacy assumptions

There is currently no site-wide consent manager. For the initial United States-only campaign, tracking is enabled unless the browser sends Global Privacy Control or the first-party `engisols_meta_consent` cookie is `denied`. Both Pixel and CAPI use the same decision. The no-JavaScript PageView passes through a first-party endpoint so the same cookie and `Sec-GPC` decision can be checked before redirecting to Meta.

A future preference UI can call `setBrowserMetaConsent('granted' | 'denied')` from `src/meta/browser.ts`. This writes the first-party preference and emits the event that grants or revokes Pixel consent. Expanding campaigns beyond the United States requires a geography-specific legal/consent review before activation.

To disable all Meta tracking immediately, remove `NEXT_PUBLIC_META_PIXEL_ID`, `META_DATASET_ID`, and `META_CONVERSIONS_API_TOKEN`, then rebuild/redeploy. To disable it for one browser, set `engisols_meta_consent=denied` on `/` or use the exported helper.

## Failure and diagnostics

CAPI uses `https://graph.facebook.com/v26.0/<dataset-id>/events`, a five-second timeout, and no-store requests. Results expose only event name, event ID, HTTP status, and a valid Meta trace ID when available. Logs must never include the token, raw email, cookies, scanned URL, or report data. Network, configuration, validation, and non-2xx failures resolve as safe result values instead of throwing into the funnel.

The version and payload shape follow Meta's current official [Node Business SDK](https://github.com/facebook/facebook-nodejs-business-sdk), [web Pixel template](https://github.com/facebook/GoogleTagManager-WebTemplate-For-FacebookPixel), and [server-side CAPI template](https://github.com/facebookincubator/ConversionsAPI-Tag-for-GoogleTagManager). Recheck the Graph version against the current official SDK during routine dependency maintenance.

## Events Manager QA

1. In Meta Events Manager, select the data source associated with Pixel `1707563313639134` and copy its Dataset ID.
2. Generate a CAPI access token for that data source and add the server-only variables to a non-production deployment.
3. Open **Test events**, copy its code into `META_TEST_EVENT_CODE`, and redeploy the non-production environment.
4. Open `/production-check` with Meta Pixel Helper or browser network tools. Confirm one Pixel script and one PageView.
5. Start a real scan. Confirm one browser `ScanStarted`, then matching browser/server `ScanCompleted` rows with the same event ID when the persisted report completes.
6. Submit a completed report's review form. Confirm matching browser/server `Lead` rows with the same event ID. Use a qualified test case to confirm a separate `QualifiedLead`; verify maybe and nurture cases do not produce it.
7. Refresh the completed report and repeat an identical lead submission. Confirm the stored IDs are reused and no additional business action is counted.
8. Set `engisols_meta_consent=denied`, reload, and confirm Pixel/CAPI events stop while scanning, lead persistence, and Resend still work.
9. Remove `META_TEST_EVENT_CODE` before production. Verify production Events Manager diagnostics and event match quality after live traffic begins.

Before campaign launch, verify the dataset-to-Pixel association, domain ownership, Aggregated Event Measurement priorities, the Lead custom conversion/optimization configuration, production privacy review, and end-to-end attribution from an actual Meta ad click.
