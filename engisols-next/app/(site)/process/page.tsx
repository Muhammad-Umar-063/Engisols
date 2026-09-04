import type { Metadata } from 'next'
import { Band, BandHeading } from '@/components/layout/Band'
import { CTABlock, CheckList, DataTable, PageHero, StepList } from '@/components/sections/shared'
import { processPage } from '@/content/pages'

/** Process — content spec section 10. Six sections. Answers the offshore objection. */

export const metadata: Metadata = {
  title: 'Process',
  description:
    'Overlap hours, who you talk to, IP assignment, repo ownership from day one, and what happens if we go quiet.',
  alternates: { canonical: '/process' },
}

export default function ProcessPage() {
  return (
    <>
      <PageHero eyebrow="Process" title={processPage.hero.title} lead={processPage.hero.lead} />

      <Band ground="vanilla">
        <BandHeading eyebrow="Phases" title="Four phases, with honest durations" />
        <StepList steps={processPage.phases} />
      </Band>

      <Band ground="oat">
        <BandHeading
          eyebrow="Communication"
          title={processPage.communication.title}
          lead="The specifics, because this is the part the objection is actually about."
        />
        <DataTable rows={processPage.communication.rows} />
      </Band>

      <Band ground="bordeaux">
        <BandHeading
          eyebrow="Legal"
          title={processPage.legal.title}
          lead="All of this is in the contract, not just on this page."
        />
        <ul className="mt-step-5 space-y-step-3">
          {processPage.legal.items.map((item) => (
            <li key={item} className="measure border-t border-current/25 pt-step-3">
              {item}
            </li>
          ))}
        </ul>
      </Band>

      <Band ground="vanilla">
        <BandHeading
          eyebrow="Your side"
          title={processPage.fromYou.title}
          lead={processPage.fromYou.lead}
        />
        <CheckList items={processPage.fromYou.items} />
      </Band>

      <CTABlock line={processPage.cta} />
    </>
  )
}
