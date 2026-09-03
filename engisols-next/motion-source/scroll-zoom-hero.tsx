"use client"

import { motion, useScroll, useSpring, useTransform } from "motion/react"
import { useRef, type ReactNode } from "react"
import { offset, spring } from "@/lib/motion"

/* ------------------------------------------------------------------ */
/* Scroll zoom hero                                                     */
/* react-scroll-zoom-hero / vue-scroll-zoom-hero                        */
/* ------------------------------------------------------------------ */

/**
 * Full-bleed hero that scales up and fades out as you scroll past it, with the
 * headline drifting at a slower rate than the image behind it.
 *
 * The section is taller than the viewport and the visual is `sticky` inside it,
 * which is what gives the zoom room to run without hijacking the scrollbar. No
 * scroll-jacking library, so native scrolling, keyboard paging and browser find
 * all still work.
 */
export function ScrollZoomHero({
  image,
  eyebrow,
  headline,
  children,
}: {
  image: string
  eyebrow?: string
  headline: ReactNode
  children?: ReactNode
}) {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: offset.through as never,
  })

  const smooth = useSpring(scrollYProgress, spring.scroll)

  const scale = useTransform(smooth, [0, 1], [1, 1.35])
  const imageOpacity = useTransform(smooth, [0, 0.75, 1], [1, 1, 0])
  const overlay = useTransform(smooth, [0, 1], [0.45, 0.9])

  // Copy travels less than the image, so the two planes separate on scroll.
  const copyY = useTransform(smooth, [0, 1], ["0%", "-38%"])
  const copyOpacity = useTransform(smooth, [0, 0.55], [1, 0])

  return (
    <section ref={ref} className="relative h-[220vh]">
      <div className="sticky top-0 h-screen overflow-hidden">
        <motion.div
          style={{ scale, opacity: imageOpacity }}
          className="absolute inset-0 will-change-transform"
        >
          {/* Plain <img> so this file stays framework-agnostic. Swap for
              next/image with priority + fill when you drop it into the site. */}
          <img src={image} alt="" className="h-full w-full object-cover" />
        </motion.div>

        <motion.div
          style={{ opacity: overlay }}
          className="absolute inset-0 bg-[--bordeaux-noir]"
        />

        <motion.div
          style={{ y: copyY, opacity: copyOpacity }}
          className="relative flex h-full flex-col justify-end p-8 md:p-16"
        >
          {eyebrow ? (
            <span className="mb-4 text-sm tracking-wide text-[--warm-greige]">{eyebrow}</span>
          ) : null}
          <h1 className="max-w-[18ch] text-5xl leading-[0.95] text-[--vanilla-cream] md:text-8xl">
            {headline}
          </h1>
          {children}
        </motion.div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* Scroll image reveal                                                  */
/* react-scroll-image-reveal                                            */
/* ------------------------------------------------------------------ */

/**
 * The image is uncovered by an expanding clip, and inside that clip it counter-
 * scales from 1.3 down to 1. The counter-scale is the detail that sells it: a
 * clip alone looks like a wipe, but pairing it with the image settling into
 * place reads as the frame opening onto something already in motion.
 */
export function ScrollImageReveal({
  src,
  alt,
  caption,
  direction = "up",
}: {
  src: string
  alt: string
  caption?: string
  direction?: "up" | "left"
}) {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: offset.enter as never,
  })

  const smooth = useSpring(scrollYProgress, spring.scroll)
  const reveal = useTransform(smooth, [0, 1], [100, 0])

  const clipPath = useTransform(reveal, (v) =>
    direction === "up"
      ? `inset(${v}% 0% 0% 0% round 2px)`
      : `inset(0% ${v}% 0% 0% round 2px)`
  )

  const scale = useTransform(smooth, [0, 1], [1.3, 1])
  const captionOpacity = useTransform(smooth, [0.6, 1], [0, 1])

  return (
    <figure ref={ref as React.RefObject<HTMLElement>} className="relative">
      <motion.div style={{ clipPath }} className="overflow-hidden">
        <motion.img
          src={src}
          alt={alt}
          style={{ scale }}
          className="w-full will-change-transform"
        />
      </motion.div>
      {caption ? (
        <motion.figcaption
          style={{ opacity: captionOpacity }}
          className="mt-3 text-sm text-[--warm-greige]"
        >
          {caption}
        </motion.figcaption>
      ) : null}
    </figure>
  )
}

/* ------------------------------------------------------------------ */
/* Horizontal scroll gallery                                            */
/* react-scroll-horizontal / vue-scroll-horizontal                      */
/* ------------------------------------------------------------------ */

/**
 * Vertical scroll drives a horizontal track. The section's height is derived
 * from the track width, so the mapping is 1:1 and never runs out of runway or
 * leaves dead scroll at the end.
 *
 * `x` is a percentage of the track's own width, which means it stays correct if
 * the number of panels changes without any JS re-measurement.
 */
export function HorizontalScrollGallery({
  items,
}: {
  items: { id: string; title: string; meta: string; image: string }[]
}) {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: offset.through as never,
  })

  const smooth = useSpring(scrollYProgress, spring.scroll)

  // Travel = total track width minus one viewport.
  const x = useTransform(smooth, [0, 1], ["0%", `-${((items.length - 1) / items.length) * 100}%`])

  return (
    <section
      ref={ref}
      style={{ height: `${items.length * 80}vh` }}
      className="relative"
      aria-roledescription="carousel"
    >
      <div className="sticky top-0 flex h-screen items-center overflow-hidden">
        <motion.ul
          style={{ x, width: `${items.length * 100}vw` }}
          className="flex will-change-transform"
        >
          {items.map((item, i) => (
            <li
              key={item.id}
              className="flex h-screen w-screen shrink-0 flex-col justify-center px-8 md:px-24"
            >
              <div className="flex items-baseline gap-4">
                <span className="text-sm text-[--warm-greige]">
                  {String(i + 1).padStart(2, "0")} / {String(items.length).padStart(2, "0")}
                </span>
                <span className="text-sm text-[--warm-greige]">{item.meta}</span>
              </div>
              <h3 className="mt-3 max-w-[14ch] text-4xl leading-tight md:text-6xl">
                {item.title}
              </h3>
              <img
                src={item.image}
                alt=""
                className="mt-8 h-[42vh] w-full max-w-3xl rounded-sm object-cover"
              />
            </li>
          ))}
        </motion.ul>

        <motion.div
          style={{ scaleX: smooth }}
          className="absolute bottom-10 left-8 right-8 h-px origin-left bg-[--cherry-velvet]"
        />
      </div>
    </section>
  )
}
