'use client'

import {
  m,
  useMotionTemplate,
  useMotionValue,
  useMotionValueEvent,
  useScroll,
  useTransform,
  type MotionValue,
} from 'motion/react'
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from 'react'
import { useMotionPrefs } from '@/hooks/useMotionPrefs'
import { offset } from '@/lib/motion'

/**
 * Footer reveal — animation spec section 13, adapted from Motion's
 * `footer-reveal` example (`motion-source/footer-reveal.tsx`).
 *
 * The footer pins to the bottom of the viewport BEHIND the page, and the page
 * content is an opaque sheet that scrolls off it. As it is uncovered it fades
 * in, scales up from 0.9 and sharpens from a 6px blur.
 *
 * The mechanic is CSS, not JS: `position: sticky; bottom: 0` does the pinning
 * for the whole scroll of the root, and the content sheet at `z-index: 1` is
 * what hides it. Motion only drives opacity, scale and blur — nothing here
 * reads scroll position to set `top`, which is why it stays cheap.
 *
 * Three parts, because each needs a different stacking role:
 *
 *   FooterReveal          relative + isolate. Owns progress.
 *   FooterRevealContent   z-index 1, opaque. The cover. Its bottom edge triggers.
 *   FooterRevealFooter    sticky bottom-0, z-index -1. The thing being revealed.
 *
 * This REPLACES the CSS-only version that used to live in globals.css
 * (`.page-content` + `.site-footer` + `--footer-h`). Two things that version
 * got wrong and this one cannot: `--footer-h` was a hardcoded 640px against a
 * footer that actually measures 817px, so the last 177px sat behind an inner
 * scrollbar; and it was switched off below 768px, because a `fixed` footer
 * fights the mobile URL bar. Sticky does not, and the height is measured.
 *
 * The single most common way to break this is overflow clipping. Any ancestor
 * with `overflow: hidden`, `clip`, `auto` or `scroll` on either axis becomes a
 * scroll container, and sticky then pins to that box instead of the viewport:
 * the footer never appears and nothing errors. `useOverflowWarning` catches it
 * in development.
 */

interface FooterRevealContextValue {
  progress: MotionValue<number>
  contentRef: RefObject<HTMLDivElement | null>
  footerHeight: MotionValue<number>
  /** False when the footer is taller than the viewport — see FooterRevealFooter. */
  canPin: boolean
}

const FooterRevealContext = createContext<FooterRevealContextValue | null>(null)

function useFooterReveal(part: string) {
  const context = useContext(FooterRevealContext)
  if (!context) {
    throw new Error(`<${part}> must be rendered inside <FooterReveal>.`)
  }
  return context
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

/* ------------------------------------------------------------------ */
/* Root                                                                 */
/* ------------------------------------------------------------------ */

export function FooterReveal({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  const rootRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  const footerHeight = useMotionValue(0)
  const viewportHeight = useMotionValue(1)
  const [canPin, setCanPin] = useState(false)

  useEffect(() => {
    const update = () => viewportHeight.set(window.innerHeight)
    update()
    window.addEventListener('resize', update)
    // visualViewport tracks the mobile URL bar collapsing, which innerHeight
    // does not always report in time.
    window.visualViewport?.addEventListener('resize', update)
    return () => {
      window.removeEventListener('resize', update)
      window.visualViewport?.removeEventListener('resize', update)
    }
  }, [viewportHeight])

  useOverflowWarning(rootRef)

  /**
   * Raw progress runs 0 to 1 as the content's bottom edge travels from the
   * viewport bottom to the viewport top. That is one full viewport of scroll.
   */
  const { scrollYProgress } = useScroll({
    target: contentRef,
    offset: [...offset.tail],
  })

  /**
   * But the footer is only `footerHeight` tall, so it is fully uncovered once
   * the content bottom has risen that far, not a whole viewport. Rescaling by
   * footerHeight / viewportHeight is what keys the reveal to the footer rather
   * than to the screen.
   */
  const progress = useTransform(
    [scrollYProgress, footerHeight, viewportHeight],
    ([raw, footer, viewport]: number[]) => {
      if (!footer || !viewport) return 0
      const span = Math.min(footer / viewport, 1)
      return clamp(raw / span, 0, 1)
    },
  )

  // The example clamps a too-tall footer's progress at 1 and leaves it at that.
  // We can't: pinning a footer taller than the viewport puts its top edge above
  // the viewport permanently, and the top edge is where the first column
  // headings are. Measured heights here are 817px desktop and 1381px on a
  // phone, so on a 800px laptop and on every phone the reveal has to stand
  // down. Deriving it from the measurement rather than a breakpoint means it
  // engages exactly when it can finish, and the fallback is an ordinary footer.
  useMotionValueEvent(footerHeight, 'change', (height) => {
    setCanPin(height > 0 && height <= viewportHeight.get())
  })
  useMotionValueEvent(viewportHeight, 'change', (viewport) => {
    const height = footerHeight.get()
    setCanPin(height > 0 && height <= viewport)
  })

  return (
    <FooterRevealContext.Provider value={{ progress, contentRef, footerHeight, canPin }}>
      {/*
        `isolation: isolate` is load-bearing. The footer sits at z-index -1, and
        without a stacking context here it would paint behind the page
        background and be invisible. Do not remove it.
      */}
      <div ref={rootRef} className={`relative isolate w-full ${className}`}>
        {children}
      </div>
    </FooterRevealContext.Provider>
  )
}

/* ------------------------------------------------------------------ */
/* Content                                                              */
/* ------------------------------------------------------------------ */

export function FooterRevealContent({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  const { contentRef } = useFooterReveal('FooterRevealContent')

  return (
    <div
      ref={contentRef}
      /*
        The opaque background is not decoration. It is the cover that hides the
        footer. A transparent or unset background here means the footer shows
        through the whole page and there is nothing left to reveal. Vanilla,
        because that is the body ground every section sits on.
      */
      className={`relative z-1 bg-vanilla ${className}`}
    >
      {children}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Footer                                                               */
/* ------------------------------------------------------------------ */

export function FooterRevealFooter({
  children,
  className = '',
  blur = true,
}: {
  children: ReactNode
  className?: string
  /** Blur is a filter and repaints. Set false if you need the cheapest path. */
  blur?: boolean
}) {
  const { progress, footerHeight, canPin } = useFooterReveal('FooterRevealFooter')
  const ref = useRef<HTMLDivElement>(null)
  const { reduced, mounted } = useMotionPrefs()

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const measure = () => footerHeight.set(el.getBoundingClientRect().height)
    measure()

    // Footer height drives the progress scale, so a link column wrapping at a
    // breakpoint has to re-key the whole animation.
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [footerHeight])

  /** Opaque well before full reveal, so the footer is readable as it lands. */
  const opacity = useTransform(progress, [0, 0.65], [0, 1])
  const scale = useTransform(progress, [0, 1], [0.9, 1])
  const blurPx = useTransform(progress, [0, 1], [6, 0])
  const filter = useMotionTemplate`blur(${blurPx}px)`

  // The reveal is one viewport of scroll at the very end of the page; the other
  // 95% of the time this layer sits behind an opaque sheet doing nothing. A
  // `filter` plus `will-change` held there for the whole session promotes a
  // full-width layer that is never visible and never repainted, which is how
  // stale compositor tiles end up on screen. Both are applied only while the
  // reveal is actually running. Nothing pops: at progress 0 the footer is
  // covered, and at 1 the blur has already reached 0.
  const [revealing, setRevealing] = useState(false)
  useMotionValueEvent(progress, 'change', (p) => setRevealing(p > 0.002 && p < 0.99))

  // Mount gate (spec 1.4): on the server `opacity` reads 0, and serialising the
  // footer's links into the HTML at opacity 0 is exactly what that rule exists
  // to stop — spec section 9 leans on those links. Unmounted, unpinned and
  // reduced-motion all render a plain, fully visible footer.
  // `filter: 'none'` rather than omitting the key — Motion leaves a property it
  // has stopped being given at whatever it last wrote, so dropping it would
  // leave a blur layer alive for the rest of the session.
  const active = mounted && canPin && !reduced
  const contentStyle = active
    ? { opacity, scale, filter: blur && revealing ? filter : 'none' }
    : undefined

  return (
    // A div, not a <footer>: the site's own Footer supplies that element, and
    // `<footer>` may not contain a `<footer>` descendant.
    <div
      ref={ref}
      /*
        sticky bottom-0 pins this to the viewport bottom for the entire scroll
        of the root, including while it is still covered. Both are dropped when
        the footer is too tall to pin, which leaves an ordinary footer at the
        end of the page.

        z-0, where the example uses z-index -1. Paint order only needs this to
        be BELOW the content sheet, and 0 < 1 does that on its own — a lower
        z-index paints first no matter the DOM order. Negative z-index means
        "behind my own stacking context's background", a rarer path that has to
        stay correct through promotion and isolation; there is no reason to take
        it when a non-negative value expresses the same thing.

        The bordeaux ground is on this wrapper and not on a separate fading
        layer, because the child scales from 0.9 and a background that scaled
        with it would leave gaps down both sides. The ground must not move.
      */
      className={`${canPin ? 'sticky bottom-0 z-0' : ''} overflow-hidden bg-bordeaux ${className}`}
    >
      <m.div
        style={contentStyle}
        className={
          active && revealing ? 'will-change-[transform,opacity,filter]' : undefined
        }
      >
        {children}
      </m.div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Dev guard                                                            */
/* ------------------------------------------------------------------ */

/**
 * Walks up from the root looking for the one mistake that silently kills this
 * component. Costs nothing in production and saves an afternoon in development.
 */
function useOverflowWarning(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') return

    let node = ref.current?.parentElement
    while (node && node !== document.body) {
      const { overflow, overflowX, overflowY } = getComputedStyle(node)
      const clipping = [overflow, overflowX, overflowY].some((value) => value !== 'visible')

      if (clipping) {
        console.warn(
          '[FooterReveal] An ancestor is clipping overflow, so the sticky footer will pin to it instead of the viewport and never reveal.',
          { element: node, overflow, overflowX, overflowY },
        )
        return
      }
      node = node.parentElement
    }
  }, [ref])
}

/** Progress is published for anything else that wants to react to the reveal. */
export function useFooterRevealProgress() {
  return useFooterReveal('useFooterRevealProgress').progress
}
