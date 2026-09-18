# Growth Copilot reconciliation export

`GET /api/internal/growth/outcomes` is a server-to-server, read-only export of
the same sanitized immutable envelopes used by webhook delivery. It never
returns lead contact details, submitted URLs, free text, evidence, operator
data, capability links, or credentials.

Authenticate with `Authorization: Bearer <GROWTH_COPILOT_EXPORT_TOKEN>`.
Ordinary browser requests are rejected. A distinct previous token may be
configured briefly during rotation; audit output records only `current` or
`previous`, never the credential or customer/event identifiers.

Query parameters:

- `since` and `until`: ISO timestamps. The default range is the previous 24
  hours and the maximum range is 31 days.
- `limit`: 1–500 envelopes; default 100.
- `cursor`: opaque signed continuation/checkpoint token returned by the prior
  page.

Pages are ordered by the immutable Redis ledger sequence. The first request
freezes a high-water mark, so events appended during pagination cannot move or
duplicate the current snapshot. `checkpointCursor` is safe to persist only
after the page is committed. `nextCursor` is non-null while that snapshot has
more records. Reusing a completed checkpoint establishes a new high-water mark
from the prior sequence, allowing late arrivals to be recovered without
replaying committed rows. Cursor signatures bind the time range and snapshot;
tampered or cross-range cursors are rejected.

Cursors use the Engisols-only
`GROWTH_COPILOT_EXPORT_CURSOR_SECRET` (with an optional `_PREVIOUS` overlap),
not the bearer token known to the consumer. This prevents an authenticated
client from forging its own checkpoint. The cursor signing secret is never
shared with Growth Copilot.

The endpoint is atomically rate-limited in Redis and fails closed if the
limiter or ledger is unavailable. The response contract is:

```json
{
  "schemaVersion": "engisols-growth-export/v1",
  "source": "engisols-production-check",
  "since": "2026-09-18T00:00:00.000Z",
  "until": "2026-09-19T00:00:00.000Z",
  "events": [],
  "deliveryHealth": {
    "asOf": "2026-09-19T00:00:00.000Z",
    "failed": 0,
    "deadLetter": 0
  },
  "checkpointCursor": "opaque",
  "nextCursor": null
}
```

`deliveryHealth` contains only current aggregate outbox counts. Redis maintains
bounded failed/dead-letter indexes as states change and removes expired members;
the export never scans or returns individual outbox records for this health view.

`GROWTH_COPILOT_EXPORT_TOKEN` must match Growth Copilot's
`ENGISOLS_EXPORT_TOKEN`. Use distinct preview and production values. Keep the
previous token only for a bounded rotation overlap, then remove it.
