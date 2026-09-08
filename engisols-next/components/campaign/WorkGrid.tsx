'use client'

import Image from 'next/image'
import { m } from 'motion/react'
import { useRef, useState, type ReactNode, type UIEvent } from 'react'
import { useMotionPrefs } from '@/hooks/useMotionPrefs'
import { useReveal } from '@/components/motion/Reveal'
import { DUR, EASE } from '@/lib/motion'
import { SheetModal } from '@/components/motion/SheetModal'
import { lpWork } from '@/content/campaign'
import { Card, TickItem } from '@/components/campaign/ui'

const DISPLAY_ORDER = [4, 1, 0, 3, 2, 5]

/**
 * One card. Split out so each owns its own reveal gate — a hook cannot run in a
 * loop, and the cards must arrive one after another rather than as a block.
 */
function WorkCard({
  index: i,
  reduced,
  children,
}: {
  index: number
  reduced: boolean
  children: ReactNode
}) {
  const { ref, hidden } = useReveal<HTMLLIElement>()

  return (
    <m.li
      ref={ref}
      initial={false}
      animate={hidden ? { opacity: 0, y: 16 } : { opacity: 1, y: 0 }}
      transition={
        hidden
          ? { duration: 0 }
          : { duration: DUR.standard, ease: EASE.enter, delay: reduced ? 0 : (i % 3) * 0.05 }
      }
      className="min-w-[76vw] max-w-[20rem] shrink-0 snap-start md:max-w-none md:min-w-0"
    >
      {children}
    </m.li>
  )
}

/**
 * The work grid, as drawn: mark tile, name, one line, tag row, "View project →".
 *
 * In the comp that link goes to the portfolio's case studies, which is the one
 * destination this page may not offer. It opens a dialog on the page carrying
 * the same card content instead — the label and the arrow are the comp's, and
 * the visitor stays on the page the ad paid for.
 *
 * The whole card is the button. A card that looks clickable and is not is worse
 * than one that never offered.
 *
 * The tile shows the client's own mark where one exists, on a light ground so
 * the logo keeps its own colours — the four that have a public brand. The two
 * that do not fall back to the comp's letterform on bordeaux, which is why the
 * tile has two treatments rather than one.
 */
export function WorkGrid() {
  const [open, setOpen] = useState<number | null>(null)
  const [activeProject, setActiveProject] = useState(0)
  const railRef = useRef<HTMLUListElement>(null)
  const { reduced } = useMotionPrefs()
  const project = open === null ? null : lpWork.projects[open]

  function scrollToProject(index: number) {
    const bounded = Math.max(0, Math.min(DISPLAY_ORDER.length - 1, index))
    const rail = railRef.current
    const card = rail?.children.item(bounded) as HTMLElement | null
    if (!rail || !card) return
    const first = rail.firstElementChild as HTMLElement | null
    rail.scrollTo({
      left: card.offsetLeft - (first?.offsetLeft ?? 0),
      behavior: reduced ? 'auto' : 'smooth',
    })
    setActiveProject(bounded)
  }

  function updateProjectPosition(event: UIEvent<HTMLUListElement>) {
    const rail = event.currentTarget
    const first = rail.firstElementChild as HTMLElement | null
    if (!first) return
    const gap = Number.parseFloat(getComputedStyle(rail).columnGap) || 0
    setActiveProject(
      Math.min(
        DISPLAY_ORDER.length - 1,
        Math.round(rail.scrollLeft / (first.offsetWidth + gap)),
      ),
    )
  }

  return (
    <>
      <div className="mt-step-3 flex items-center justify-between gap-step-2 md:hidden">
        <p className="font-mono text-[0.65rem] font-semibold tracking-[0.08em] text-bordeaux/60">
          PROJECT <span className="text-bordeaux tabular-nums">{String(activeProject + 1).padStart(2, '0')}</span> / {String(DISPLAY_ORDER.length).padStart(2, '0')}
        </p>
        <div className="flex items-center gap-step-1">
          <button
            type="button"
            aria-label="Previous project"
            disabled={activeProject === 0}
            onClick={() => scrollToProject(activeProject - 1)}
            className="grid size-11 place-items-center rounded-full border border-greige/60 transition-colors hover:border-bordeaux disabled:cursor-not-allowed disabled:opacity-30"
          >
            <svg viewBox="0 0 20 20" aria-hidden className="size-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="m12.5 4.5-5 5.5 5 5.5M8 10h8" />
            </svg>
          </button>
          <button
            type="button"
            aria-label="Next project"
            disabled={activeProject === DISPLAY_ORDER.length - 1}
            onClick={() => scrollToProject(activeProject + 1)}
            className="grid size-11 place-items-center rounded-full border border-bordeaux bg-bordeaux text-vanilla transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-30"
          >
            <svg viewBox="0 0 20 20" aria-hidden className="size-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="m7.5 4.5 5 5.5-5 5.5M12 10H4" />
            </svg>
          </button>
        </div>
      </div>
      <ul
        ref={railRef}
        onScroll={updateProjectPosition}
        aria-label="Selected client projects"
        className="-mx-step-2 mt-step-2 flex snap-x snap-mandatory gap-step-2 overflow-x-auto px-step-2 pb-step-2 pr-step-5 [scrollbar-width:none] md:mx-0 md:mt-step-4 md:grid md:grid-cols-2 md:overflow-visible md:px-0 md:pb-0 xl:grid-cols-3 [&::-webkit-scrollbar]:hidden"
      >
        {DISPLAY_ORDER.map((projectIndex, displayIndex) => {
          const item = lpWork.projects[projectIndex]
          return (
            <WorkCard key={item.name} index={displayIndex} reduced={reduced}>
            {/* No `data-cursor`: the card is already a shape, and wrapping a
                240px card in a cursor slab covers the content being pointed
                at. The hover lift is the affordance. */}
            <button
              type="button"
              onClick={() => setOpen(projectIndex)}
              className="h-full w-full text-left"
            >
              <Card className="flex h-full min-h-[19rem] flex-col transition-colors duration-200 hover:border-greige md:min-h-0">
                <div className="flex items-start gap-step-2">
                  {item.logo ? (
                    <span
                      aria-hidden
                      className="grid size-10 shrink-0 place-items-center gap-0.5 rounded-xl border border-greige/40 bg-vanilla p-1.5"
                    >
                      <Image
                        src={item.logo}
                        alt=""
                        width={28}
                        height={28}
                        unoptimized
                        className="size-full object-contain"
                      />
                    </span>
                  ) : (
                    <span
                      aria-hidden
                      className="grid size-10 shrink-0 place-items-center rounded-xl bg-bordeaux font-display text-base text-vanilla"
                    >
                      {item.initial}
                    </span>
                  )}
                  <span className="min-w-0">
                    <span className="block font-display text-base font-medium">
                      {item.name}
                    </span>
                    <span className="mt-1 block text-sm text-bordeaux/70">{item.blurb}</span>
                  </span>
                </div>

                <ul className="mt-step-3 mb-step-3 flex flex-wrap gap-1.5">
                  {item.tags.map((tag) => (
                    <li
                      key={tag}
                      className="rounded-full border border-greige/50 px-step-1 py-0.5 font-mono text-[0.65rem] text-bordeaux/70"
                    >
                      {tag}
                    </li>
                  ))}
                </ul>

                {item.facts ? (
                  <dl className="mb-step-3 grid grid-cols-2 gap-step-2 border-y border-greige/35 py-step-2">
                    {item.facts.slice(0, 2).map((fact) => (
                      <div key={fact.label}>
                        <dt className="text-xs leading-tight text-bordeaux/55">{fact.label}</dt>
                        <dd className="mt-1 font-display text-xl font-semibold tabular-nums">{fact.value}</dd>
                      </div>
                    ))}
                  </dl>
                ) : null}

                {/* Pinned to the foot of the card. The blurbs run to one or
                    two lines, so in normal flow these landed at three different
                    heights across the row and the grid read as ragged — the
                    same fix the five checks needed. */}
                <span className="mt-auto inline-flex items-center gap-1.5 border-t border-greige/30 pt-step-2 font-mono text-xs underline decoration-bordeaux/40 underline-offset-4">
                  {lpWork.view}
                  <span aria-hidden>→</span>
                </span>
              </Card>
            </button>
            </WorkCard>
          )
        })}
      </ul>

      <SheetModal
        open={project !== null}
        onClose={() => setOpen(null)}
        title={project?.name ?? ''}
        themeClassName="engisols-campaign-brand"
      >
        {project ? (
          <div className="text-bordeaux">
            {/* The product as it actually ships. Repeating the card's one-liner
                and nothing else was the entire dialog before, which read as a
                placeholder — the reader had just seen every word of it on the
                card they clicked. */}
            {project.image ? (
              <Image
                src={project.image}
                alt={`${project.name} interface`}
                width={1200}
                height={750}
                // `object-top` for the four site captures, whose subject is the
                // top of the page. Genie's is a single centred object on black,
                // and a top-anchored crop cuts it in half.
                className={`aspect-[8/5] w-full rounded-xl border border-greige/40 object-cover ${
                  project.imageAnchor === 'center' ? 'object-center' : 'object-top'
                }`}
              />
            ) : null}

            <p className="mt-step-3 text-base leading-relaxed">
              {project.summary ?? project.blurb}
            </p>

            {project.facts ? (
              <dl className="mt-step-3 grid grid-cols-2 gap-step-2 sm:grid-cols-3">
                {project.facts.map((fact) => (
                  <div key={fact.label} className="border-t border-cherry pt-step-1">
                    <dt className="sr-only">{fact.label}</dt>
                    <dd>
                      <span className="block font-display text-xl tabular-nums">
                        {fact.value}
                      </span>
                      <span className="mt-0.5 block text-xs text-bordeaux/65">
                        {fact.label}
                      </span>
                    </dd>
                  </div>
                ))}
              </dl>
            ) : null}

            {project.built ? (
              <>
                <p className="mt-step-4 font-mono text-xs tracking-[0.08em] text-bordeaux/60">
                  WHAT WE BUILT
                </p>
                <ul className="mt-step-2 space-y-1.5 text-sm">
                  {project.built.map((line) => (
                    <TickItem key={line} className="text-bordeaux/85">
                      {line}
                    </TickItem>
                  ))}
                </ul>
              </>
            ) : null}

            <ul className="mt-step-4 flex flex-wrap gap-1.5 border-t border-greige/40 pt-step-3">
              {project.tags.map((tag) => (
                <li
                  key={tag}
                  className="rounded-full border border-greige/50 px-step-1 py-0.5 font-mono text-[0.65rem] text-bordeaux/70"
                >
                  {tag}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </SheetModal>
    </>
  )
}
