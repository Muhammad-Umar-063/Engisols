'use client'

import Lenis from 'lenis'
import { useAnimationFrame } from 'motion/react'
import { useEffect, useRef } from 'react'
import { useMotionPrefs } from '@/hooks/useMotionPrefs'
import { smoothScroll } from '@/lib/motion'

/**
 * Page-level smooth scrolling — the eased lag between the input device and the
 * page, which is what makes every scrubbed scene on this site read as one
 * continuous movement instead of five independent ones stepping per wheel notch.
 *
 * Lenis rather than a transform-based scroller (Locomotive and friends), and
 * the reason is structural, not taste: those move a wrapper element with
 * `transform` and leave the document's real scroll position at 0. Every
 * `position: sticky` on the site then pins to nothing. The hero zoom and the
 * footer reveal are both sticky, so a transform scroller would silently delete
 * two of the three biggest effects on the page. Lenis animates the NATIVE
 * scroll position, so sticky, find-in-page, the scrollbar, keyboard paging and
 * anchor links all keep working exactly as the browser intends.
 *
 * Wheel and keys only. Touch keeps the platform's own momentum (`syncTouch`
 * off, the default): phone scrolling is already inertial, and overriding it
 * costs a frame budget on the weakest devices to make scrolling feel wrong.
 *
 * Reduced motion switches the easing off and leaves scroll tracking the input
 * 1:1. Lenis does that itself via `respectReducedMotion`, but this unmounts the
 * instance outright — no wheel interception at all, which is a stronger
 * guarantee than a lerp of 1.
 */
/**
 * Module-level handle so scroll locks can reach the instance.
 *
 * `document.body.style.overflow = 'hidden'` no longer locks anything on its
 * own: Lenis reads wheel events and drives the scroll position programmatically,
 * and a hidden-overflow viewport is still programmatically scrollable. Anything
 * that opens over the page has to stop Lenis as well, or the page slides
 * around underneath it.
 */
let instance: Lenis | null = null

/** Freeze page scrolling while an overlay is open. Safe to call unsmoothed. */
export function lockPageScroll() {
  instance?.stop()
}

export function unlockPageScroll() {
  instance?.start()
}

export function SmoothScroll() {
  const { reduced, mounted } = useMotionPrefs()
  const lenisRef = useRef<Lenis | null>(null)

  useEffect(() => {
    if (!mounted || reduced) return

    const lenis = new Lenis({
      lerp: smoothScroll.lerp,
      wheelMultiplier: smoothScroll.wheelMultiplier,
      // This component owns the frame loop; see useAnimationFrame below.
      autoRaf: false,
      // Anchor jumps stay instant. The skip link is an accessibility control —
      // gliding a keyboard user 4000px to the content is the opposite of a
      // shortcut — and in-page anchors read as navigation, not scrolling.
      anchors: false,
    })

    lenisRef.current = lenis
    instance = lenis
    return () => {
      lenis.destroy()
      lenisRef.current = null
      instance = null
    }
  }, [mounted, reduced])

  /**
   * Driven from Motion's frame loop, not Lenis's own `requestAnimationFrame`.
   *
   * Two reasons. One loop for the whole app rather than two competing ones. And
   * ordering: Lenis writes the scroll position, Motion's scroll values read it.
   * Inside one loop that happens in a fixed order every frame; across two rAF
   * callbacks the order is whatever the browser scheduled, and a scene can end
   * up a frame behind the page it is pinned to.
   */
  useAnimationFrame((time) => {
    lenisRef.current?.raf(time)
  })

  return null
}
