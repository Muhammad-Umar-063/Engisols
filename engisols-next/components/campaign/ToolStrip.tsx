'use client'

import Image from 'next/image'
import { Ticker } from '@/components/motion/Ticker'
import { lpTools } from '@/content/campaign'

/**
 * The tool strip — vendor marks with their names, sliding.
 *
 * A marquee rather than a static row, for a structural reason rather than a
 * decorative one: seven logo chips do not fit a phone, and the alternatives are
 * wrapping them into a second line (which doubles the strip and breaks the
 * comp's proportion) or a scroll container nobody realises they can scroll. The
 * loop shows every tool at every width without being told.
 *
 * `Ticker` is the site's own CSS marquee: the set is duplicated inside ONE
 * track that translates -50% on an infinite linear loop, so the seam is
 * invisible and no JavaScript runs. It pauses on hover and stops flat under
 * reduced motion, where the edges also unmask and it becomes a scroller.
 *
 * The marks keep their own colours. They belong to other companies, and
 * repainting them into this palette would be wrong on the design and, for
 * several of them, on the trademark. What the palette owns is the chip.
 *
 * `unoptimized`: these are already 128px squares, and running a dozen of them
 * through the image optimiser to emit 128px squares is a build step that
 * changes nothing.
 *
 * NO HOVER. The chips sit inside a strip bounded by a hairline top and bottom,
 * and a 2px lift carried each one over the top rule — the chip looked like it
 * had come unstuck and the rule looked broken where it passed behind. There is
 * nothing to hover for in any case: these are marks, not controls.
 */
export function ToolStrip() {
  return (
    <Ticker spacing="tight">
      {lpTools.tools.map((tool) => (
        <span
          key={tool.name}
          className="flex items-center gap-step-2 rounded-full border border-greige/50 py-1.5 pl-2 pr-step-3 whitespace-nowrap"
        >
          <Image
            src={tool.icon}
            alt=""
            width={22}
            height={22}
            unoptimized
            className="size-[22px] shrink-0 rounded-sm object-contain"
          />
          <span className="font-display text-sm">{tool.name}</span>
        </span>
      ))}
    </Ticker>
  )
}
