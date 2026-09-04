'use client'

import { m } from 'motion/react'
import { useState } from 'react'
import { useMotionPrefs } from '@/hooks/useMotionPrefs'
import { DUR, EASE } from '@/lib/motion'
import { SheetModal } from '@/components/motion/SheetModal'
import { lpWork } from '@/content/campaign'
import { Card } from '@/components/campaign/ui'

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
 */
export function WorkGrid() {
  const [open, setOpen] = useState<number | null>(null)
  const { mounted, reduced } = useMotionPrefs()
  const project = open === null ? null : lpWork.projects[open]

  return (
    <>
      <ul className="mt-step-5 grid gap-step-2 md:grid-cols-2 xl:grid-cols-3">
        {lpWork.projects.map((item, i) => (
          <m.li
            key={item.name}
            initial={reduced || !mounted ? false : { opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-10%' }}
            transition={{ duration: DUR.standard, ease: EASE.enter, delay: (i % 3) * 0.05 }}
          >
            {/* No `data-cursor`: the card is already a shape, and wrapping a
                240px card in a cursor slab covers the content being pointed
                at. The hover lift is the affordance. */}
            <button
              type="button"
              onClick={() => setOpen(i)}
              className="h-full w-full text-left"
            >
              <Card className="h-full transition-colors duration-200 hover:border-greige">
                <div className="flex items-start gap-step-2">
                  <span
                    aria-hidden
                    className="grid size-10 shrink-0 place-items-center rounded-xl bg-bordeaux font-display text-base text-vanilla"
                  >
                    {item.initial}
                  </span>
                  <span className="min-w-0">
                    <span className="block font-display text-base font-medium">
                      {item.name}
                    </span>
                    <span className="mt-1 block text-sm text-bordeaux/70">{item.blurb}</span>
                  </span>
                </div>

                <ul className="mt-step-3 flex flex-wrap gap-1.5">
                  {item.tags.map((tag) => (
                    <li
                      key={tag}
                      className="rounded-full border border-greige/50 px-step-1 py-0.5 font-mono text-[0.65rem] text-bordeaux/70"
                    >
                      {tag}
                    </li>
                  ))}
                </ul>

                <span className="mt-step-3 inline-flex items-center gap-1.5 font-mono text-xs underline decoration-bordeaux/40 underline-offset-4">
                  {lpWork.view}
                  <span aria-hidden>→</span>
                </span>
              </Card>
            </button>
          </m.li>
        ))}
      </ul>

      <SheetModal
        open={project !== null}
        onClose={() => setOpen(null)}
        title={project?.name ?? ''}
      >
        {project ? (
          <div className="text-bordeaux">
            <p className="text-base leading-relaxed">{project.blurb}</p>
            <ul className="mt-step-3 flex flex-wrap gap-1.5">
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
