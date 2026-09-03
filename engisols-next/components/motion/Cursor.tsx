'use client'

import {
  m,
  useAnimationFrame,
  useMotionTemplate,
  useMotionValue,
  useSpring,
} from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useMotionPrefs } from '@/hooks/useMotionPrefs'
import { findSnapTarget, measureAll, type MagneticTarget } from '@/components/motion/cursor-registry'
import {
  pointerX,
  pointerY,
  useFinePointer,
  usePointerPosition,
} from '@/components/motion/use-pointer'

/**
 * Custom cursor — animation spec 2.3, rebuilt on Motion's `ios-pointer`
 * example. Replaces the previous `CustomCursor`, which snapped to a box but
 * had none of the behaviour below.
 *
 * Three states of one object, not three components:
 *
 *   free      a small dot at the pointer, with a ring trailing behind it
 *   snapped   the dot becomes the target's exact box, ring hidden
 *   labelled  a snapped target may name itself inside the shape
 *
 * The state is decided every frame from the registry, never from React state,
 * so this file causes two renders in its lifetime — one to mount, one per
 * label change. Position comes from module-level motion values written by a
 * single pointermove listener.
 *
 * The detail that makes it read as an iOS pointer rather than a rectangle that
 * turned on: while snapped, the shape does not sit still on the target. It
 * drifts 12% of the way toward the real pointer, so the box leans in the
 * direction your hand is moving. Take that line out and it dies.
 *
 * Palette translation. The demo tints the shape with its accent; cherry cannot
 * take that job here (spec palette rule 2), and a fixed tint would vanish
 * against half the site anyway. Colour comes from the section's `data-ground`
 * the way spec 2.3 requires: vanilla at 90% over dark grounds, bordeaux at 20%
 * over light ones.
 *
 * Mounted once in the root layout, above everything, so it survives route
 * changes without resetting position.
 */

const IDLE = 12
const FREE_SPRING = { stiffness: 900, damping: 42, mass: 0.45 }
const SNAP_SPRING = { stiffness: 420, damping: 38 }

/**
 * Fill strength, as a color-mix percentage, free vs snapped.
 *
 * Spec 2.3 gives one number — vanilla at 90% — and that was right when the
 * cursor was only ever an 8px dot: a dot has nothing underneath it to hide. A
 * shape that takes the target's whole box does. At 90% the snapped shape paints
 * out the label of whatever it lands on, and the first thing it lands on is the
 * primary CTA, so hovering the most important control on the page erases its
 * text. Solid while free, a wash while snapped — which is what the pointer this
 * is modelled on does, and why its demo tints at 18%.
 */
const FILL = {
  dark: { free: 90, snapped: 22 },
  light: { free: 20, snapped: 12 },
} as const

/** How often the ground under the pointer is re-read, in frames. */
const GROUND_INTERVAL = 6

export function Cursor() {
  const fine = useFinePointer()
  const { reduced, mounted } = useMotionPrefs()

  // Portals need a real document, so nothing renders until after hydration.
  // The server output is identical with or without a cursor.
  if (!fine || !mounted || reduced) return null
  return createPortal(<CursorLayer />, document.body)
}

function CursorLayer() {
  const { ready } = usePointerPosition()

  /**
   * Shape of the cursor. Free, this is a small circle at the pointer. Snapped,
   * it is the target's box. Both are the same five springs, which is what makes
   * the morph continuous instead of a swap.
   */
  const x = useMotionValue(-100)
  const y = useMotionValue(-100)
  const width = useMotionValue(IDLE)
  const height = useMotionValue(IDLE)
  const radius = useMotionValue(IDLE / 2)

  const fill = useMotionValue<number>(FILL.dark.free)

  const sx = useSpring(x, FREE_SPRING)
  const sy = useSpring(y, FREE_SPRING)
  const sw = useSpring(width, SNAP_SPRING)
  const sh = useSpring(height, SNAP_SPRING)
  const sr = useSpring(radius, SNAP_SPRING)
  const sFill = useSpring(fill, SNAP_SPRING)

  const snapped = useRef<MagneticTarget | null>(null)
  const [label, setLabel] = useState<string | null>(null)
  const labelRef = useRef<string | null>(null)

  const [dark, setDark] = useState(true)
  const darkRef = useRef(true)
  const frame = useRef(0)

  /**
   * The native cursor is hidden only once ours is actually tracking, and only
   * on fine pointers. Hiding it earlier means a pointer that vanishes before
   * its replacement exists. The rule lives in globals.css under
   * `.cursor-hidden` rather than an injected style tag, so text inputs and
   * disabled controls can opt back out by selector.
   */
  const [tracking, setTracking] = useState(false)

  useEffect(() => {
    if (!tracking) return
    document.documentElement.classList.add('cursor-hidden')
    return () => document.documentElement.classList.remove('cursor-hidden')
  }, [tracking])

  useAnimationFrame(() => {
    if (!ready) return
    if (!tracking) setTracking(true)

    const px = pointerX.get()
    const py = pointerY.get()

    const target = findSnapTarget(px, py)

    if (target !== snapped.current) {
      snapped.current = target
      // Re-measure on entry: the target may have moved since the last scroll,
      // for example if it sits inside a scroll-linked transform.
      if (target) measureAll()

      const next = target?.label ?? null
      if (next !== labelRef.current) {
        labelRef.current = next
        setLabel(next)
      }
    }

    // Ground is a section-level property, so reading it on every frame buys
    // nothing and costs a hit test. Six frames is a tenth of a second.
    frame.current += 1
    if (frame.current % GROUND_INTERVAL === 0) {
      const under = document.elementFromPoint(px, py) as HTMLElement | null
      const ground = under?.closest?.('[data-ground]')?.getAttribute('data-ground')
      const isDark = ground !== 'light'
      if (isDark !== darkRef.current) {
        darkRef.current = isDark
        setDark(isDark)
      }
    }

    const tone = darkRef.current ? FILL.dark : FILL.light

    if (target) {
      const { rect, padding } = target
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      const drift = 0.12

      x.set(cx + (px - cx) * drift)
      y.set(cy + (py - cy) * drift)
      const w = rect.width + padding.x * 2
      const h = rect.height + padding.y * 2

      width.set(w)
      height.set(h)
      // A pill target ignores its own corner radius, which for a run of text is
      // zero — the point is to give it a button it does not have.
      radius.set(target.shape === 'pill' ? h / 2 : target.borderRadius + padding.y)
      fill.set(tone.snapped)
    } else {
      x.set(px)
      y.set(py)
      width.set(IDLE)
      height.set(IDLE)
      radius.set(IDLE / 2)
      fill.set(tone.free)
    }
  })

  // Rebuilt when the ground flips, which is a render either way; the alpha
  // inside it is a spring, so the fill eases as the shape snaps rather than
  // switching.
  const background = useMotionTemplate`color-mix(in srgb, ${
    dark ? 'var(--color-vanilla)' : 'var(--color-bordeaux)'
  } ${sFill}%, transparent)`

  return (
    <>
      <m.div
        aria-hidden
        style={{
          x: sx,
          y: sy,
          width: sw,
          height: sh,
          borderRadius: sr,
          translateX: '-50%',
          translateY: '-50%',
          background,
        }}
        className="pointer-events-none fixed left-0 top-0 z-9999 grid place-items-center will-change-transform"
      >
        {label ? (
          <m.span
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className={`text-xs ${dark ? 'text-bordeaux' : 'text-vanilla'}`}
          >
            {label}
          </m.span>
        ) : null}
      </m.div>

      <TrailingRing snapped={snapped} dark={dark} />
    </>
  )
}

/**
 * Trailing ring. Softer spring than the fill, so it arrives a beat late and
 * gives the movement weight. Hidden while snapped, because two shapes on one
 * target reads as a bug.
 */
function TrailingRing({
  snapped,
  dark,
}: {
  snapped: React.RefObject<MagneticTarget | null>
  dark: boolean
}) {
  const x = useMotionValue(-100)
  const y = useMotionValue(-100)
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
    <m.div
      aria-hidden
      style={{
        x: sx,
        y: sy,
        opacity: sOpacity,
        translateX: '-50%',
        translateY: '-50%',
        borderColor: dark
          ? 'color-mix(in srgb, var(--color-vanilla) 45%, transparent)'
          : 'color-mix(in srgb, var(--color-bordeaux) 35%, transparent)',
      }}
      className="pointer-events-none fixed left-0 top-0 z-9998 h-9 w-9 rounded-full border will-change-transform"
    />
  )
}
