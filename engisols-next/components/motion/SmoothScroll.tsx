'use client'

import Lenis from 'lenis'
import { useAnimationFrame } from 'motion/react'
import { usePathname } from 'next/navigation'
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

/**
 * Scroll to an in-page target, smoothly, through whatever is driving the page.
 *
 * In-page anchors are the campaign landing page's entire navigation, and they
 * cannot be left to the browser here. Lenis is configured `anchors: false` — a
 * deliberate choice for the site, where the only anchor is the skip link and
 * gliding a keyboard user 4000px is the opposite of a shortcut — so a bare
 * `href="#checks"` jumps instantly. Native `scrollIntoView({ behavior:
 * 'smooth' })` is worse: it and Lenis would both be animating the same scroll
 * position, and the page stutters between them.
 *
 * So: hand it to Lenis when Lenis is running, and fall back to the browser's
 * own smooth scroll when it is not — which is the reduced-motion case, where
 * the browser will honour the preference and not animate at all.
 */
export function scrollToTarget(selector: string, offset = -96) {
  if (instance) {
    instance.scrollTo(selector, { offset })
    return
  }
  document.querySelector(selector)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

export function SmoothScroll() {
  const { reduced, mounted } = useMotionPrefs()
  const lenisRef = useRef<Lenis | null>(null)
  const pathname = usePathname()

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

  /**
   * Land at the top of the page on a route change.
   *
   * The App Router already scrolls to the top on a client navigation, and with
   * this component unmounted — reduced motion — that is exactly what happens.
   * With Lenis running it does not: Lenis keeps its own `animatedScroll` and
   * writes it to the document on the next frame, so a navigation from 2500px
   * down lands 2500px down the new page. The router's scroll reset is not
   * fighting a CSS rule, it is being overwritten a frame later.
   *
   * `immediate` resets Lenis's internal position rather than animating to it,
   * which is what makes this a fix and not a second glide. `force` because a
   * navigation can start from a state where scrolling is locked — a link
   * inside an open sheet — and a stopped Lenis ignores an unforced scrollTo.
   *
   * Not on first mount: `lenisRef.current` is still null on the first pass
   * (the instance is created only once `mounted` flips), so a reload's
   * restored scroll position is left where the browser put it.
   *
   * A hash is the router's business, not this component's — `anchors: false`
   * above means Lenis is deliberately not in the anchor path, and jumping to
   * the top would undo the jump to the target.
   *
   * Back and forward are unaffected, which is worth stating because the naive
   * reading of this effect says they should break — popstate changes the
   * pathname too, so this runs there as well. Measured over repeated
   * navigations: forward links land at 0, and back and forward return to the
   * exact offset the reader left (1995 -> 0 -> back to 1995, forward to 895).
   * Next restores the remembered position after this effect has run, and Lenis
   * picks that up as an external scroll rather than overriding it. That
   * ordering is the router's, not something this file controls — if a Next
   * upgrade ever inverts it, the symptom is back/forward landing at the top,
   * and the fix is to skip this reset on popstate.
   */
  useEffect(() => {
    if (window.location.hash) return
    lenisRef.current?.scrollTo(0, { immediate: true, force: true })
  }, [pathname])

  return null
}
