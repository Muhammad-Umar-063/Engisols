# Campaign email delivery

The production-check engineering-review form and the AI App Audit scoping form send transactional email through the Resend HTTPS API. Neither depends on the visitor having a local email application, and provider credentials never reach the browser.

## Required production setup

1. Create a Resend account and verify an Engisols sending domain. Prefer a dedicated subdomain such as `updates.engisols.com` so transactional-mail reputation is isolated from the root domain.
2. Add these server-side environment variables to the deployment:

   ```text
   RESEND_API_KEY=re_...
   ENGISOLS_EMAIL_FROM=Engisols <hello@updates.engisols.com>
   ENGISOLS_EMAIL_TO=growth@engisols.com
   ```

   `ENGISOLS_EMAIL_TO` is optional and defaults to the site contact email. The API key and sender are required. Use `PRODUCTION_CHECK_REVIEW_FROM` / `PRODUCTION_CHECK_REVIEW_TO` or `AI_APP_AUDIT_INQUIRY_FROM` / `AI_APP_AUDIT_INQUIRY_TO` only when a funnel needs a different verified sender or recipient.
3. Redeploy after adding the variables, then submit one request from a completed production-check report and one from `/ai-app-audit`. Confirm both arrive at the review inbox and that Reply addresses the visitor.

4. Configure `PRODUCTION_CHECK_OPERATOR_SECRET` with at least 32 bytes of high-entropy random material. Scope-review notifications use it to create the expiring internal operator link; it must never use a `NEXT_PUBLIC_` prefix.

## Endpoints and safeguards

- `/api/production-check/review` reloads the report server-side so the browser cannot invent its verdict, finding counts, or campaign attribution. It saves a typed lead to Upstash before attempting delivery.
- `/api/ai-app-audit/inquiry` accepts only the four visible fields plus a honeypot.
- Both endpoints bound request bodies, reject unexpected keys and cross-origin browser submissions, use idempotency keys, apply an eight-second provider timeout, and suppress provider error details.

## Failure behavior

If the provider is unavailable or configuration is missing, the AI App Audit form keeps every entered value on screen and offers retry. The Production Check request remains saved as a durable lead and returns a successful delayed-notification state, so the visitor does not need to submit again. Neither form displays raw provider errors or credentials.
