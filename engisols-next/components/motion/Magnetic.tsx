'use client'

import { m, useMotionValue, useSpring, type HTMLMotionProps } from 'motion/react'
import { useCallback, useEffect, useRef, type ReactNode } from 'react'
import { useMotionPrefs } from '@/hooks/useMotionPrefs'
import { DEFAULT_MAX_PULL, DEFAULT_PULL_STRENGTH, magneticPull } from '@/lib/magnetic'
import { spring } from '@/lib/motion'
import { registerTarget } from '@/components/motion/cursor-registry'

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
 *
 * Note the field padding changes layout — it is real padding on a real
 * wrapper. Cancel it with a matching negative margin at the call site when the
 * surrounding spacing has to stay put.
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
  cursorPadding?: number | { x: number; y: number }
  /**
   * How far beyond the element the cursor starts snapping, px.
   *
   * Magnetic and MagneticButton pass their fieldPadding here so the cursor
   * snaps at exactly the moment the magnet catches. Leaving the two out of
   * sync is subtly wrong: the element starts leaning while the cursor is still
   * a loose dot, which reads as two unrelated effects rather than one pointer.
   */
  snapRadius?: number
  /**
   * Whether the cursor takes this element's shape.
   *
   * False keeps the pull and leaves the cursor a dot — which is the right
   * answer for anything that already reads as a button. Covering a button with
   * a button-shaped cursor states what the user can already see, and at any
   * fill heavy enough to notice it paints out the label.
   */
  snap?: boolean
}

export function useMagnetic<T extends HTMLElement>({
  pullStrength = DEFAULT_PULL_STRENGTH,
  maxPull = DEFAULT_MAX_PULL,
  label,
  cursorPadding = 8,
  snapRadius = 0,
  snap = true,
}: UseMagneticOptions = {}) {
  const ref = useRef<T>(null)
  const { reduced } = useMotionPrefs()

  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const sx = useSpring(x, spring.ui)
  const sy = useSpring(y, spring.ui)

  /**
   * The element's rect with no pull applied. Cached; invalidated on layout.
   *
   * Typed as the four numbers `magneticPull` actually needs, not as a DOMRect.
   * The source writes `{ ...rect, left, top } as DOMRect`, and that spread
   * silently produces `{}`: a DOMRect's properties are accessors on the
   * prototype, so none of them are own-enumerable and none survive. `width`
   * and `height` came out undefined, the centre computed to NaN, and the pull
   * was NaN on every frame — the element never moved at all. The `as DOMRect`
   * cast is what stopped the compiler from saying so.
   */
  const restRect = useRef<{ left: number; top: number; width: number; height: number } | null>(
    null,
  )

  const measure = useCallback(() => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    // Back out the live translate to recover the untransformed box.
    restRect.current = {
      left: rect.left - x.get(),
      top: rect.top - y.get(),
      width: rect.width,
      height: rect.height,
    }
  }, [x, y])

  useEffect(() => {
    const el = ref.current
    if (!el) return

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    window.addEventListener('scroll', measure, { passive: true })
    window.addEventListener('resize', measure, { passive: true })

    const unregister = snap
      ? registerTarget({
          el,
          radius: snapRadius,
          pull: maxPull,
          padding: cursorPadding,
          label,
        })
      : undefined

    return () => {
      observer.disconnect()
      window.removeEventListener('scroll', measure)
      window.removeEventListener('resize', measure)
      unregister?.()
    }
  }, [measure, maxPull, cursorPadding, label, snapRadius, snap])

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
    [reduced, measure, pullStrength, maxPull, x, y],
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
  className = '',
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
      <m.div ref={ref} style={style} className="will-change-transform">
        {children}
      </m.div>
    </div>
  )
}

export function MagneticButton({
  children,
  className = '',
  fieldPadding = 24,
  pullStrength,
  maxPull,
  label,
  cursorPadding,
  snapRadius,
  ...props
}: UseMagneticOptions &
  Omit<HTMLMotionProps<'button'>, 'style' | 'ref'> & { fieldPadding?: number }) {
  const { ref, style, fieldProps } = useMagnetic<HTMLButtonElement>({
    pullStrength,
    maxPull,
    label,
    cursorPadding,
    snapRadius: snapRadius ?? fieldPadding,
  })

  return (
    <div {...fieldProps} style={{ padding: fieldPadding }} className="inline-block">
      <m.button
        ref={ref}
        style={style}
        whileTap={{ scale: 0.96 }}
        transition={spring.snap}
        className={`rounded-full bg-bordeaux px-7 py-3 text-vanilla will-change-transform ${className}`}
        {...props}
      >
        {children}
      </m.button>
    </div>
  )
}
