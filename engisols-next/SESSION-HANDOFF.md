# Engisols site — session handoff

Paste this into a new session before asking for more work. It covers what was
built, the decisions that are easy to accidentally undo, the bugs already found,
and what is still open.

**Project:** `/Users/umarmehboob/Downloads/Engisols /engisols-next`
(note the space in the parent folder name — quote paths in shell commands)
**Stack:** Next.js 16.3.4 App Router, React 19, TypeScript, Tailwind v4, Motion 13, Lenis 1.3
**Dev server:** already running on `http://localhost:3001`

## The three specs that govern this repo

| File | Governs |
|---|---|
| `engisols-build-spec (4).md` | Locked technical decisions, palette, motion rules, homepage section table, launch gates |
| `engisols-content-spec.md` | Every page, every section, what content belongs in it |
| `engisols-animation-spec.md` | Per-scene animation values (numbered sections referenced in code comments) |

These are authoritative. Code comments cite them by section number (e.g. "spec
2.3", "build spec section 7"). Do not re-litigate a locked decision without
saying so out loud.

---

## What this session did, in order

1. **Adapted Motion source drops** the user pasted (they have Motion+; the MCP
   is not installed, so source arrives as chat pastes):
   - `scroll-zoom-hero` → `ZoomHeroScene.tsx`
   - `footer-reveal` → `FooterReveal.tsx` (replaced a CSS-only version)
   - `scroll-text-lines` + `ticker` → `ScrollTextLines.tsx`, `VelocityTicker.tsx`, `lib/ticker-math.ts`
   - `ios-pointer` → `Cursor.tsx`, `Magnetic.tsx`, `cursor-registry.ts`, `use-pointer.ts`, `lib/magnetic.ts`
2. **Added page-level smooth scrolling** with Lenis, at the user's request, tuned
   by the user to `lerp: 0.070`.
3. **Built the whole site** from the content spec: 34 pages, every template.

---

## Conventions established — follow these

**Motion source workflow.** Pasted example code is saved verbatim in
`motion-source/` before adaptation. Files there ARE type-checked by the build, so
a source that imports a module we do not have is saved as `.md` instead of
`.tsx` (see `scroll-text.md`, `ios-pointer.md`). `motion-source/README.md` tracks
which slugs have landed and which are still needed.

**`lib/motion.ts` is the only place physics live.** It exports both house-style
constants (`EASE`, `DUR`, `SHIFT`, `STAGGER`) and lowercase aliases named exactly
as Motion's examples import them (`ease`, `duration`, `offset`, `spring`,
`smoothScroll`) so a raw paste compiles unedited.

**Every page is composed of `<Band>`** (`components/layout/Band.tsx`), which owns
ground colour, section padding, `data-ground` (read by the cursor and header) and
the `on-dark` class. `BandHeading` and `Blocked` live there too.

**Shared page blocks are in `components/sections/shared.tsx`** — `PageHero`,
`CTABlock`, `FAQAccordion`, `CaseStudyGrid`, `RelatedWork`, `ProofStrip`,
`TeamRow`, `ScanCapture`, `Booking`, plus primitives (`StepList`, `SplitList`,
`DataTable`, `CheckList`, `Prose`). All server components. A per-page copy of any
of them is a bug.

**Content is separate from components.** `content/services.ts`,
`industries.ts`, `compare.ts`, `pages.ts` are DEMO copy with warning headers.
`content/case-studies.ts` is REAL and verified — never replace its figures.

**Blockers render on the page**, they are not hidden in comments. `{{TODO: …}}`
markers and `demo figure` tags are visible so they get resolved.

---

## Decisions that look like mistakes but are not

- **`ScrollTextLines` is the horizontal marquee**, not the stall effect. Motion's
  own source says so explicitly. The stall's per-line opacity scrub was renamed
  `ScrollLineHighlight.tsx`.
- **`Ticker.tsx` and `VelocityTicker.tsx` are different components.** `Ticker` is
  a CSS marquee and a SERVER component because it sits in the hero, above the
  fold, where the spec bans the animation library. Do not merge them.
- **The marquee is on `/services`, not the homepage.** The homepage is locked at
  12 sections; it would have been a thirteenth.
- **Cursor covers links, not buttons.** `data-cursor="link"` → pill-shaped cover
  (a plain link temporarily wears a button). `data-cursor="target"` → takes the
  element's own box. Buttons use `<Magnetic snap={false}>`: they lean toward the
  pointer but the cursor stays a dot. This was an explicit user instruction.
- **Cursor fill is 90% free / 22% snapped**, deviating from spec 2.3's single 90%.
  At 90% the snapped shape painted out the primary CTA's label.
- **Footer padding is `py-step-6`, not `band`** — the only place on the site that
  does not take the 160px desktop band. At 160px the footer measured 817px and
  the reveal (which stands down when the footer is taller than the viewport)
  was dead on every laptop. User approved the trade.
- **Four industry pages are `noindex`** and render a blocker instead of borrowing
  case studies. Only `legal` and `saas` have real evidence.
- **`ClientQuote` is absent** from the case study template — spec says omit rather
  than use an unattributed quote.
- **`/scan/results/{id}` was deliberately not built.** The spec calls it a product
  needing its own technical spec and warns against building it as a marketing page.

---

## Bugs found in the pasted Motion source, already fixed

Worth knowing because the same source may be pasted again:

1. **`magnetic.tsx`: `{ ...someDOMRect }` is `{}`.** DOMRect properties are
   accessors on the prototype, so the spread dropped `width`/`height`, the centre
   computed to `NaN`, and the magnetic pull never moved anything. The
   `as DOMRect` cast is what hid it from the compiler.
2. **`ticker.tsx`: `moveBy += heading * moveBy * |factor|` squares the heading**,
   so the scroll boost came out positive for every row regardless of direction.
   Rows with `direction: -1` reversed under fast scrolling and the stack
   collapsed into one direction. Fixed by scaling magnitude, leaving sign alone.
3. **Motion does not clear a style property you stop passing** — it leaves the
   last value inline. Gating a `filter` by dropping the key does nothing; it has
   to be explicitly set to `'none'`.

## Traps that cost time this session

- **rAF is throttled in occluded/background Chrome windows.** Scroll-linked
  values freeze and look like a broken implementation. Launch test browsers with
  `--disable-backgrounding-occluded-windows --disable-renderer-backgrounding
  --disable-background-timer-throttling`.
- **`overflow: hidden|clip|auto|scroll` on any ancestor breaks `position: sticky`
  descendants** — silently. The hero pin and the footer reveal both depend on
  sticky. Clip on the element itself, never above it. `globals.css` carries a
  warning about never adding overflow to `html`/`body`.
- **With Lenis running, `window.scrollTo` fights the scroller** when it is
  mid-smooth-scroll. In tests, wheel events or wait-for-idle, not `scrollTo`.
- **Lenis's CSS sets `html { height: auto }`**, which is why `<body>` is
  `min-h-dvh` and `<html>` no longer has `h-full`.
- **`SheetModal` must call `lockPageScroll()`** — `body { overflow: hidden }` no
  longer locks anything, because Lenis sets scroll position programmatically.

## How work was verified

Not by eyeballing. Headed Chrome over CDP on port 9223, measuring computed
styles and rects at real scroll positions (`Input.dispatchMouseEvent`, wheel
events, `DOMMatrixReadOnly` on transforms), plus headless on 9222 for
mobile/reduced-motion matrices. Claims in this session are measured, not assumed.
Continue that standard.

---

## Open items, in the order I would do them

**Three genuine spec violations, all cheap:**

1. **Lenis is banned by name** in build spec section 2 ("No GSAP, no Lenis, no
   smooth-scroll hijacking"). The user asked for it and tuned it. UNRESOLVED —
   either amend the spec or remove it. This needs a decision before more work.
2. **Homepage §8 "How we work" is `bordeaux`, spec says `--vanilla`.** This also
   puts the homepage at four dark bands against a hard limit of three.
3. **`/services` uses a middle-dot meta string** (`{shape} · from {price}`), a
   banned typographic pattern.

**Also flagged:** the marquee's greige separator and outline stroke sit on
vanilla at 2.05 contrast; spec says greige is "surface and borders only, never
text".

**Required at launch, not built:** `sitemap.ts`, `robots.ts`, Organization +
Service JSON-LD, OG/Twitter images per route, 301 redirects from old URLs, the
crawlability CI gate, and a canonical tag on the homepage (18 of 19 pages have
one).

**Structural gaps:** breadcrumbs on `/services/*`, `/industries/*`, `/work/*`,
`/blog/*`; the internal-linking rules (case study → its service and industry
page; industry → 2 case studies and 1 service); `/blog/[slug]` shell; ISR on
`/blog/*` and `/work/*`; content in MDX or Sanity rather than TS modules.

**Animations deliberately deferred** (user said structure first): §6 wants
`HorizontalGallery` + `CursorImageHover`, §9 wants `ImageReveal` +
`WordScrollReveal`, §10 should share `SmoothTabs` with §5, `SheetModal` is unused.
All those components exist and are wired to nothing. Homepage motion budget is 5
scroll-linked scenes against a cap of 8, so there is room.

**Still blocked on the user (spec section 3):** `{{TODO: PRICING}}`,
`{{TODO: TEAM}}`, `{{TODO: LOGOS}}`, `{{TODO: VERTICALS}}`,
`{{TODO: PROOF_METRIC}}`, `{{TODO: CAPACITY}}`, `{{TODO: POSITIONING}}`, plus a
booking embed and a redacted sample audit report.

## Current state

34 pages build clean, typecheck clean, zero lint errors, every route returns its
`<h1>` in raw HTML. No `'use client'` on any layout or page.
