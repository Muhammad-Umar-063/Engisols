'use client'

import {
  m,
  useScroll,
  useSpring,
  useTransform,
  useMotionTemplate,
  useMotionValueEvent,
} from 'motion/react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useMotionPrefs } from '@/hooks/useMotionPrefs'
import { offset, spring } from '@/lib/motion'

/**
 * Hero scroll zoom — animation spec section 3.1, adapted from Motion's
 * `scroll-zoom-hero` example (`motion-source/scroll-zoom-hero.tsx`).
 *
 * Three things carried over from the example:
 *
 *  1. A STICKY visual plane. The backdrop is pinned to the top of the viewport
 *     inside a scene that is taller than it, which is what gives the zoom room
 *     to run. Nothing is scroll-jacked: native scrolling, keyboard paging and
 *     browser find all still work, because the scrollbar is only ever read.
 *  2. SPRING-SMOOTHED progress. Every transform reads `smooth`, not the raw
 *     progress, so a mouse wheel's discrete steps arrive as a continuous scrub.
 *  3. TWO PLANES at different speeds. The backdrop holds still and scales; the
 *     copy keeps moving and fades out early. The example gets that separation
 *     by translating pinned copy inside a pinned frame — see below for why the
 *     copy plane here stays in normal flow instead.
 *
 * What is NOT carried over: the example's full-bleed image and its darkening
 * scrim. The backdrop stays whatever this site passes in (the particle field),
 * and the ground stays flat oat.
 *
 * Why the copy is not pinned. The example pins one screenful of copy — an
 * eyebrow and a headline. This hero runs badge → headline → subtitle → CTA pair
 * → stats row, which is taller than a laptop viewport. A `sticky` element
 * taller than the viewport pins its top and puts everything below the fold out
 * of reach permanently, so pinning it would make the stats row unreachable on
 * the machines most likely to see it. The backdrop plane is pinned instead, the
 * copy scrolls, and the separation between them is the same effect.
 *
 * Spec values, desktop: scale 1→1.32, blur 0→10px (done by 0.9), backdrop gone
 * by 0.85, copy -90px and faded by 0.55. Mobile halves them: 1.12 / 5px / -40px.
 * Scrubbed travel is exempt from the 24px entrance cap (spec 1.2) — large travel
 * is the point of parallax.
 *
 * Reduced motion: no scale, no blur, no parallax; the backdrop opacity fade
 * stays so the section transition still reads.
 */
export function ZoomHeroScene({
  children,
  backdrop,
}: {
  children: ReactNode
  backdrop?: ReactNode
}) {
  const sceneRef = useRef<HTMLDivElement>(null)
  const { reduced } = useMotionPrefs()
  const [mobile, setMobile] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 47.9rem)')
    const update = () => setMobile(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  // `away`, not the example's `through`: the copy is in normal flow, so the
  // scrub has to span the whole time the hero is on screen. `through` spans
  // `scene height - viewport`, which is the right answer only when everything
  // inside the scene is pinned.
  const { scrollYProgress } = useScroll({
    target: sceneRef,
    offset: [...offset.away],
  })

  const smooth = useSpring(scrollYProgress, spring.scroll)

  const scale = useTransform(smooth, [0, 1], [1, mobile ? 1.12 : 1.32])
  const blurPx = useTransform(smooth, [0, 0.9], [0, mobile ? 5 : 10])
  const bgOpacity = useTransform(smooth, [0, 0.85], [1, 0])
  const contentY = useTransform(smooth, [0, 1], [0, mobile ? -40 : -90])
  const contentOpacity = useTransform(smooth, [0, 0.55], [1, 0])
  const filter = useMotionTemplate`blur(${blurPx}px)`

  // `filter` and `will-change` both force this full-screen layer onto the
  // compositor, and they are only worth paying for while the scrub is actually
  // running. Held at rest — which is the state the hero is in on every page
  // load — a promoted, filtered, canvas-bearing layer the size of the viewport
  // is the configuration most likely to leave unpainted tiles behind. Scale and
  // opacity stay on always: they are the effect, and neither promotes on its
  // own. `blur(0px)` is not free either, so it is gone entirely at rest.
  // The band stops short of both ends so the resting states — hero on screen,
  // hero fully scrolled past — are genuinely unpromoted. `blur(0px)` still
  // builds a filter layer, so at rest the property has to be `none`, and it has
  // to be SET to none: dropping a key from `style` leaves whatever Motion last
  // wrote inline, it does not clear it.
  //
  // Gated on the raw progress rather than the spring, because the spring can
  // rest a hair above zero after a scroll settles and that is enough to keep
  // the layer promoted for the whole session.
  const [scrubbing, setScrubbing] = useState(false)
  useMotionValueEvent(scrollYProgress, 'change', (p) =>
    setScrubbing(p > 0.002 && p < 0.99),
  )

  return (
    <div ref={sceneRef} className="relative isolate">
      {backdrop ? (
        // The pin. `overflow-hidden` sits on the sticky pane itself and NOT on
        // any ancestor of it: `overflow: hidden` makes an element a scroll
        // container, and a sticky element sticks to its nearest scrolling
        // ancestor — put it one level up and the pin silently stops working.
        // z-0 with the copy layer at z-1, rather than a negative z-index here:
        // same paint order, without asking a promoted layer to sit behind its
        // own stacking context's background.
        <div aria-hidden className="pointer-events-none absolute inset-0 z-0">
          <div className="sticky top-0 h-svh overflow-hidden">
            <m.div
              className={`absolute inset-0 ${scrubbing ? 'will-change-transform' : ''}`}
              style={
                reduced
                  ? { opacity: bgOpacity }
                  : { scale, opacity: bgOpacity, filter: scrubbing ? filter : 'none' }
              }
            >
              {backdrop}
            </m.div>
          </div>
        </div>
      ) : null}

      <m.div
        className="relative z-1"
        style={reduced ? undefined : { y: contentY, opacity: contentOpacity }}
      >
        {children}
      </m.div>

      {/* Runway. The pin lasts `scene height - viewport`, so without this the
          backdrop unpins almost immediately and there is no zoom to see. Desktop
          only: on phones the backdrop is off (particle field is gated behind a
          fine pointer) and the scroll would buy nothing. Reduced motion drops it
          in CSS — nothing zooms there, so it would be scrolling for no reason. */}
      <div aria-hidden className="zoom-hero-runway hidden md:block md:h-[22vh]" />
    </div>
  )
}
