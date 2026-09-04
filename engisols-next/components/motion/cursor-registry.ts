'use client'

/**
 * Registry of everything the cursor can snap onto.
 *
 * NOT in this repo's source drop — both `cursor.tsx` and `magnetic.tsx` import
 * it and it never arrived, so this is written against its call sites. Replace
 * it if the official version turns up.
 *
 * Two things it has to get right:
 *
 *   IDENTITY IS STABLE. The cursor decides "did the target change" by object
 *   identity, once per frame. Rebuilding entry objects on measure would read as
 *   the target changing 60 times a second, and the label state behind it would
 *   re-render just as often. Entries are keyed by element and mutated in place.
 *
 *   MEASUREMENT IS LAZY. Rects go stale the moment the page scrolls, but
 *   measuring every target every frame is a layout read the idle case should
 *   not pay for. Scroll and resize only mark the cache dirty; the next lookup
 *   re-measures, so the cost is one pass per frame WHILE scrolling and nothing
 *   at rest.
 */

/**
 * `auto` takes the element's own corner radius — right for something that is
 * already a shape, like a button or a card. `pill` ignores it and rounds fully,
 * which is what turns a run of plain text into a temporary button while the
 * pointer is on it.
 */
export type CursorShape = 'auto' | 'pill'

export interface MagneticTarget {
  el: HTMLElement
  /** How far outside the element the cursor still snaps, px. */
  radius: number
  /** The element's own max displacement, px. Carried for the element half. */
  pull: number
  /**
   * Padding added around the element when the cursor takes its shape, per axis.
   *
   * Per axis rather than one number, because a pill is defined by being wider
   * than it is tall. Pad a short nav item like "Work" evenly and the shape comes
   * out 53x54 — a circle, which reads as a dot that grew rather than as a button
   * appearing. Horizontal padding is what makes it a button.
   */
  padding: { x: number; y: number }
  shape: CursorShape
  label?: string
  /** Live measurements, refreshed by `measureAll`. */
  rect: DOMRect
  borderRadius: number
}

export interface RegisterTargetOptions {
  el: HTMLElement
  radius?: number
  pull?: number
  /** A number pads both axes equally; `{ x, y }` sets them apart. */
  padding?: number | { x: number; y: number }
  shape?: CursorShape
  label?: string
}

function toPadding(padding: number | { x: number; y: number }) {
  return typeof padding === 'number' ? { x: padding, y: padding } : padding
}

/**
 * Elements marked in the markup rather than through <Magnetic>.
 *
 *   data-cursor="link"    a run of text. The cursor wraps it as a full pill
 *                         with generous padding, so a plain link wears a button
 *                         for as long as the pointer is on it. This is the one
 *                         that earns its keep: a button already looks like a
 *                         button, and covering it says nothing the user cannot
 *                         already see.
 *   data-cursor="target"  something that is already a shape. Tight padding, its
 *                         own corner radius.
 *
 * Anything wanting a label, a catch radius or magnetic pull uses <Magnetic> and
 * registers properly.
 */
const DECLARATIVE: Record<string, { padding: { x: number; y: number }; shape: CursorShape }> = {
  /**
   * The pill is deliberately loose. At the original 14/4 it hugged the text
   * closely enough to read as a highlight rather than as a button, which is the
   * opposite of the point — the shape exists to say "this is pressable", and a
   * button's padding is what says it.
   *
   * 22/16 is sized against the real thing it sits beside. On the landing page
   * hero the pill lands next to a filled CTA roughly 48px tall, and a 36px pill
   * next to it read as a smaller, lesser control rather than as the same
   * gesture applied to a link. At 16 the two are within a few pixels of each
   * other and the pair reads as one row.
   *
   * The vertical figure is the one to watch: the radius is h/2, so every pixel
   * here also rounds the ends. It is now a full capsule, which is the intended
   * look — going further only makes it taller, not rounder.
   */
  link: { padding: { x: 22, y: 16 }, shape: 'pill' },
  target: { padding: { x: 6, y: 6 }, shape: 'auto' },
}

const DECLARATIVE_SELECTOR = '[data-cursor]'

const targets = new Map<HTMLElement, MagneticTarget>()
const registered = new Set<HTMLElement>()
let dirty = true

function markDirty() {
  dirty = true
}

if (typeof window !== 'undefined') {
  window.addEventListener('scroll', markDirty, { passive: true })
  window.addEventListener('resize', markDirty, { passive: true })
}

export function registerTarget({
  el,
  radius = 0,
  pull = 0,
  padding = 0,
  shape = 'auto',
  label,
}: RegisterTargetOptions) {
  const existing = targets.get(el)
  if (existing) {
    Object.assign(existing, { radius, pull, padding: toPadding(padding), shape, label })
  } else {
    targets.set(el, {
      el,
      radius,
      pull,
      padding: toPadding(padding),
      shape,
      label,
      rect: el.getBoundingClientRect(),
      borderRadius: readRadius(el),
    })
  }
  registered.add(el)
  markDirty()

  return () => {
    registered.delete(el)
    targets.delete(el)
  }
}

/**
 * Border radius in px, clamped to half the shorter side.
 *
 * A pill button computes to `9999px`. Handing that to the cursor's radius
 * spring means animating between 6 and 9999 — the rendered corner is identical
 * anywhere past half the height, so the spring would spend its travel on a
 * change nobody can see, and arrive late.
 */
function readRadius(el: HTMLElement) {
  const parsed = parseFloat(getComputedStyle(el).borderRadius) || 0
  const rect = el.getBoundingClientRect()
  return Math.min(parsed, Math.min(rect.width, rect.height) / 2)
}

export function measureAll() {
  // Pick up declaratively marked elements, and drop any that went away.
  if (typeof document !== 'undefined') {
    const found = new Set<HTMLElement>(
      Array.from(document.querySelectorAll<HTMLElement>(DECLARATIVE_SELECTOR)),
    )

    for (const el of found) {
      if (!targets.has(el)) {
        const kind = DECLARATIVE[el.dataset.cursor ?? 'target'] ?? DECLARATIVE.target
        targets.set(el, {
          el,
          radius: 0,
          pull: 0,
          padding: kind.padding,
          shape: kind.shape,
          rect: el.getBoundingClientRect(),
          borderRadius: readRadius(el),
        })
      }
    }

    for (const [el] of targets) {
      if (registered.has(el)) continue
      if (!found.has(el)) targets.delete(el)
    }
  }

  for (const target of targets.values()) {
    if (!target.el.isConnected) {
      targets.delete(target.el)
      continue
    }
    target.rect = target.el.getBoundingClientRect()
    target.borderRadius = readRadius(target.el)
  }

  dirty = false
}

/**
 * The target under the pointer, or null.
 *
 * Ties go to the smallest box: a magnetic card containing a magnetic button
 * should hand the pointer to the button, not swallow it.
 */
export function findSnapTarget(x: number, y: number): MagneticTarget | null {
  if (dirty) measureAll()

  let best: MagneticTarget | null = null
  let bestArea = Infinity

  for (const target of targets.values()) {
    const { rect, radius } = target
    if (rect.width === 0 && rect.height === 0) continue
    if (
      x < rect.left - radius ||
      x > rect.right + radius ||
      y < rect.top - radius ||
      y > rect.bottom + radius
    ) {
      continue
    }

    const area = (rect.width + radius * 2) * (rect.height + radius * 2)
    if (area < bestArea) {
      best = target
      bestArea = area
    }
  }

  return best
}
