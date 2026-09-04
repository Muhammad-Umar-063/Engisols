'use client'

import { m, useScroll, useTransform } from 'motion/react'
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { useMotionPrefs } from '@/hooks/useMotionPrefs'
import { containerHeightForTravel, scrollTopForIndex } from '@/lib/horizontal-scroll'

/**
 * Scroll horizontal gallery — motion.dev `react-scroll-horizontal`, adapted to
 * this site (animation spec 8.1). A row of fixed-width case-study cards travels
 * sideways as you scroll down: a sticky element holds the row in place while a
 * scroll-linked x translation moves it from the first card centred to the last
 * card centred.
 *
 * Adapted from the framework-agnostic reference in three ways this app
 * requires:
 *
 *   `m`, not `motion`. The app wraps everything in `LazyMotion strict`, where a
 *   raw `motion.*` import throws instead of silently shipping the full bundle.
 *
 *   `useMotionPrefs`, not `useReducedMotion`. It carries the SSR mount gate as
 *   well, so the pinned layout only exists after hydration and never fights the
 *   server render.
 *
 *   Pin only on a wide viewport with motion allowed. Touch devices keep native
 *   horizontal scrolling — hijacking it fights the OS — and reduced motion and
 *   the pre-hydration render fall back to the same native scroll-snap row. All
 *   cards render in both layouts, so every link is in the first HTML response.
 *
 * The row is CENTRED, not left-aligned: it starts with card 0 in the middle and
 * ends with the last card in the middle. That is what the `50vw - card-w/2`
 * leading/trailing padding is for, and why travel is the gap between the first
 * and last card's left edges rather than the track width minus a viewport.
 */

export interface GalleryItem {
  id: string
  title: string
  meta: string
  image: string
  href?: string
}

export function HorizontalScrollGallery({
  items,
  /** Vertical px scrolled per px of horizontal travel. 1 feels neutral. */
  speed = 1,
  heading,
  action,
}: {
  items: GalleryItem[]
  speed?: number
  /** Pinned at the top of the frame while the row slides beneath it. */
  heading?: ReactNode
  /** Pinned at the bottom of the frame, beside the progress line. */
  action?: ReactNode
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLUListElement>(null)
  const { reduced, mounted } = useMotionPrefs()

  const [wide, setWide] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 64rem)')
    const update = () => setWide(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  const pinned = mounted && !reduced && wide

  const [travel, setTravel] = useState(0)
  const [height, setHeight] = useState<number | null>(null)

  /**
   * Travel is the distance between the first and last card's left edges.
   *
   * For a uniform row that equals (count - 1) * (card-w + gap), but measuring it
   * keeps the component correct when the card width or gap changes at a
   * breakpoint — a hardcoded constant silently desyncs and you get dead scroll
   * at the end, or a last card that never centres. Measured once here into
   * state, so the per-frame x mapping stays a cheap number and never reads
   * layout while scrolling.
   */
  const measure = useCallback(() => {
    const track = trackRef.current
    if (!track) return
    const children = Array.from(track.children) as HTMLElement[]
    if (children.length < 2) {
      setTravel(0)
      setHeight(window.innerHeight)
      return
    }
    const first = children[0]
    const last = children[children.length - 1]
    const distance = last.offsetLeft - first.offsetLeft
    setTravel(distance)
    setHeight(containerHeightForTravel(distance, window.innerHeight, speed))
  }, [speed])

  useEffect(() => {
    if (!pinned) return
    measure()
    const track = trackRef.current
    if (!track) return
    const observer = new ResizeObserver(measure)
    observer.observe(track)
    Array.from(track.children).forEach((child) => observer.observe(child))
    window.addEventListener('resize', measure)
    // Card widths shift when the display font swaps in.
    if (document.fonts?.ready) void document.fonts.ready.then(measure)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [measure, items.length, pinned])

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  })

  const x = useTransform(scrollYProgress, [0, 1], [0, -travel])

  /**
   * Keyboard focus has to be translated back into a window scroll position.
   * Tabbing to a card off to the right will not bring it into view on its own:
   * nothing is horizontally scrolled, the row is transformed. So focus computes
   * the vertical position that centres that card and scrolls there.
   */
  const handleFocus = useCallback(
    (index: number) => {
      const container = containerRef.current
      if (!container || !pinned) return
      const rect = container.getBoundingClientRect()
      const containerTop = rect.top + window.scrollY
      window.scrollTo({
        top: scrollTopForIndex({
          index,
          count: items.length,
          containerTop,
          containerHeight: container.offsetHeight,
          viewportHeight: window.innerHeight,
        }),
        behavior: 'smooth',
      })
    },
    [items.length, pinned],
  )

  const cards = items.map((item, i) => (
    <li key={item.id} className="w-[78vw] shrink-0 md:w-[26rem]">
      <a
        href={item.href ?? `#${item.id}`}
        onFocus={() => handleFocus(i)}
        data-cursor="target"
        className="group block no-underline"
      >
        <div className="overflow-hidden rounded-sm bg-bordeaux/10">
          {/* eslint-disable-next-line @next/next/no-img-element -- next/image
              lands with the asset pass; these are real screenshots at known sizes. */}
          <img
            src={item.image}
            alt=""
            className="aspect-4/3 w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            style={{ transitionTimingFunction: 'var(--ease-enter)' }}
          />
        </div>
        <div className="mt-step-2 flex items-baseline justify-between gap-step-2">
          <h3 className="font-display text-xl">{item.title}</h3>
          <span className="font-mono text-sm tabular-nums text-current/50">
            {String(i + 1).padStart(2, '0')}
          </span>
        </div>
        <p className="mt-step-1 font-mono text-xs tracking-tight text-current/60">{item.meta}</p>
      </a>
    </li>
  ))

  // Shared row styling. `--card-w` is set here only so the pinned row's inline
  // `calc()` padding can centre the first and last card; the cards themselves
  // take an explicit width (Tailwind v4 does not read a CSS var back through a
  // `w-[--card-w]` utility, which silently leaves them auto-width). Gap uses the
  // real spacing scale: step-3 = 24px, step-4 = 40px.
  const cardVars = 'gap-step-3 [--card-w:78vw] md:gap-step-4 md:[--card-w:26rem]'

  return (
    // The container ref must be attached from the very first render so useScroll
    // binds to a real element. Swapping the whole subtree in on the pinned flip
    // (rather than styling it in place) leaves useScroll bound to null and
    // progress frozen at 0 — the shipped hero works precisely because its scene
    // ref is always mounted. So this outer element is always rendered; only its
    // children switch between the pinned row and the native scroll-snap fallback
    // (touch, reduced motion, pre-hydration).
    <div
      ref={containerRef}
      style={pinned && height ? { height } : undefined}
      className="relative"
    >
      {pinned ? (
        // The pinned frame is one viewport tall, its cluster anchored near the
        // top with a modest pad. Order top-to-bottom: the cherry edge line, then
        // the heading, then the case studies, then the action — so the heading
        // reads between the line and the cards. The line doubles as the scroll
        // progress, filling left-to-right through the section. overflow-hidden
        // sits on this sticky pane itself, never an ancestor — an ancestor would
        // become the scroll container and break both the pin and the footer
        // reveal.
        <div className="sticky top-0 flex h-svh flex-col justify-start gap-step-4 overflow-hidden pt-step-6">
          <div className="shell">
            <m.div
              aria-hidden
              style={{ scaleX: scrollYProgress }}
              className="h-px origin-left bg-cherry"
            />
          </div>

          {heading ? <div className="shell">{heading}</div> : null}

          <m.ul
            ref={trackRef}
            style={{
              x,
              paddingLeft: 'calc(50vw - var(--card-w) / 2)',
              paddingRight: 'calc(50vw - var(--card-w) / 2)',
            }}
            className={`flex will-change-transform ${cardVars}`}
          >
            {cards}
          </m.ul>

          {action ? <div className="shell">{action}</div> : null}
        </div>
      ) : (
        <div className="shell py-step-5">
          {heading ? <div className="mb-step-4">{heading}</div> : null}
          <ul
            className={`-mx-6 flex snap-x snap-mandatory overflow-x-auto px-6 pb-step-2 *:snap-start md:-mx-10 md:px-10 ${cardVars}`}
          >
            {cards}
          </ul>
          {action ? <div className="mt-step-4">{action}</div> : null}
        </div>
      )}
    </div>
  )
}
