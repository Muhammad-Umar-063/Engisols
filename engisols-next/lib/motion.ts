/**
 * Shared motion physics — animation spec section 1.1.
 *
 * Nothing in this codebase defines its own easing or duration inline. If a
 * value is not in this file, it does not get used.
 */
export const EASE = {
  /** Entrances, 320–420ms. */
  enter: [0.22, 1, 0.36, 1],
  /** Hover, focus, toggles, 120–180ms. */
  micro: [0.4, 0, 0.2, 1],
  /** Pointer and drag only. */
  spring: { type: 'spring', stiffness: 220, damping: 30, mass: 0.8 },
} as const

export const DUR = {
  micro: 0.16,
  standard: 0.36,
  scene: 0.7,
} as const

/**
 * Entrance translate distances — 8, 16 or 24px, nothing else (spec 1.2).
 * The cap applies to ENTRANCES only: scroll-scrubbed parallax is exempt,
 * because large travel is the entire point of that effect.
 */
export const SHIFT = { sm: 8, md: 16, lg: 24 } as const

/** Stagger is 40ms per item. */
export const STAGGER = 0.04

/**
 * Example-facing spellings — `duration`, `ease`, `offset` and `spring` are named
 * exactly as Motion's own example sources import them
 * (`import { duration, ease, offset, spring } from "@/lib/motion"`), so a raw
 * paste into `motion-source/` compiles without edits and the adapted component
 * and its source stay legible side by side.
 *
 * `duration` and `ease` are aliases, not second opinions: they resolve to the
 * same DUR and EASE values above. There is still exactly one set of physics in
 * this codebase.
 */
export const ease = {
  out: EASE.enter,
  micro: EASE.micro,
} as const

export const duration = {
  micro: DUR.micro,
  base: DUR.standard,
  scene: DUR.scene,
} as const

/**
 * `useScroll` offsets. Progress reads as [when it hits 0, when it hits 1].
 *
 * - `through` — top/top to bottom/bottom. The mapping a PINNED scene needs:
 *   progress spans exactly the sticky element's pin duration, so the scrub
 *   finishes at the moment the pin releases. Wrong for a scene in normal flow,
 *   where `height - viewport` is a few hundred pixels and the scrub would race.
 * - `away` — top/top until the bottom leaves the top. Progress spans the whole
 *   time the section is on screen after first contact; the mapping for a scene
 *   that scrolls in normal flow.
 * - `enter` — from the moment the top appears at the bottom of the viewport
 *   until the bottom of the element reaches it. Reveals, not exits.
 * - `cross` — the element's whole journey across the viewport, from first pixel
 *   in at the bottom to last pixel out at the top. The reading to use when the
 *   question is "how far through the viewport is this", not "has it arrived".
 * - `tail` — the element's BOTTOM edge travelling from the viewport bottom to
 *   the viewport top: one viewport of scroll, measured from the moment the
 *   element has finished passing. What the footer reveal is keyed to.
 */
export const offset = {
  through: ['start start', 'end end'],
  away: ['start start', 'end start'],
  enter: ['start end', 'end end'],
  cross: ['start end', 'end start'],
  tail: ['end end', 'end start'],
} as const

/**
 * `useSpring` configs for scrubbed scroll values.
 *
 * Raw scroll progress steps once per scroll event, so a value driven straight
 * off it inherits the input device's granularity — a mouse wheel lands as
 * visible increments. Passing it through a spring makes the scrub continuous
 * without decoupling it from the scroll position: the value still tracks the
 * scrollbar, it just catches up over a frame or two.
 *
 * `restDelta` matters — without it the spring keeps ticking imperceptibly and
 * never lets the compositor drop the layer.
 *
 * Retuned when page-level smooth scrolling landed. Lenis already eases the
 * scroll signal, so on a wheel this spring is now the SECOND smoothing pass on
 * the same input, and the two lags add: at the old 140/32/0.45 the hero zoom
 * trailed the page by roughly a fifth of a second on top of the scroller's own
 * glide, which reads as the background sliding late rather than as smoothness.
 * Stiffer and lighter — about 1.7x faster to settle — and still overdamped, so
 * it cannot overshoot and bounce. It still earns its place: touch and reduced
 * motion run with no smooth scrolling at all, and there the raw per-event
 * stepping is exactly what it was written to hide.
 */
export const spring = {
  scroll: { stiffness: 260, damping: 34, mass: 0.3, restDelta: 0.001 },
  /**
   * Smoothing for scroll VELOCITY, which is far noisier than scroll position —
   * a wheel notch spikes it to four figures and back within two frames. Stiffer
   * and much more damped than `scroll`: it has to follow a sharp change without
   * ringing, because ringing here reads as a row that wobbles after you stop.
   */
  velocity: { stiffness: 400, damping: 50 },
  /** Shared-layout moves — a `layoutId` indicator travelling between rows.
      Same physics as EASE.spring, which is the pointer-and-drag transition. */
  ui: EASE.spring,
  /**
   * Press feedback — the scale dip under a finger or a click.
   *
   * Stiffer and lighter than `ui`, because this one is answering a physical
   * action rather than moving something across the screen: the whole travel is
   * 4% of a button's size, and any lag on the way in reads as an unresponsive
   * control rather than as a soft one.
   */
  snap: { type: 'spring', stiffness: 520, damping: 32, mass: 0.4 },
} as const

/**
 * Page-level smooth scrolling (components/motion/SmoothScroll.tsx).
 *
 * `lerp` is the fraction of the remaining distance the page closes each frame,
 * so it IS the delay, and it runs backwards: LOWER is floatier. Roughly, at
 * 60fps, the page covers 63% of the remaining gap in 1/lerp frames.
 *
 * Measured on this page, one wheel tick, time to come fully to rest:
 *
 *   0.20   ~5 frames    barely smoothed, close to native
 *   0.14   ~7 frames    ~250ms
 *   0.085  ~12 frames   ~600ms, a long deliberate glide
 *   0.07   ~15 frames   ~710ms
 *   0.05   ~20 frames   ~1s
 *   0.04   ~25 frames   ~1.2s, heavy
 *
 * Everything scroll-linked inherits this, because they all read scroll
 * position: the hero zoom, the footer reveal and the marquee surge all trail
 * the input by the same amount. That is what makes the page read as one
 * weighted object rather than several independently animated ones, and it is
 * also what the number costs — below ~0.07 a wheel tick is still arriving most
 * of a second later, so a reader scanning for a section overshoots it and has
 * to wait to see where they landed. A deliberate trade, not an oversight.
 *
 * This is also why `spring.scroll` was retuned when smooth scrolling landed:
 * two layers of smoothing stacked on the same signal read as lag, not
 * smoothness.
 */
export const smoothScroll = {
  lerp: 0.070,
  wheelMultiplier: 1,
} as const
