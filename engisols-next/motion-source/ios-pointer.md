# ios-pointer — source drop, held as Markdown

`magnetic.tsx`, `cursor.tsx` and `settings-list.tsx` all import two modules that
have not been dropped:

```ts
import { registerTarget } from "./cursor-registry"
import { findSnapTarget, measureAll, type MagneticTarget } from "./cursor-registry"
import { pointerX, pointerY, useFinePointer, usePointerPosition } from "./use-pointer"
```

As `.tsx` these fail the build on the missing modules, so they wait here. Unlike
`split-text` (see `scroll-text.md`), the two missing files are mechanical: their
contracts are fully determined by these call sites, so they were written locally
rather than blocking the effect. Replace them if the official versions arrive:

- `components/motion/cursor-registry.ts`
- `components/motion/use-pointer.ts`

`lib/magnetic.ts` arrived complete and is in the repo verbatim.

## A bug in `magnetic.tsx`, fixed in the adaptation

```tsx
restRect.current = {
  ...rect,                    // rect is a DOMRect
  left: rect.left - x.get(),
  top: rect.top - y.get(),
} as DOMRect
```

A DOMRect's properties are accessors on `DOMRect.prototype`, so none of them are
own-enumerable and none survive a spread — `{ ...someDOMRect }` is `{}`, verified
in Chrome. `restRect` therefore held `left` and `top` and nothing else. In
`magneticPull`, `rect.left + rect.width / 2` became `NaN`, the clamp comparison
`NaN > maxPull` was false, and every frame set the element's x and y to `NaN`.

The magnetic pull did not work at all: the element never moved a pixel. The
`as DOMRect` cast is what stopped TypeScript from reporting the missing
properties. The adapted version builds the four numbers explicitly and types the
ref structurally, so the cast is gone.

## Other adaptations

- `motion.*` → `m.*` (LazyMotion `strict`), `useReducedMotion` → `useMotionPrefs`.
- Demo colours → palette tokens. The demo tints the cursor with its accent;
  cherry cannot take that job (palette rule 2) and a fixed tint is invisible
  against half the site, so colour follows `data-ground` per spec 2.3 —
  vanilla 90% over dark, bordeaux 20% over light.
- `spring.snap` added to `lib/motion.ts` for `MagneticButton`'s press.
- The registry also picks up `[data-cursor="target"]` elements, so the CTAs the
  site already marks keep snapping without being rewritten as `<Magnetic>`.
- `settings-list.tsx` is a demo surface (an iOS Settings list) and was not built.

## The source

### magnetic.tsx

```tsx
"use client"

import { motion, useMotionValue, useReducedMotion, useSpring, type HTMLMotionProps } from "motion/react"
import { useCallback, useEffect, useRef, type ReactNode } from "react"
import {
  DEFAULT_MAX_PULL,
  DEFAULT_PULL_STRENGTH,
  magneticPull,
} from "@/lib/magnetic"
import { spring } from "@/lib/motion"
import { registerTarget } from "./cursor-registry"

/**
 * Magnetic pull. The element-side half of the iOS pointer.
 *
 * `<Cursor>` snaps its shape onto the target. This is what the target does
 * back: it chases the pointer by `pullStrength` of the pointer's distance from
 * its own centre, hard clamped to `maxPull` px, then springs home on exit.
 *
 * The field zone is the important structural idea. `<Magnetic>` renders an
 * invisible padded wrapper, and that padding is what lets the magnet catch
 * before the pointer reaches the element. Two things fall out of it:
 *
 *   The field zone never moves. Only the child inside it is translated. So the
 *   hit area is stable, and there is no feedback loop where a chasing element
 *   drags its own hit area along and drifts away from the pointer.
 *
 *   Detection is pointer events on one wrapper, not a rect test against every
 *   registered target on every animation frame. It costs nothing when the
 *   pointer is elsewhere on the page.
 */

interface UseMagneticOptions {
  /**
   * Fraction of the pointer's distance from the element's centre applied as
   * translate. 0 pins it in place. Defaults to 0.35.
   */
  pullStrength?: number
  /** Hard clamp on displacement in px. Defaults to 26. */
  maxPull?: number
  /** Text shown inside the snapped cursor shape. */
  label?: string
  /** Padding added to the cursor shape when it wraps this element. */
  cursorPadding?: number
  /**
   * How far beyond the element the cursor starts snapping, px.
   *
   * Magnetic and MagneticButton pass their fieldPadding here so the cursor
   * snaps at exactly the moment the magnet catches. Leaving the two out of
   * sync is subtly wrong: the element starts leaning while the cursor is still
   * a loose dot, which reads as two unrelated effects rather than one pointer.
   */
  snapRadius?: number
}

export function useMagnetic<T extends HTMLElement>({
  pullStrength = DEFAULT_PULL_STRENGTH,
  maxPull = DEFAULT_MAX_PULL,
  label,
  cursorPadding = 8,
  snapRadius = 0,
}: UseMagneticOptions = {}) {
  const ref = useRef<T>(null)
  const reduced = useReducedMotion()

  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const sx = useSpring(x, spring.ui)
  const sy = useSpring(y, spring.ui)

  /** The element's rect with no pull applied. Cached; invalidated on layout. */
  const restRect = useRef<DOMRect | null>(null)

  const measure = useCallback(() => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    // Back out the live translate to recover the untransformed box.
    restRect.current = {
      ...rect,
      left: rect.left - x.get(),
      top: rect.top - y.get(),
    } as DOMRect
  }, [x, y])

  useEffect(() => {
    const el = ref.current
    if (!el) return

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    window.addEventListener("scroll", measure, { passive: true })
    window.addEventListener("resize", measure, { passive: true })

    const unregister = registerTarget({
      el,
      radius: snapRadius,
      pull: maxPull,
      padding: cursorPadding,
      label,
    })

    return () => {
      observer.disconnect()
      window.removeEventListener("scroll", measure)
      window.removeEventListener("resize", measure)
      unregister()
    }
  }, [measure, maxPull, cursorPadding, label, snapRadius])

  const onPointerMove = useCallback(
    (event: React.PointerEvent) => {
      if (reduced) return
      if (!restRect.current) measure()
      const rect = restRect.current
      if (!rect) return

      const next = magneticPull({
        pointer: { x: event.clientX, y: event.clientY },
        rect,
        pullStrength,
        maxPull,
      })
      x.set(next.x)
      y.set(next.y)
    },
    [reduced, measure, pullStrength, maxPull, x, y]
  )

  const onPointerLeave = useCallback(() => {
    x.set(0)
    y.set(0)
  }, [x, y])

  return {
    ref,
    /**
     * Under reduced motion the springs are never bound, so the child cannot
     * move at all. Zeroing them each frame would still leave the element
     * animatable through some other path; not binding them removes the
     * capability rather than suppressing the symptom.
     */
    style: reduced ? {} : { x: sx, y: sy },
    fieldProps: { onPointerMove, onPointerLeave },
  }
}

/* ------------------------------------------------------------------ */

export function Magnetic({
  children,
  className = "",
  fieldPadding = 24,
  ...options
}: UseMagneticOptions & {
  children: ReactNode
  className?: string
  /** Size of the invisible catch area around the element, px. */
  fieldPadding?: number
}) {
  const { ref, style, fieldProps } = useMagnetic<HTMLDivElement>({
    ...options,
    snapRadius: options.snapRadius ?? fieldPadding,
  })

  return (
    <div
      {...fieldProps}
      style={{ padding: fieldPadding }}
      className={`inline-block ${className}`}
    >
      <motion.div ref={ref} style={style} className="will-change-transform">
        {children}
      </motion.div>
    </div>
  )
}

export function MagneticButton({
  children,
  className = "",
  fieldPadding = 24,
  pullStrength,
  maxPull,
  label,
  cursorPadding,
  snapRadius,
  ...props
}: UseMagneticOptions &
  Omit<HTMLMotionProps<"button">, "style" | "ref"> & { fieldPadding?: number }) {
  const { ref, style, fieldProps } = useMagnetic<HTMLButtonElement>({
    pullStrength,
    maxPull,
    label,
    cursorPadding,
    snapRadius: snapRadius ?? fieldPadding,
  })

  return (
    <div {...fieldProps} style={{ padding: fieldPadding }} className="inline-block">
      <motion.button
        ref={ref}
        style={style}
        whileTap={{ scale: 0.96 }}
        transition={spring.snap}
        className={`rounded-full bg-[--bordeaux-noir] px-7 py-3 text-[--vanilla-cream] will-change-transform ${className}`}
        {...props}
      >
        {children}
      </motion.button>
    </div>
  )
}
```

### cursor.tsx

```tsx
"use client"

import {
  motion,
  useAnimationFrame,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "motion/react"
import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import {
  findSnapTarget,
  measureAll,
  type MagneticTarget,
} from "./cursor-registry"
import { pointerX, pointerY, useFinePointer, usePointerPosition } from "./use-pointer"

/**
 * Custom cursor. Covers three of your examples in one component:
 *
 *   vue-cursor              the trailing dot and ring
 *   vue-cursor-hover-follow the ring stretching over a hover target
 *   react-ios-pointer       magnetic snapping onto the target's exact shape
 *
 * They are the same object in three states, which is why splitting them into
 * three components would have been the wrong call. The state is decided every
 * frame from the registry, never from React state, so this whole file causes
 * exactly two React renders in its lifetime.
 *
 * Mount once, in the root layout, above everything else.
 */

const SNAP_STIFFNESS = 420
const FREE_STIFFNESS = 900

export function Cursor() {
  const fine = useFinePointer()
  const [mounted, setMounted] = useState(false)

  // Portals need a real document, so nothing renders until after hydration.
  // This also means the server output is identical with or without a cursor.
  useEffect(() => setMounted(true), [])

  if (!fine || !mounted) return null
  return createPortal(<CursorLayer />, document.body)
}

function CursorLayer() {
  const { ready } = usePointerPosition()
  const reduced = useReducedMotion()

  /**
   * Shape of the cursor. In free state this is a small circle at the pointer.
   * In snapped state it is the target's box. Both are driven by the same four
   * springs, which is what makes the morph continuous instead of a swap.
   */
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const width = useMotionValue(12)
  const height = useMotionValue(12)
  const radius = useMotionValue(6)

  const config = { stiffness: FREE_STIFFNESS, damping: 42, mass: 0.45 }
  const sx = useSpring(x, config)
  const sy = useSpring(y, config)
  const sw = useSpring(width, { stiffness: SNAP_STIFFNESS, damping: 38 })
  const sh = useSpring(height, { stiffness: SNAP_STIFFNESS, damping: 38 })
  const sr = useSpring(radius, { stiffness: SNAP_STIFFNESS, damping: 38 })

  const snapped = useRef<MagneticTarget | null>(null)
  const [label, setLabel] = useState<string | null>(null)
  const labelRef = useRef<string | null>(null)

  /**
   * Native cursor is hidden only once ours is actually tracking, and only on
   * fine pointers. Hiding it earlier means a pointer that vanishes before the
   * replacement exists. The rule lives in globals.css under .cursor-hidden
   * rather than an injected style tag, so text inputs and disabled controls can
   * opt back out by selector.
   */
  const [tracking, setTracking] = useState(false)

  useEffect(() => {
    if (!tracking) return
    document.documentElement.classList.add("cursor-hidden")
    return () => document.documentElement.classList.remove("cursor-hidden")
  }, [tracking])

  useAnimationFrame(() => {
    if (!ready) return
    if (!tracking) setTracking(true)

    const px = pointerX.get()
    const py = pointerY.get()

    const target = findSnapTarget(px, py)

    if (target !== snapped.current) {
      snapped.current = target
      // Re-measure on entry: the target may have moved since the last scroll
      // event, for example if it sits inside a scroll-linked transform.
      if (target) measureAll()

      const next = target?.label ?? null
      if (next !== labelRef.current) {
        labelRef.current = next
        setLabel(next)
      }
    }

    if (target) {
      const { rect, padding } = target
      // The shape sits on the target, but drifts a few px toward the pointer.
      // That drift is the entire reason the iOS pointer feels alive rather
      // than like a rectangle that turned on.
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      const drift = reduced ? 0 : 0.12

      x.set(cx + (px - cx) * drift)
      y.set(cy + (py - cy) * drift)
      width.set(rect.width + padding * 2)
      height.set(rect.height + padding * 2)
      radius.set(target.borderRadius + padding)
    } else {
      x.set(px)
      y.set(py)
      width.set(12)
      height.set(12)
      radius.set(6)
    }
  })

  return (
    <>
      <motion.div
        aria-hidden
        style={{
          x: sx,
          y: sy,
          width: sw,
          height: sh,
          borderRadius: sr,
          translateX: "-50%",
          translateY: "-50%",
        }}
        className="pointer-events-none fixed left-0 top-0 z-[9999] grid place-items-center bg-[--cherry-velvet]/18 backdrop-blur-[1px] will-change-transform"
      >
        {label ? (
          <motion.span
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs text-[--bordeaux-noir]"
          >
            {label}
          </motion.span>
        ) : null}
      </motion.div>

      {/* Trailing ring. Softer spring than the fill, so it arrives a beat late
          and gives the movement weight. Hidden while snapped, because two
          shapes on one target reads as a bug. */}
      <TrailingRing snapped={snapped} />

    </>
  )
}

function TrailingRing({ snapped }: { snapped: React.RefObject<MagneticTarget | null> }) {
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const opacity = useMotionValue(0)

  const sx = useSpring(x, { stiffness: 170, damping: 22, mass: 0.7 })
  const sy = useSpring(y, { stiffness: 170, damping: 22, mass: 0.7 })
  const sOpacity = useSpring(opacity, { stiffness: 300, damping: 34 })

  useAnimationFrame(() => {
    x.set(pointerX.get())
    y.set(pointerY.get())
    opacity.set(snapped.current ? 0 : 1)
  })

  return (
    <motion.div
      aria-hidden
      style={{ x: sx, y: sy, opacity: sOpacity, translateX: "-50%", translateY: "-50%" }}
      className="pointer-events-none fixed left-0 top-0 z-[9998] h-9 w-9 rounded-full border border-[--cherry-velvet]/45 will-change-transform"
    />
  )
}
```

### settings-list.tsx

Demo surface, not built into this site. Kept for the two behaviours its comment
documents — the highlight sliding between rows rather than fading, and rows
leaning at a much lower pull than a standalone button.

```tsx
"use client"

import { motion } from "motion/react"
import { useMagnetic } from "./magnetic"

interface Row {
  id: string
  label: string
  value?: string
  glyph: string
  tint: string
}

const ROWS: Row[] = [
  { id: "general", label: "General", glyph: "⚙", tint: "#8A8A8E" },
  { id: "appearance", label: "Appearance", value: "Warm", glyph: "◐", tint: "#8E2036" },
  { id: "accessibility", label: "Accessibility", glyph: "◉", tint: "#0A84FF" },
  { id: "motion", label: "Motion", value: "Full", glyph: "≈", tint: "#30D158" },
  { id: "privacy", label: "Privacy & Security", glyph: "✥", tint: "#5E5CE6" },
]

export function SettingsList() {
  return (
    <div className="overflow-hidden rounded-2xl bg-[--alpine-oat]">
      <h2 className="px-5 pt-5 pb-2 text-sm tracking-wide text-[--warm-greige]">
        Settings
      </h2>
      <ul>
        {ROWS.map((row, i) => (
          <SettingsRow key={row.id} row={row} last={i === ROWS.length - 1} />
        ))}
      </ul>
    </div>
  )
}

function SettingsRow({ row, last }: { row: Row; last: boolean }) {
  /**
   * Low pull, tight clamp. iOS moves the row contents a few px, not the 26px a
   * standalone call-to-action would take. Anything more and a dense list starts
   * to look like it is sliding apart.
   */
  const { ref, style, fieldProps } = useMagnetic<HTMLAnchorElement>({
    pullStrength: 0.12,
    maxPull: 6,
    cursorPadding: 0,
  })

  return (
    <li {...fieldProps}>
      <motion.a
        ref={ref}
        style={style}
        href={`#${row.id}`}
        className="flex items-center gap-4 px-5 py-3.5 will-change-transform"
      >
        <span
          aria-hidden
          style={{ backgroundColor: row.tint }}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-[8px] text-base text-white"
        >
          {row.glyph}
        </span>

        <span
          className={`flex flex-1 items-center justify-between py-1 ${
            last ? "" : "border-b border-[--warm-greige]/25"
          }`}
        >
          <span className="text-[--bordeaux-noir]">{row.label}</span>
          <span className="flex items-center gap-2 text-sm text-[--warm-greige]">
            {row.value}
            <span aria-hidden>›</span>
          </span>
        </span>
      </motion.a>
    </li>
  )
}
```
