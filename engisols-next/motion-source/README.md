# Motion source drop

Paste the official Motion example code here, one file per example. I'll adapt
each one into `components/motion/` and wire it into its section.

## Naming

Use the example's motion.dev slug as the filename, so there's no ambiguity about
which effect a file is:

```
motion-source/scroll-zoom-hero.tsx
motion-source/split-text.tsx
motion-source/smooth-tabs.tsx
```

Raw paste is fine — no need to clean it up, rename anything, or strip the demo
styling. Adapting it is my job (see "What I do with it" below).

## What's needed

From build spec section 8. Slugs match `motion.dev/examples/react-<slug>`.

| Slug | Section | Status |
|---|---|---|
| `scroll-zoom-hero` | 1 Hero | **source in repo, adapted** |
| `split-text` | 1 Hero headline | needed — also blocks `scroll-text.md` |
| `scroll-hide-header` | Global header | source in repo (in `scroll-chrome.tsx`), not yet adapted |
| `mega-menu` | Header | needed |
| `scroll-text-lines` | ~~3 The stall~~ — see note | **source in repo, adapted** |
| `scroll-track-element-in-viewport` | 4 Proof counters | source in repo (in `scroll-chrome.tsx`), not yet adapted |
| `line-graph` | 4 Proof band | **only if** a real metric lands — otherwise cut |
| `smooth-tabs` | 5 Services + 10 Pricing | needed (one shared component) |
| `scroll-horizontal` | 6 Selected work | source in repo (in `scroll-zoom-hero.tsx`), not yet adapted |
| `cursor-hover-follow` | 6 + `/work` | covered by `ios-pointer` — same object, three states |
| `collision-hover-grid` | 7 Capability grid | needed |
| `scroll-highlight` | 8 How we work | source in repo (in `scroll-chrome.tsx`), not yet adapted |
| `text-scroll-word-reveal` | 9 opener only | source in `scroll-text.md`, blocked on `split-text` |
| `scroll-image-reveal` | 9 The three of you | source in repo (in `scroll-zoom-hero.tsx`), not yet adapted |
| `create-button` | 11 Estimator | needed |
| `clerk-conditional-field` | 11 Estimator | needed |
| `dots-morph-button` | 11 Submit | needed |
| `base-toast` | Global, form states | needed |
| `sheet-modal` | Mobile only | needed |
| `ios-pointer` | Global cursor | **source in repo, adapted** |
| `footer-reveal` | 12 Footer | **source in repo, adapted** |
| `curtains-fade` | Route transitions | **not needed** — already done as native `@view-transition` in `globals.css`, per spec |

That's 20 required, plus `line-graph` if the metric resolves.

## Two ways to get it

**Option A — the MCP, which the spec assumes.** Requires Motion+.

```bash
npx motion-ai
```

Then restart Claude Code, because MCP servers only load at session start. After
that I can pull each example by name directly and this folder isn't needed.

**Option B — manual paste.** Also requires Motion+. Open
`motion.dev/examples/react-<slug>`, copy the source, save it here under the slug.

Either way Motion+ is the gate: the example source is paywalled. I verified this
directly — `motion.dev/examples/react-scroll-zoom-hero` returns "The rest of this
tutorial is part of Motion+", and `examples.motion.dev` ships the compiled demo
with no readable source.

## What I do with it

Demo code is not production code. Spec section 8 lists seven mandatory
adaptations, and I apply all of them:

1. Demo colours → the palette tokens in `globals.css`
2. Inline easings and durations → the `EASE` constants in `lib/motion.ts`
3. The mount-gated SSR pattern, so `initial={{ opacity: 0 }}` never serialises
   invisible copy into the HTML
4. A real `prefers-reduced-motion` branch (demos ship without one)
5. Translate distances clamped to 8, 16 or 24px
6. Pointer effects gated behind `(pointer: fine)`
7. `LazyMotion` + `domAnimation`, dynamically imported when below the fold

## Currently in the repo

`components/motion/` holds my own implementations, written against Motion's
public API to match each example's behaviour. They build and run, but they are
**not** Motion's source. Each will be replaced as its official version arrives.

Source drops arrive as multi-example bundles rather than one file per slug, so
the filename here is the bundle's own name and the slugs it carries are listed
below:

| File | Carries | Adapted |
|---|---|---|
| `scroll-zoom-hero.tsx` (Motion calls it `scroll-stage`) | `scroll-zoom-hero`, `scroll-image-reveal`, `scroll-horizontal` | `scroll-zoom-hero` → `components/motion/ZoomHeroScene.tsx` |
| `scroll-chrome.tsx` | `scroll-hide-header`, `scroll-highlight`, `scroll-track-element-in-viewport` | none yet |
| `footer-reveal.tsx` | `footer-reveal` | `footer-reveal` → `components/motion/FooterReveal.tsx` |
| `scroll-text-lines.tsx` + `ticker.tsx` + `ticker-math.ts` | `scroll-text-lines` | → `components/motion/ScrollTextLines.tsx`, `VelocityTicker.tsx`, `lib/ticker-math.ts` |
| `ios-pointer.md` | `ios-pointer`, `cursor-hover-follow` | → `components/motion/Cursor.tsx`, `Magnetic.tsx`, `cursor-registry.ts`, `use-pointer.ts`, `lib/magnetic.ts` |

**`ios-pointer` replaced `CustomCursor.tsx`.** Same job, spec 2.3, but the old
one snapped to a box and stopped there — no catch radius, no drift toward the
pointer while snapped, no trailing ring, and no element-side pull. Two modules
it imports (`cursor-registry`, `use-pointer`) were not in the drop and are
written locally; `ios-pointer.md` says what their contracts are. It also
documents a bug in the source's `magnetic.tsx` that stopped the pull working at
all — `{ ...someDOMRect }` is `{}`, so the pull came out NaN every frame.

**`scroll-text-lines` is not the stall effect.** The spec had it down for section
3 on the assumption that "text lines" meant lines of body copy revealing. The
actual example is a horizontal editorial marquee — five rows of repeating text
at different speeds, driven by scroll velocity — and the source says so itself
in `scroll-text.md`. Two consequences:

- The marquee is now its own band on the home page, below the stall.
- What used to be `components/motion/ScrollTextLines.tsx` (the stall's per-line
  opacity scrub, spec 5.1) is now `ScrollLineHighlight.tsx`. It kept working
  exactly as before; only the name moved.

Section 3 still wants the official treatment, which is `LineMaskReveal` in
`scroll-text.md` — blocked on `split-text`.

`example-usage.md` holds the demo page and CSS that came with those drops. It is
Markdown because the page imports components this repo does not have — as a
`.tsx` it would fail the build.

`footer-reveal` replaced the CSS-only implementation that used to live in
`app/globals.css`. One adaptation there is worth knowing about: the reveal
stands down when the footer measures taller than the viewport, because a
`sticky bottom-0` element taller than the viewport can never show its top edge.
The footer is 817px, so that guard fires on short laptops and on every phone.

Source files here are type-checked with everything else, so `lib/motion.ts`
exports `offset` and `spring` under exactly the names the examples import. A
paste compiles as-is; nothing has to be edited before it can be read against the
adapted version.
