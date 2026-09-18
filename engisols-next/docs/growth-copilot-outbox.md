# Growth Copilot outcome outbox

Engisols commits each sanitized business outcome to the same Redis Lua
transition that commits the underlying lead, review, or offer state. Customer
requests never call Growth Copilot synchronously. A Next.js `after()` task may
try a small batch after the response, while the hourly GitHub Actions workflow
is the recovery path.

Outbox records contain only an event ID, state, attempt count, lease/retry
timestamps, and a safe error category. They never contain webhook credentials.
The states are `pending`, `delivering`, `delivered`, `failed`, and
`dead_letter`. Claims use a one-minute lease; stale claims return to retry, and
failures back off from 30 seconds to six hours for at most eight attempts.
Terminal 4xx responses dead-letter immediately. HTTP 408/425/429, timeouts,
network failures, and 5xx responses remain retryable. Delivered and
dead-letter records remain in the immutable ledger for reconciliation.

Webhook requests use the exact serialized event bytes. Each attempt generates
a fresh Unix timestamp and `v1=` HMAC-SHA256 hex digest of
`timestamp + "." + rawBody`. The receiver gets `X-Engisols-Event-Id`,
`X-Engisols-Timestamp`, and `X-Engisols-Signature`. Production URLs must use
HTTPS, redirects are rejected, and response bodies are never logged.

`POST /api/internal/growth/outbox` requires the dedicated cron bearer secret,
supports a current/previous rotation overlap, uses a Redis-backed distributed
rate limit, reclaims stale leases, materializes due offer expirations, and
delivers a bounded batch. Its response contains aggregate counts only.

Production activation requires evidence that Redis eviction is disabled and
capacity headroom is sufficient; set `GROWTH_REDIS_DURABILITY_VERIFIED=true`
only after that check. Configure repository secrets `GROWTH_OUTBOX_URL` (the
full internal route URL) and `GROWTH_COPILOT_OUTBOX_CRON_SECRET`. The scheduled
workflow runs hourly at minute 17 and can also be dispatched manually after it
has landed on the default branch. Each run invokes the bounded cron route,
waits 55 seconds, and invokes it once more. The first timed-out delivery wakes
a sleeping Render Free service; the second can claim the 30-second retry while
Render is warm. This is bounded recovery, not artificial keep-alive traffic.
