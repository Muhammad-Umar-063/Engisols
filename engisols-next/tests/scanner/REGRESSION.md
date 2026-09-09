# Scanner v1 live regression

Run the real production scanner sequentially so per-target CPU and memory metrics
are attributable to one target:

```bash
cd "/Users/mac/Documents/The Code Soars/Projects/Engisols/engisols-next"
npm run test:scanner:regression -- tests/scanner/regression-results-v1.1-final.json
```

The runner compiles the scanner, calls `scanPublicUrl()` without limit overrides,
and checkpoints the JSON report every 10 targets. It records wall time, CPU,
event-loop utilization, RSS/heap memory, response bytes, documents, scripts,
coverage limits, classifications, scores, and sanitized rule IDs. It never stores
finding evidence or credential material.

To inspect progress from another terminal:

```bash
jq '{runStatus, totals, runtime, aggregate}' tests/scanner/regression-results-v1.1-final.json
```

To exercise the production concurrency ceiling, use four workers. Per-target CPU
and memory then have `shared_process_overlap` scope; whole-run metrics remain useful.

```bash
SCANNER_REGRESSION_CONCURRENCY=4 npm run test:scanner:regression -- tests/scanner/regression-results-concurrency-4.json
```

## 2026-09-04 sequential baseline

- Corpus: 84 public URLs across Lovable (20), Bolt (20), Base44 (17), Replit
  (15), and v0 (12).
- Reachable and scanned: 61. Unavailable or stale: 23.
- Complete bounded scans: 26. Partial bounded scans: 35.
- Documents scanned: 84.
- JavaScript assets: 294 discovered, 198 scanned.
- Decoded bytes scanned: 38,901,008 (37.10 MiB).
- Findings: 488 total; 30 `by_design`, 458 `needs_proof`, 0 `actually_bad`.
- Whole-run wall time: 301.8 seconds.
- Whole-run CPU time: 3.85 seconds (1.27% of wall time).
- Event-loop utilization: 1.87%.
- Peak RSS: 85.31 MiB.
- Per-target wall time: p50 3.44 seconds, p95 8.10 seconds, max 12.02 seconds.
- Per-target CPU time: p50 40.85 ms, p95 96.31 ms, max 132.61 ms.

The result is network-wait dominated. The most important coverage case was a Bolt
app that exposed 96 script candidates. Scanner v1 stayed within its production
budget, scanned five, and labeled the result `partial` instead of implying full
coverage.

The client-facing report should not display the 488 findings as a flat list.
Repeated Supabase table references (155 observations) and missing-header checks
dominate the count. Group repeated observations by rule, show a small set of
actionable themes, and retain the partial-coverage disclosure.

## 2026-09-04 v1.1 final regression

- Corpus: the same 84 public URLs.
- Reachable and scanned: 60. Unavailable or stale: 24.
- Complete bounded scans: 18. Partial bounded scans: 42.
- Documents scanned: 85.
- JavaScript assets: 295 discovered, 203 scanned.
- Coverage confidence: 8 `strong`, 49 `partial`, 3 `limited`.
- Recommendation: all 60 reachable apps received `code_review`; none received
  a misleading production-ready conclusion.
- Client-facing finding groups: 1.50 per reachable app on average.
- Findings: 467 total; 32 `by_design`, 435 `needs_proof`, 0 `actually_bad`.
- Whole-run wall time: 234.4 seconds.
- Whole-run CPU time: 5.34 seconds (2.28% of wall time).
- Event-loop utilization: 2.48%.
- Peak RSS: 95.78 MiB.

For the 60 URLs reachable in both the original baseline and final run, v1.1
reduced aggregate target wall time from 277.6 to 206.4 seconds (25.6%), scanned
203 rather than 197 JavaScript assets, and scanned 85 rather than 83 documents.
The metadata phase made 51 requests and successfully scanned 30 documents. The
scanner now caps that entire phase, only follows an explicitly advertised
same-origin sitemap when robots did not already provide enough routes, reserves
time for bundles, and keeps a bounded script-candidate queue.

The reviewed build also marks known unsafe-route and unsafe-metadata omissions
as partial. This intentionally reduced the number of `strong` reports: strong
now means that all discovered, scan-relevant work within the passive scope was
processed, rather than merely that no request failed.

The legacy `score.readiness` field remains in the v1 contract for compatibility,
but it is only inverse observed public risk. Client reports should use
`assessment.exposure`, `assessment.coverage`, `assessment.productionProof`, and
`assessment.recommendation`. These distinguish “nothing critical was observed”
from “production controls were verified.”
