# Scanner v2 ideas discovered during Step 2

These ideas are deliberately not implemented in the live-scan/report work.

- Emit confirmed framework signals (Next.js, Nuxt, Vite, React, Vue) from deterministic manifest and runtime markers so the report can show more than integration technologies.
- Separate discovery coverage by initial, linked-route, framework-manifest, and runtime-only surfaces; make the missing runtime surface explicit.
- Add browser-assisted route/chunk discovery in an isolated, strictly passive worker, with a separate budget and no form submission or API replay.
- Add deterministic builder-confidence signals for Lovable, Bolt, v0, Replit, and Base44; never infer a builder from generic Vite/React output alone.
- Reserve fixed deadline and byte budgets for primary application bundles before metadata and linked-route fallbacks.
- Replace repeated candidate sorting with a bounded top-K queue and retain overflow coverage counts.
- Add source-map presence and exposure checks without downloading or parsing source maps in v1-sized scans.
- Expand hardcoded webhook patterns using capability semantics while preserving conservative classification.
- Calibrate report usefulness against a controlled, versioned corpus rather than comparing drifting public targets.
- Keep public exposure, evidence coverage, and production proof as separate axes; never revive inverse risk as a readiness claim.
