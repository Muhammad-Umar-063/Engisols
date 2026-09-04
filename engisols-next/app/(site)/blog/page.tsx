import type { Metadata } from 'next'
import { Band, BandHeading, Blocked } from '@/components/layout/Band'
import { PageHero, ScanCapture } from '@/components/sections/shared'

/**
 * Blog index — content spec section 14. Four sections.
 *
 * Zero posts at launch; phase 4 builds the shell only. The four pillars are
 * rendered as the structure they will fill rather than as empty cards, because
 * an index showing four "coming soon" boxes is worse than one saying plainly
 * that nothing is published yet.
 */

export const metadata: Metadata = {
  title: 'Writing',
  description: 'Notes on stalled builds, AI-generated codebases, and shipping with a small team.',
  alternates: { canonical: '/blog' },
}

const PILLARS = [
  {
    title: 'Rescuing AI-tool builds',
    body: 'What breaks at the 70% wall, why it breaks there, and what the repair actually costs.',
  },
  {
    title: 'Production AI systems',
    body: 'Retrieval, evaluation harnesses, and what these systems cost to run once real traffic arrives.',
  },
  {
    title: 'Working with a small remote team',
    body: 'Overlap hours, ownership, and the mechanics that make offshore delivery work or fail.',
  },
  {
    title: 'Engineering decisions with numbers',
    body: 'Tradeoffs we made on real projects, including the ones we would make differently.',
  },
]

export default function BlogPage() {
  return (
    <>
      <PageHero
        eyebrow="Writing"
        title="Nothing published yet, and we would rather say so."
        lead="The four things we intend to write about are below. When there is something worth reading it appears here — not before."
      />

      <Band ground="vanilla">
        <BandHeading eyebrow="Pillars" title="What this will cover" />
        <div className="mt-step-5 grid gap-step-4 md:grid-cols-2">
          {PILLARS.map((pillar) => (
            <div key={pillar.title} className="border-t border-current/20 pt-step-3">
              <h3 className="font-display text-lg">{pillar.title}</h3>
              <p className="measure mt-step-2 text-sm text-current/80">{pillar.body}</p>
            </div>
          ))}
        </div>
        <div className="mt-step-5">
          <Blocked marker="{{TODO: BLOG}}" need="zero posts at launch — phase 4 builds the shell only" />
        </div>
      </Band>

      <ScanCapture />
    </>
  )
}
