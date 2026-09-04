# Engisols Animation Implementation Spec

**Version:** 1.0
**Date:** 1 September 2026
**Companion to:** `engisols-build-spec.md`

Every animation on the site, described precisely enough to build from scratch. No Motion+ examples required.

Read section 1 before building anything. Every animation depends on the primitives defined there.

---

## 1. Shared primitives

Build these first. Every other section imports from them.

### 1.1 Easing constants

`lib/motion.ts`

```ts
export const EASE = {
  enter:  [0.22, 1, 0.36, 1],                          // entrances, 320-420ms
  micro:  [0.4, 0, 0.2, 1],                            // hover, focus, toggles, 120-180ms
  spring: { type: 'spring', stiffness: 220, damping: 30, mass: 0.8 },
} as const

export const DUR = {
  micro: 0.16,
  standard: 0.36,
  scene: 0.7,
} as const
```

Nothing in this codebase defines its own easing or duration inline. If a value is not in this file, it does not get used.

### 1.2 Scope of the distance rule

The build spec caps translate distances at 8, 16 or 24px. **That cap applies to entrance animations only**, meaning anything that plays once as an element appears.

Scroll-scrubbed parallax is exempt, because large travel is the entire point of the effect. A hero background moving 120px across a full scroll range is correct. A card sliding up 60px when it enters the viewport is not.

### 1.3 Reduced motion

`hooks/useMotionPrefs.ts`

```ts
'use client'
import { useReducedMotion } from 'motion/react'
import { useEffect, useState } from 'react'

export function useMotionPrefs() {
  const reduced = useReducedMotion()
  const [finePointer, setFinePointer] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const mq = window.matchMedia('(pointer: fine)')
    setFinePointer(mq.matches)
    const on = (e: MediaQueryListEvent) => setFinePointer(e.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])

  return {
    mounted,
    reduced: !!reduced,
    finePointer,
    allowPointerFX: mounted && finePointer && !reduced,
  }
}
```

**Rules that follow from this:**

- `reduced === true` collapses every scroll scene to a plain opacity fade at final position. Never a disable, never a jump.
- `allowPointerFX === false` means the custom cursor, the cursor image hover, and the collision grid all render as static, fully usable versions of themselves.
- `mounted === false` means server render. See 1.4.

### 1.4 The mount gate

Motion's `initial` prop serialises into the SSR output. `initial={{ opacity: 0 }}` ships `style="opacity:0"` in the HTML, so if JavaScript fails the content is invisible permanently.

`components/motion/Reveal.tsx`

```tsx
'use client'
import { motion } from 'motion/react'
import { useMotionPrefs } from '@/hooks/useMotionPrefs'
import { EASE, DUR } from '@/lib/motion'

export function Reveal({
  children,
  y = 16,
  delay = 0,
}: { children: React.ReactNode; y?: number; delay?: number }) {
  const { mounted, reduced } = useMotionPrefs()

  return (
    <motion.div
      initial={mounted ? { opacity: 0, y: reduced ? 0 : y } : false}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-15%' }}
      transition={{ duration: DUR.standard, ease: EASE.enter, delay }}
    >
      {children}
    </motion.div>
  )
}
```

`initial={false}` on the server render means no transform is written into the HTML. The element ships visible and at final position. On mount the gate flips and the animation takes over.

**This works for below-fold content only.** Above the fold it produces a visible flash, because the browser paints the final state and then JS hides it to animate. See 1.5.

### 1.5 Above-the-fold animations are CSS only

Anything visible on first paint animates with CSS keyframes, not Motion. Two reasons: no flash, and no animation library in the LCP path, which the build spec already requires.

This applies to the hero headline (3.2) and the ticker (4.1). Everything else on the site is below the fold and uses Motion.

### 1.6 Import discipline

Wrap the app in `LazyMotion` and use `m` components in leaf files:

```tsx
import { LazyMotion, domAnimation, m } from 'motion/react'
```

Every scene below section 4 is dynamically imported with `next/dynamic`. Keep `ssr: true` on all of them, since they wrap server-rendered content.

---

## 2. Global

### 2.1 Header hide on scroll

**Behaviour.** Scrolling down past 120px slides the header out upward. Any upward scroll brings it straight back. At the very top of the page it is always visible.

**Structure.** `motion.header`, `position: fixed`, full width, `z-index: 50`.

**Implementation.**

```tsx
const { scrollY } = useScroll()
const [hidden, setHidden] = useState(false)

useMotionValueEvent(scrollY, 'change', (latest) => {
  const prev = scrollY.getPrevious() ?? 0
  if (menuOpen) return                    // never hide with the mega menu open
  if (latest > prev && latest > 120) setHidden(true)
  else if (latest < prev) setHidden(false)
})
```

**Animation.** `animate={{ y: hidden ? '-100%' : '0%' }}`, `transition={{ duration: 0.3, ease: EASE.micro }}`.

**Ground handling.** The header sits over Bordeaux Noir in the hero and over Vanilla Silk further down. Track which section is under it and swap text colour between `--vanilla` and `--bordeaux` over 200ms. Use an `IntersectionObserver` on section 2's bottom edge, not a scroll position constant.

**Reduced motion.** Header never hides. It stays fixed and visible.

### 2.2 Mega menu

**Behaviour.** Hovering Services or Industries opens a three-column panel below the header. Panel fades and drops 8px into place. Switching between the two triggers moves the panel and animates its height rather than closing and reopening.

**Timing.** Open delay 120ms on hover intent, so a pointer crossing the trigger does not fire it. Close delay 180ms, so moving diagonally into the panel does not dismiss it.

**Animation.** `AnimatePresence`. Enter `{ opacity: 0, y: -8 }` to `{ opacity: 1, y: 0 }`, 200ms, `EASE.enter`. Exit `{ opacity: 0, y: -4 }`, 140ms, `EASE.micro`. Wrap the panel in `layout` so height changes between the two menus animate with `EASE.spring`.

**Keyboard.** Enter or Space opens. Escape closes and returns focus to the trigger. Arrow keys move between panel links. Tab out closes.

**Touch.** Tap opens, tap outside closes. No hover intent.

**Crawlability.** Every link in the mega menu must also appear in the footer. Menu links alone are not a reliable crawl path.

### 2.3 Custom cursor

**Behaviour.** A small rounded rectangle replaces the pointer. At rest it is an 8px dot. Hovering anything marked `data-cursor="target"` expands it to that element's bounding box with the element's border radius, and it springs into position. Leaving collapses it back to the dot.

**Structure.** One fixed-position element at `z-index: 9999`, `pointer-events: none`.

**Implementation.**

```tsx
const x = useMotionValue(0)
const y = useMotionValue(0)
const w = useMotionValue(8)
const h = useMotionValue(8)
const r = useMotionValue(4)

const sx = useSpring(x, { stiffness: 400, damping: 40, mass: 0.5 })
const sy = useSpring(y, { stiffness: 400, damping: 40, mass: 0.5 })
const sw = useSpring(w, EASE.spring)
const sh = useSpring(h, EASE.spring)
```

Position updates come from a single `pointermove` listener on `window` writing to motion values directly. **Never `setState` on pointer move.** Motion values bypass React re-render, which is the entire reason this runs at 60fps.

On `pointerover` of a target, read `getBoundingClientRect()` and `getComputedStyle().borderRadius`, then set `w`, `h`, `r`, and position `x`/`y` to the element's centre. The position spring stiffness drops to 220 while snapped so it feels magnetic rather than twitchy.

**Colour.** `--vanilla` at 90% opacity over dark grounds, `--bordeaux` at 20% opacity over light grounds. Read the ground from a `data-ground` attribute on the section.

**Gating.** Renders only when `allowPointerFX` is true. Apply `cursor: none` to `body` via a class added by the same condition, never in static CSS. If JS fails, the native cursor must still be there.

**Accessibility.** Never replaces or hides keyboard focus rings. Keyboard users see native focus states regardless.

### 2.4 Toast

**Behaviour.** Slides up from bottom right on desktop, bottom centre on mobile. Auto dismisses after 5 seconds, pauses on hover or focus.

**Animation.** Enter `{ opacity: 0, y: 16, scale: 0.96 }` to `{ opacity: 1, y: 0, scale: 1 }`, `EASE.spring`. Exit `{ opacity: 0, y: 8, scale: 0.98 }`, 160ms, `EASE.micro`. Stacked toasts use `layout` so existing ones shift up smoothly.

**Accessibility.** `role="status"` with `aria-live="polite"` for success. `role="alert"` with `aria-live="assertive"` for errors. Errors do not auto dismiss.

### 2.5 Page transitions

CSS only. No JavaScript router.

```css
@view-transition { navigation: auto; }

::view-transition-old(root) { animation: vt-out 180ms cubic-bezier(0.4, 0, 0.2, 1) both; }
::view-transition-new(root) { animation: vt-in 260ms cubic-bezier(0.22, 1, 0.36, 1) both; }

@keyframes vt-out { to { opacity: 0; } }
@keyframes vt-in  { from { opacity: 0; } }

@media (prefers-reduced-motion: reduce) {
  @view-transition { navigation: none; }
}
```

Chromium 126+ and Safari 18.2+. Firefox navigates normally. No fallback code needed.

---

## 3. Section 1: Hero

Ground `--bordeaux`. Above the fold.

### 3.1 Scroll zoom

**Behaviour.** The background montage scales up, blurs, and fades as the hero scrolls away. Content above it drifts up faster than the background, producing depth.

**Structure.**

```
<section ref={heroRef} data-ground="dark">   height: 100svh
  <div>  absolute inset-0, overflow hidden
    <motion.div>  the montage image, scale/blur/opacity
  </div>
  <motion.div>  content layer, y + opacity
</section>
```

**Implementation.**

```tsx
const { scrollYProgress } = useScroll({
  target: heroRef,
  offset: ['start start', 'end start'],
})

const scale   = useTransform(scrollYProgress, [0, 1],    [1, 1.18])
const blurPx  = useTransform(scrollYProgress, [0, 0.9],  [0, 10])
const bgOpacity = useTransform(scrollYProgress, [0, 0.85], [1, 0])
const contentY  = useTransform(scrollYProgress, [0, 1],    [0, -90])
const contentOpacity = useTransform(scrollYProgress, [0, 0.55], [1, 0])

const filter = useMotionTemplate`blur(${blurPx}px)`
```

`offset: ['start start', 'end start']` means progress is 0 when the hero top meets the viewport top, and 1 when the hero bottom meets the viewport top.

**Background content.** A montage of real shipped product UIs. Never a stock 3D render. Ship it as a single optimised image at 1920px wide with `priority` and `fetchPriority="high"`, since this is the LCP element.

**Reduced motion.** No scale, no blur, no parallax. Background opacity still fades so the section transition reads.

**Mobile.** Halve the values: scale to 1.08, blur to 5px, content travel to -40px. Use `100svh` not `100vh` so mobile browser chrome does not cause a jump.

### 3.2 Headline split text

CSS only. This is the LCP text and must not depend on JavaScript.

**Structure.** Server-render the headline with each word wrapped:

```html
<h1 class="hero-h1">
  <span class="w"><span style="--i:0">Three</span></span>
  <span class="w"><span style="--i:1">senior</span></span>
  ...
</h1>
```

Outer `.w` is `overflow: hidden; display: inline-block`. Inner span carries the animation.

**CSS.**

```css
.hero-h1 .w > span {
  display: inline-block;
  animation: word-up 520ms cubic-bezier(0.22, 1, 0.36, 1) both;
  animation-delay: calc(var(--i) * 40ms);
}
@keyframes word-up {
  from { transform: translateY(105%); opacity: 0; }
  to   { transform: translateY(0);    opacity: 1; }
}
@media (prefers-reduced-motion: reduce) {
  .hero-h1 .w > span { animation: none; }
}
```

Runs exactly once, on load. Word level, never character level. Character-level staggers on a display headline read as decorative and slow the message down.

If CSS fails to load the text is unstyled and visible. If JS fails it is unaffected.

**Do not use Motion for this.**

### 3.3 Capacity line

Mono type, `--greige`. A single dot before it pulses at 2s intervals, scale 1 to 1.4, opacity 1 to 0.4, `EASE.micro`, infinite. CSS animation. Stops under reduced motion.

---

## 4. Section 2: Trust strip

Ground `--bordeaux`, continuous with the hero, separated by a 1px `--greige` rule at 20% opacity.

### 4.1 Ticker

**Behaviour.** Logos scroll left continuously and seamlessly.

**Implementation.** CSS, not JavaScript. Duplicate the logo set twice in the DOM inside a flex track, then translate the track by -50% on an infinite linear loop.

```css
.ticker-track {
  display: flex;
  width: max-content;
  animation: ticker 40s linear infinite;
}
@keyframes ticker { to { transform: translateX(-50%); } }
.ticker:hover .ticker-track { animation-play-state: paused; }
@media (prefers-reduced-motion: reduce) {
  .ticker-track { animation: none; }
  .ticker { overflow-x: auto; }
}
```

Linear easing only. Any curve makes a loop visibly stutter at the seam.

Edges fade out with a `mask-image` linear gradient, 80px on each side.

---

## 5. Section 3: The stall

Ground `--vanilla`. This is the hardest contrast cut on the page. Full bleed, hard edge, no gradient into it.

### 5.1 Scroll text lines

**Behaviour.** The copy sits at low opacity and each line brightens to full as it passes through the middle of the viewport. Scrubbed to scroll, not a one-shot entrance.

**Structure.** Each line is its own element. Break the copy into lines manually in the content file. Never rely on measuring wrapped text at runtime, because it changes across breakpoints and fonts.

**Implementation.**

```tsx
const { scrollYProgress } = useScroll({
  target: containerRef,
  offset: ['start 0.8', 'end 0.4'],
})

// per line, index i of n
const start = i / n
const end   = (i + 1) / n
const opacity = useTransform(scrollYProgress, [start, end], [0.18, 1])
```

Because hooks cannot run in a loop, render each line as its own `<Line index={i} total={n} progress={scrollYProgress} />` component that calls `useTransform` once.

**Colour.** Lines animate opacity only, on `--bordeaux` text. Do not animate colour between two hexes, since Cherry and Bordeaux are 2.02 apart and the change will not read.

**Reduced motion.** All lines render at opacity 1. No scrub.

---

## 6. Section 4: Proof band

Ground `--oat`.

### 6.1 Counters

**Behaviour.** Numbers count up from 0 to their real value when the block enters the viewport. Once only.

**Implementation.**

```tsx
const ref = useRef(null)
const inView = useInView(ref, { once: true, amount: 0.4 })
const count = useMotionValue(0)
const rounded = useTransform(count, v => Math.round(v).toLocaleString('en-US'))
const { mounted, reduced } = useMotionPrefs()

useEffect(() => {
  if (!inView || reduced) return
  const controls = animate(count, target, { duration: 1.1, ease: EASE.enter })
  return controls.stop
}, [inView, reduced])
```

**SSR.** Server-render the final number as plain text inside the element. On mount, if reduced motion is off, reset to 0 and animate. This section is below the fold so there is no visible flash.

**Formatting.** Format with `toLocaleString` and pin the locale to `'en-US'`. An unpinned locale renders differently on the server and the client and throws a hydration mismatch.

**Reduced motion.** Static final number.

### 6.2 Line graph

**Only build this if a real metric exists.** If `{{TODO: PROOF_METRIC}}` is unresolved, delete this component and render three static figures instead. Never animate a chart built on invented data.

**Implementation.** An inline SVG with a single `motion.path`.

```tsx
<motion.path
  d={pathD}
  fill="none"
  stroke="var(--cherry)"
  strokeWidth={2}
  initial={mounted ? { pathLength: 0 } : false}
  whileInView={{ pathLength: 1 }}
  viewport={{ once: true, amount: 0.5 }}
  transition={{ duration: 1.2, ease: EASE.enter }}
/>
```

Motion handles `pathLength` natively by managing `strokeDasharray` and `strokeDashoffset`.

**Point markers.** Fade in with a 60ms stagger starting at 0.6 of the path duration, using `delay`.

**Accessibility.** The SVG carries `role="img"` and an `aria-label` stating the figure in words. The same figure appears as text next to the chart. The chart is never the only place a number exists.

**Reduced motion.** Path renders complete, no draw.

---

## 7. Sections 5 and 10: Smooth tabs

One component, used twice. Ground `--vanilla` both times.

### 7.1 Behaviour

A row of tab triggers with a sliding indicator underneath. Clicking a tab moves the indicator and crossfades the panel.

### 7.2 Indicator

Use a shared `layoutId`. This is what makes it slide rather than jump.

```tsx
{tabs.map(tab => (
  <button key={tab.id} role="tab" aria-selected={active === tab.id}>
    {tab.label}
    {active === tab.id && (
      <motion.span
        layoutId="tab-indicator"
        className="absolute inset-x-0 -bottom-px h-0.5 bg-[var(--cherry)]"
        transition={EASE.spring}
      />
    )}
  </button>
))}
```

### 7.3 Panels and crawlability

**All panels render in the DOM server-side.** Inactive panels carry the `hidden` attribute. Do not use `AnimatePresence` to mount only the active panel, because the copy in the other four panels would never be crawled.

Animate the active panel with opacity and an 8px y offset, 200ms, `EASE.enter`. Wrap the panel container in `layout` so height changes between panels of different lengths animate rather than jump.

### 7.4 Accessibility

`role="tablist"` on the container, `role="tab"` on triggers, `role="tabpanel"` on panels, correct `aria-controls` and `aria-labelledby` pairs. Left and Right arrows move between tabs, Home and End jump to first and last. Focus stays on the trigger, it does not move into the panel.

### 7.5 Reduced motion

Indicator jumps instead of sliding. Panels swap with no fade.

---

## 8. Section 6: Selected work

Ground `--greige`.

### 8.1 Horizontal scroll gallery

**Behaviour.** Vertical scrolling drives a horizontal track of case study cards.

**Structure.**

```
<section ref={outerRef}>            height: calc(100vh + trackDistance)
  <div>                              position: sticky; top: 0; height: 100svh; overflow: hidden
    <motion.div ref={trackRef}>      display: flex; width: max-content; style={{ x }}
```

**Implementation.**

```tsx
const [distance, setDistance] = useState(0)

useLayoutEffect(() => {
  const measure = () => {
    if (!trackRef.current) return
    setDistance(trackRef.current.scrollWidth - window.innerWidth)
  }
  measure()
  const ro = new ResizeObserver(measure)
  ro.observe(trackRef.current!)
  return () => ro.disconnect()
}, [])

const { scrollYProgress } = useScroll({
  target: outerRef,
  offset: ['start start', 'end end'],
})
const x = useTransform(scrollYProgress, [0, 1], [0, -distance])
```

Measure in pixels with a `ResizeObserver`. Do not hardcode a percentage, because the track width changes with card count and breakpoint.

The outer section height must equal `100vh + distance` so the scroll distance maps exactly. Set it as an inline style once `distance` is known.

**Mobile: do not build this.** Below 1024px, render the same cards as a native horizontally scrollable list with `overflow-x: auto`, `scroll-snap-type: x mandatory` and `scroll-snap-align: start` on each card. Scroll hijacking on touch is unreliable and fights the OS.

**Reduced motion.** Same fallback as mobile: native scroll list, no scrubbing.

### 8.2 Cursor image hover

**Behaviour.** Hovering a case study row shows its thumbnail floating near the cursor, trailing with spring lag.

**Implementation.**

```tsx
const x = useMotionValue(0)
const y = useMotionValue(0)
const sx = useSpring(x, { stiffness: 180, damping: 24, mass: 0.6 })
const sy = useSpring(y, { stiffness: 180, damping: 24, mass: 0.6 })
```

Update `x`/`y` from a single `pointermove` on the list container. Offset the image so it sits below and right of the cursor, roughly `+24, +24`.

Swap images with `AnimatePresence mode="wait"`. Enter `{ opacity: 0, scale: 0.92 }` to `{ opacity: 1, scale: 1 }`, 200ms `EASE.enter`. Exit 140ms `EASE.micro`.

**Gating.** Only when `allowPointerFX`. Otherwise render a static thumbnail inline in each row. The image must be reachable without a pointer.

---

## 9. Section 7: Capability grid

Ground `--cherry`, full bleed. This is the single show-off moment on the site.

### 9.1 Behaviour

A grid of stack tags. The pointer pushes nearby tags gently away and lifts them, with the effect falling off by distance. Everything springs back on exit.

### 9.2 Performance requirement

**This is the animation an agent is most likely to build wrong.**

Do not put pointer position in React state. Do not re-render cells on pointer move. With 16 cells that is 16 re-renders per frame and the section will visibly stutter.

Correct approach: each cell owns two `useMotionValue`s wrapped in `useSpring`. A single `pointermove` handler on the grid container writes to every cell's motion values directly. React renders once, on mount, and never again during interaction.

### 9.3 Implementation

```tsx
// Parent holds refs to each cell's motion values
const cells = useMemo(() => tags.map(() => ({
  x: motionValue(0), y: motionValue(0), s: motionValue(1),
})), [])

const onPointerMove = (e: React.PointerEvent) => {
  const rect = gridRef.current!.getBoundingClientRect()
  const px = e.clientX - rect.left
  const py = e.clientY - rect.top

  cellRefs.current.forEach((el, i) => {
    if (!el) return
    const r = el.getBoundingClientRect()
    const cx = r.left - rect.left + r.width / 2
    const cy = r.top - rect.top + r.height / 2
    const dx = cx - px
    const dy = cy - py
    const dist = Math.hypot(dx, dy)

    const RADIUS = 180
    const falloff = Math.max(0, 1 - dist / RADIUS)   // 1 at pointer, 0 at edge

    cells[i].x.set((dx / (dist || 1)) * falloff * 12)
    cells[i].y.set((dy / (dist || 1)) * falloff * 12)
    cells[i].s.set(1 + falloff * 0.06)
  })
}
```

Cache `getBoundingClientRect` per cell on mount and on resize rather than reading it every frame. Reading layout inside a pointer handler forces reflow.

**Values.** Radius 180px. Max displacement 12px away from the pointer. Max scale 1.06. Springs at `{ stiffness: 260, damping: 24 }`, slightly snappier than the global spring so it feels responsive.

**On pointer leave.** Set every cell back to `0, 0, 1`. The springs handle the settle.

**Tags.** Python, FastAPI, Node, Rails, React, Next.js, Go, PostgreSQL, LangChain, LangGraph, pgvector, n8n, Ollama, AWS, GCP, Azure. Do not add any not on this list.

**Gating.** `allowPointerFX` only. Otherwise a static grid where tags get a border colour change on focus and hover. It must still read as a capability list without any motion.

---

## 10. Section 8: How we work

Ground `--vanilla`.

### 10.1 Scroll highlight

**Behaviour.** The commitments are one contiguous list. Each rests at 30% opacity and brightens to full as it crosses a narrow band through the middle of the viewport, so exactly one is at full strength at a time. A rotated label sticks alongside on the same line as that band — it is what tells the reader the band is a fixed line on screen rather than rows lighting up at random.

Replaced the sticky step nav that held this slot. Same detection, same indicator; the nav column became the rotated label and the highlight moved from a nav item onto the commitment itself.

**Implementation.** Use `useInView` per row with a symmetric margin that collapses the observer root to a band across the viewport centre:

```tsx
const inView = useInView(rowRef, { margin: '-48% 0px -48% 0px' })
```

Geometry decides the active row, so it never round-trips through React state on a scroll frame. Do not use a scrubbed motion value.

**Contiguity.** Row spacing is padding, never margin. With gaps between rows the band lands in a gap, nothing is active for a beat, and it reads as a flicker. Widen the band and two rows light at once; collapse it to zero height and the observer stops firing altogether.

**Indicator.** `layoutId` on a small bar down the left edge of the active row, `EASE.spring`. Inactive rows at 30% opacity, active at 100%, `DUR.standard` on `EASE.enter`.

**Content.** Six steps covering timezone overlap hours, who the client talks to, IP assignment, NDA, repo access from day one, and what happens if communication stalls.

**Mobile.** No rotated label. Rows still highlight — the centre band is a viewport measurement and works at any width.

**Server render and reduced motion.** Every row ships at full opacity and stays there: the dimming exists only once JS is running (spec 1.4), and rows brightening and dimming as the page scrolls is exactly the motion the preference asks us to drop. The indicator still marks the centred row, it just does not slide.

---

## 11. Section 9: The three of you

Ground `--oat`.

### 11.1 Image reveal

**Behaviour.** Each portrait is revealed by a mask wiping upward, while the image inside scales down slightly, so the photo settles rather than sliding.

**Implementation.**

```tsx
<motion.div
  initial={mounted ? { clipPath: 'inset(0 0 100% 0)' } : false}
  whileInView={{ clipPath: 'inset(0 0 0% 0)' }}
  viewport={{ once: true, amount: 0.35 }}
  transition={{ duration: 0.7, ease: EASE.enter }}
>
  <motion.img
    initial={mounted ? { scale: 1.14 } : false}
    whileInView={{ scale: 1 }}
    viewport={{ once: true, amount: 0.35 }}
    transition={{ duration: 0.9, ease: EASE.enter }}
  />
</motion.div>
```

The inner scale runs slightly longer than the clip so the image is still settling as the mask finishes. That overlap is what makes it feel considered.

Stagger the three portraits by 90ms using `delay`.

**Reduced motion.** Opacity fade only, no clip, no scale.

### 11.2 Word reveal

Applies to the section opener paragraph only, nowhere else on the site.

Identical mechanics to 5.1, but per word instead of per line. Split on whitespace at build time in the content file, not at runtime.

```tsx
const opacity = useTransform(progress, [i / n, (i + 1) / n], [0.12, 1])
```

Cap at roughly 40 words. Beyond that the effect outlasts the reader's patience.

---

## 12. Section 11: Scope estimator

Ground `--greige`.

### 12.1 Create button expand

**Behaviour.** A single button morphs into the form panel. The button does not disappear and get replaced, it becomes the panel.

**Implementation.** Shared `layoutId` between the collapsed button and the expanded panel, inside `AnimatePresence`.

```tsx
<motion.button layoutId="estimator" transition={EASE.spring}>
```
```tsx
<motion.div layoutId="estimator" transition={EASE.spring}>
```

Inner content fades in with a 120ms delay so it does not appear mid-morph.

**Focus.** On expand, move focus to the first field. On collapse, return it to the button. Escape collapses.

### 12.2 Conditional fields

**Behaviour.** Follow-up fields expand into place only when a prior answer makes them relevant.

**Implementation.**

```tsx
<AnimatePresence initial={false}>
  {show && (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.28, ease: EASE.enter }}
      style={{ overflow: 'hidden' }}
    >
```

`overflow: hidden` on the animating wrapper is mandatory, otherwise content spills during the collapse.

Fade the inner content on a shorter duration than the height, roughly 0.18s, so text does not stretch visibly.

**Accessibility.** The container is `aria-live="polite"`. New fields have real labels, never placeholder-as-label.

**Questions.** Three maximum: build stage, timeline, budget band.

### 12.3 Dots morph submit button

**Three states:** idle showing the label, pending showing three animated dots, done showing a check.

**Implementation.** `AnimatePresence mode="wait"` swapping the button's inner content. Put `layout` on the button itself so its width animates between states rather than snapping.

Dots:

```tsx
{[0, 1, 2].map(i => (
  <motion.span
    key={i}
    animate={{ y: [0, -4, 0] }}
    transition={{ duration: 0.6, repeat: Infinity, ease: EASE.micro, delay: i * 0.12 }}
  />
))}
```

**States.** `disabled` and `aria-busy="true"` while pending. Success shows the check for 900ms, then a toast fires and the button returns to idle.

**Reduced motion.** Dots hold static and the button shows a text status instead of the bounce.

**No confetti.**

---

## 13. Section 12: Footer reveal

Ground `--bordeaux`.

**Behaviour.** The footer sits behind the page. As the page scrolls to its end, the content slides up off it and the footer is uncovered.

**Implementation.** CSS only. No JavaScript, no scroll listener.

```css
.page-content {
  position: relative;
  z-index: 1;
  background: var(--vanilla);
  margin-bottom: var(--footer-h);
}
.site-footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: var(--footer-h);
  z-index: 0;
}
```

`--footer-h` is a fixed value per breakpoint, set in CSS. Do not measure it at runtime.

**Mobile: disable this.** Below 768px, `position: static` on the footer and no bottom margin on the content. Fixed elements combined with dynamic mobile viewport height are unreliable and this effect is not worth the bugs.

**Reduced motion.** No change needed. Nothing animates, the reveal is a consequence of scrolling.

---

## 14. Mobile: sheet modal

Used for case study quick view and booking, below 768px only. Desktop uses a centred dialog.

**Enter.** `y` from `'100%'` to `0`, `EASE.spring`. Backdrop opacity 0 to 1, 200ms.

**Drag to dismiss.**

```tsx
drag="y"
dragConstraints={{ top: 0, bottom: 0 }}
dragElastic={{ top: 0, bottom: 0.4 }}
onDragEnd={(e, info) => {
  if (info.offset.y > 120 || info.velocity.y > 500) close()
}}
```

Constrain upward drag to zero so the sheet cannot be pulled above its open position.

**Exit.** `y` to `'100%'`, 240ms `EASE.enter`.

**Accessibility.** `role="dialog"`, `aria-modal="true"`, focus trapped inside, Escape closes, focus returns to the trigger, body scroll locked while open.

---

## 15. Per-scene acceptance checklist

A scene is done when every line passes.

- [ ] Content is present in `curl` output with JavaScript disabled
- [ ] No `initial` prop serialises a hidden state into SSR HTML (mount gate applied)
- [ ] Uses only `EASE` and `DUR` from `lib/motion.ts`
- [ ] Entrance translate distances are 8, 16 or 24px
- [ ] `prefers-reduced-motion` branch implemented and tested, not just disabled
- [ ] Pointer effects gated behind `allowPointerFX`, with a usable static fallback
- [ ] Animates `transform`, `opacity`, `clipPath` or `pathLength` only. Never `width`, `height`, `top` or `left`, except the deliberate `height: auto` in 12.2
- [ ] No React state updates on pointer move or scroll frame
- [ ] Keyboard reachable with visible focus
- [ ] Verified at 375px, 768px and 1440px
- [ ] Holds 60fps in a CPU-throttled 4x profile

---

## 16. Where to verify API details

Install the free Motion AI Kit so the agent queries current docs rather than recalling them:

```bash
npx motion-ai
```

The free tier includes searchable up-to-date Motion documentation and best practices, with no account required. Use it to confirm hook signatures and option names before writing, since API details drift between versions and training data goes stale.
