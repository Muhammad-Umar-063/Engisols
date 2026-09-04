'use client'

import { m, useInView } from 'motion/react'
import { useRef } from 'react'
import { useMotionPrefs } from '@/hooks/useMotionPrefs'
import { DUR, EASE } from '@/lib/motion'

/**
 * A four-value IntersectionObserver rootMargin.
 *
 * Motion types `useInView`'s `margin` as a template literal but does not export
 * the type, so it is mirrored here rather than cast away. Narrowed to the
 * four-value form on purpose: the zone this component needs is symmetric top
 * and bottom, and writing all four sides is what makes that visible.
 */
type MarginValue = `${number}${'px' | '%'}`
type Zone = `${MarginValue} ${MarginValue} ${MarginValue} ${MarginValue}`

/**
 * Scroll highlight — animation spec section 10.1.
 *
 * Rows rest at 30% and brighten to full as each one crosses a thin band
 * through the middle of the viewport; a rotated label sticks alongside at the
 * same height, so the reader can see that the band is a fixed line on screen
 * rather than rows lighting up at random.
 *
 * Detection is `useInView` against a collapsed root — the same device the
 * sticky step nav used, and the one spec 10.1 asks for. The active row is
 * decided by geometry, so it never round-trips through React state on a scroll
 * frame. Each row owns its own observer because hooks cannot run in a loop.
 *
 * The highlight is opacity, never colour: cherry is 1.64 against bordeaux, so
 * a colour tween between the two would not read at any size. The cherry rule
 * down the active row is a block, not type, which is the one scale at which
 * that separation is visible.
 *
 * Not `ScrollLineHighlight`, despite the name: that one is scrubbed to scroll
 * progress and brightens hand-broken lines of a paragraph in sequence. This is
 * a discrete active/inactive state on structured rows, and only one row holds
 * it at a time.
 */
export function ScrollHighlight({
  heading,
  items,
  /** Resting opacity for the rows that are not centred. */
  restOpacity = 0.3,
  /**
   * The scroll zone, as an IntersectionObserver rootMargin.
   *
   * This is the whole mechanism. `-48% 0px -48% 0px` collapses the observer
   * root to a thin band across the viewport's centre. Rows are contiguous —
   * spacing is padding, never margin — so at most one can cross that band at a
   * time, and "exactly one row is active" falls out of the geometry instead of
   * being enforced in code. Put gaps between the rows and the band lands in a
   * gap with nothing active, which reads as a flicker between rows.
   *
   * Both directions have a failure mode. Widen the band and two rows light up
   * at once. Narrow it to a true zero-height root and IntersectionObserver
   * stops firing altogether, because a zero-area intersection never exceeds
   * threshold 0.
   */
  zone = '-48% 0px -48% 0px',
}: {
  /** Sticky rotated label. Desktop only — omit it and the column collapses. */
  heading?: string
  items: { title: string; body: string }[]
  restOpacity?: number
  zone?: Zone
}) {
  return (
    <div className="grid gap-step-3 lg:grid-cols-[auto_1fr] lg:gap-step-5">
      {heading ? (
        /*
          writing-mode rather than a rotate transform. A rotate leaves the
          layout box horizontal, so the grid column would still reserve the
          full width of the word and shove the list sideways; writing-mode
          gives the element a genuinely vertical box, so the column is only as
          wide as the text is tall. `h-max` is what un-stretches the grid item
          — a stretched item is already the full height of the row and has
          nowhere to travel. Sticking at 50vh with a -50% translate lands it on
          the same line as the scroll zone above.
        */
        <p
          aria-hidden
          className="sticky top-[50vh] hidden h-max -translate-y-1/2 rotate-180 font-mono text-xs uppercase tracking-[0.35em] text-current/50 [writing-mode:vertical-rl] lg:block"
        >
          {heading}
        </p>
      ) : null}

      {/*
        No 40vh of padding above and below the list. The source demo needs it
        so its first and last items can reach the centre of the screen, because
        there the list is the whole page. This sits eighth of twelve sections,
        with a page above it and a page below it, so every row crosses the
        centre on the way past — the padding would buy nothing but 80vh of
        empty bordeaux.
      */}
      <ol className="border-t border-current/15">
        {items.map((item, i) => (
          <Row
            key={item.title}
            index={i}
            title={item.title}
            body={item.body}
            restOpacity={restOpacity}
            zone={zone}
          />
        ))}
      </ol>
    </div>
  )
}

function Row({
  title,
  body,
  index,
  restOpacity,
  zone,
}: {
  title: string
  body: string
  index: number
  restOpacity: number
  zone: Zone
}) {
  const ref = useRef<HTMLLIElement>(null)
  const { mounted, reduced } = useMotionPrefs()
  const inView = useInView(ref, { margin: zone })

  // Mount gate (spec 1.4). `mounted` is false on the server, so the HTML ships
  // every row at full opacity: a JS failure leaves this section readable
  // instead of five rows of 30% vanilla. Reduced motion holds it there —
  // dimming and undimming rows as the page scrolls is precisely the motion
  // that preference asks us to drop.
  const dimmed = mounted && !reduced && !inView
  const active = mounted && inView

  return (
    <m.li
      ref={ref}
      className="relative border-b border-current/15 py-step-4 pl-step-3"
      initial={false}
      animate={{ opacity: dimmed ? restOpacity : 1 }}
      transition={{ duration: DUR.standard, ease: EASE.enter }}
    >
      {/*
        The marker travels between rows on a `layoutId` rather than fading in
        and out per row (spec 10.1). Only one row is ever active, so there is
        only ever one of these in the tree.
      */}
      {active ? (
        <m.span
          layoutId="commitment-marker"
          className="absolute left-0 top-0 h-full w-0.5 bg-cherry"
          transition={reduced ? { duration: 0 } : EASE.spring}
        />
      ) : null}

      <span className="font-mono text-xs text-current/50">
        {String(index + 1).padStart(2, '0')}
      </span>
      <h3 className="mt-step-1 text-[clamp(1.375rem,2.6vw,2.125rem)]">{title}</h3>
      <p className="measure mt-step-2 text-current/80">{body}</p>
    </m.li>
  )
}
