"use client"

import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from "motion/react"
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  type ReactNode,
  type RefObject,
} from "react"

/**
 * Footer reveal. react-footer-reveal.
 *
 * A sticky under-page footer. It pins to the bottom of the viewport behind the
 * page, and is uncovered as the content sheet scrolls off it. As it is
 * uncovered it fades in, scales up from 0.9 and sharpens from a 6px blur.
 *
 * The mechanic is CSS, not JS. `position: sticky; bottom: 0` pins the footer to
 * the viewport bottom for the whole scroll of its parent, and an opaque content
 * layer at `z-index: 1` covers it until scroll lifts that layer away. Motion
 * only drives opacity, scale and blur. Nothing here reads scroll position to
 * set `top`, which is why it stays cheap.
 *
 * Three parts, because each needs a different stacking role:
 *
 *   FooterReveal          relative + isolate. Owns progress.
 *   FooterRevealContent   z-index 1, opaque. The cover. Its bottom edge is the trigger.
 *   FooterRevealFooter    sticky bottom-0, z-index -1. The thing being revealed.
 *
 * The single most common way to break this is overflow clipping. Any ancestor
 * with `overflow: hidden`, `clip`, `auto` or `scroll` on either axis creates a
 * scroll container, and sticky then pins to that box instead of the viewport.
 * The footer will simply never appear and nothing will error. There is a dev
 * warning below that catches it.
 */

interface FooterRevealContextValue {
  progress: MotionValue<number>
  contentRef: RefObject<HTMLDivElement | null>
  footerHeight: MotionValue<number>
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
  className = "",
}: {
  children: ReactNode
  className?: string
}) {
  const rootRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  const footerHeight = useMotionValue(0)
  const viewportHeight = useMotionValue(1)

  useEffect(() => {
    const update = () => viewportHeight.set(window.innerHeight)
    update()
    window.addEventListener("resize", update)
    // visualViewport tracks the mobile URL bar collapsing, which innerHeight
    // does not always report in time.
    window.visualViewport?.addEventListener("resize", update)
    return () => {
      window.removeEventListener("resize", update)
      window.visualViewport?.removeEventListener("resize", update)
    }
  }, [viewportHeight])

  useOverflowWarning(rootRef)

  /**
   * Raw progress runs 0 to 1 as the content's bottom edge travels from the
   * viewport bottom to the viewport top. That is one full viewport of scroll.
   */
  const { scrollYProgress } = useScroll({
    target: contentRef,
    offset: ["end end", "end start"],
  })

  /**
   * But the footer is only `footerHeight` tall, so it is fully uncovered once
   * the content bottom has risen that far, not a whole viewport. Rescaling by
   * footerHeight / viewportHeight is what keys the reveal to the footer rather
   * than to the screen. A footer taller than the viewport clamps at 1, since it
   * can never be fully exposed.
   */
  const progress = useTransform(
    [scrollYProgress, footerHeight, viewportHeight],
    ([raw, footer, viewport]: number[]) => {
      if (!footer || !viewport) return 0
      const span = Math.min(footer / viewport, 1)
      return clamp(raw / span, 0, 1)
    }
  )

  return (
    <FooterRevealContext.Provider value={{ progress, contentRef, footerHeight }}>
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
  className = "",
}: {
  children: ReactNode
  className?: string
}) {
  const { contentRef } = useFooterReveal("FooterRevealContent")

  return (
    <div
      ref={contentRef}
      /*
        The opaque background is not decoration. It is the cover that hides the
        footer. A transparent or unset background here means the footer shows
        through the whole page and there is nothing left to reveal.
      */
      className={`relative z-[1] bg-[--vanilla-cream] ${className}`}
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
  className = "",
  blur = true,
}: {
  children: ReactNode
  className?: string
  /** Blur is a filter and repaints. Set false if you need the cheapest path. */
  blur?: boolean
}) {
  const { progress, footerHeight } = useFooterReveal("FooterRevealFooter")
  const ref = useRef<HTMLElement>(null)
  const reduced = useReducedMotion()

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

  const contentStyle = reduced
    ? { opacity }
    : blur
      ? { opacity, scale, filter }
      : { opacity, scale }

  return (
    <footer
      ref={ref}
      /*
        sticky bottom-0 pins this to the viewport bottom for the entire scroll
        of the root, including while it is still covered. z-[-1] puts it under
        the content layer inside the root's isolated stacking context.
      */
      className={`sticky bottom-0 z-[-1] overflow-hidden bg-[--bordeaux-noir] text-[--vanilla-cream] ${className}`}
    >
      {/*
        Surface and content are separate layers on purpose. Scale runs on the
        content only. Scaling the element that carries the background would
        shrink the background too and leave visible gaps down both sides at
        0.9. The surface stays full-bleed and only fades.
      */}
      <motion.div
        aria-hidden
        style={{ opacity }}
        className="absolute inset-0 bg-[--bordeaux-noir]"
      />

      <motion.div
        style={contentStyle}
        className="relative will-change-[transform,opacity,filter]"
      >
        {children}
      </motion.div>
    </footer>
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
    if (process.env.NODE_ENV === "production") return

    let node = ref.current?.parentElement
    while (node && node !== document.body) {
      const { overflow, overflowX, overflowY } = getComputedStyle(node)
      const clipping = [overflow, overflowX, overflowY].some(
        (value) => value !== "visible"
      )

      if (clipping) {
        console.warn(
          "[FooterReveal] An ancestor is clipping overflow, so the sticky footer will pin to it instead of the viewport and never reveal.",
          { element: node, overflow, overflowX, overflowY }
        )
        return
      }
      node = node.parentElement
    }
  }, [ref])
}

/** Progress is published for anything else that wants to react to the reveal. */
export function useFooterRevealProgress() {
  return useFooterReveal("useFooterRevealProgress").progress
}
