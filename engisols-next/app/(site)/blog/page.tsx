import { createPageMetadata } from '@/lib/seo'
import Link from 'next/link'
import { Band, BandHeading } from '@/components/layout/Band'
import { PageHero, ScanCapture } from '@/components/sections/shared'

/**
 * Blog index — content spec section 14. Four sections.
 *
 * Zero posts at launch; phase 4 builds the shell only. The four pillars are
 * rendered as the structure they will fill rather than as empty cards, because
 * an index showing four "coming soon" boxes is worse than one saying plainly
 * that nothing is published yet.
 */

export const metadata = createPageMetadata({
  title: 'Engineering Notes',
  description: 'Notes on stalled builds, AI-generated codebases, and shipping with a small team.',
  path: '/blog',
  robots: { index: false, follow: true },
})

const PILLARS = [
  {
    title: 'Rescuing AI-tool builds',
    body: 'How to assess a stalled build, identify the remaining work, and plan repairs.',
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
        title="Engineering notes and project lessons."
        lead="New articles will appear here. For now, explore the published case studies for a closer look at our engineering work."
      />

      <Band ground="vanilla">
        <BandHeading eyebrow="Pillars" title="What this will cover" />
        <div className="mt-step-4 grid gap-step-4 md:grid-cols-2">
          {PILLARS.map((pillar) => (
            <div key={pillar.title} className="border-t border-current/20 pt-step-3">
              <h3 className="font-display text-lg">{pillar.title}</h3>
              <p className="measure mt-step-2 text-sm text-current/80">{pillar.body}</p>
            </div>
          ))}
        </div>
        <div className="mt-step-4">
          <Link href="/work" className="underline underline-offset-4">Read the published project case studies</Link>
        </div>
      </Band>

      <ScanCapture />
    </>
  )
}
