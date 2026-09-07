# Production Check Step 2 implementation plan

## Scope

Build the interactive Scanner v1.1 run experience and founder-facing, shareable report. Scanner v2 rules, marketing redesign, lead automation, payments, scheduling, CRM, authentication, and admin tooling remain out of scope.

## Architecture decisions

- Scanner remains framework-independent in `src/scanner` and gains an optional backwards-compatible progress observer.
- `POST /api/scans` creates a high-entropy public ID and schedules the bounded scan with Next.js `after()`.
- Clients poll `GET /api/scans/[scanId]/status` approximately once per second. Polling is deliberately chosen over SSE for reconnect behavior on Vercel and the scanner's short maximum duration.
- Persist only sanitized structured state through a `ScanStore` interface. Production uses Upstash Redis REST when configured; development and tests use a process-local adapter and clearly report that limitation.
- Records expire after seven days. Answers and progress use independent fields so concurrent updates do not overwrite one another.
- The report renders Scanner v1.1 classifications as FIX NOW, REVIEW, and EXPECTED. It leads with exposure, coverage, and production-proof gaps; the deprecated inverse-risk readiness number is not presented as proof that an app is production-ready.

## Implementation units

1. Add `ScanPhase` and `ScanProgressEvent` contracts plus optional scanner observer; verify real phase order and bundle counters.
2. Add sanitized report projection, defensive secret guard, high-entropy IDs, deterministic report model, and expiring persistence adapters.
3. Add scan create/status/answer APIs with friendly public errors and no-store responses.
4. Add `/production-check` URL entry and live polling state on the same route, keyed by an unlisted `scanId` query parameter for reconnectability.
5. Add `/production-check/report/[scanId]` with summary buckets, prioritized findings, trust limitations, stack, builder prompt, copy actions, and commercial CTAs.
6. Add deterministic demo records for healthy-ish, review-heavy, critical, partial, and failed states.
7. Verify focused tests, the complete Scanner v1.1 suite, lint, build, static premium audit, and rendered mobile/desktop states.

## Expected files

- `src/scanner/{types,scan,index}.ts`
- `src/production-check/**`
- `app/api/scans/**`
- `app/production-check/**`
- `components/production-check/**`
- `tests/{scanner,production-check}/**`
- `tsconfig.scanner-tests.json`, `package.json`, `app/globals.css`
- `DESIGN.md`, `SCANNER_V2_IDEAS.md`

## Assumptions

- Vercel remains the production host and supports Next.js `after()` through `waitUntil`.
- Production will be configured with `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` (or Vercel's compatible KV REST names) before public launch.
- Public report links are unlisted bearer links, not indexed, and expire after seven days.
- Qualification answers are optional and do not alter findings or score.
