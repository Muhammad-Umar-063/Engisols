import { createPageMetadata } from '@/lib/seo'
import { Band, BandHeading } from '@/components/layout/Band'
import { CTABlock, CheckList, DataTable, PageHero, StepList } from '@/components/sections/shared'
import { processPage } from '@/content/pages'

/** Process — content spec section 10. Six sections. Answers the offshore objection. */

export const metadata = createPageMetadata({
  title: 'Software Development Process',
  description:
    'How we scope software projects, review progress, agree ownership, and prepare for handover.',
  path: '/process',
})

export default function ProcessPage() {
  return (
    <>
      <PageHero eyebrow="Process" title={processPage.hero.title} lead={processPage.hero.lead} />

      <Band ground="vanilla">
        <BandHeading eyebrow="Phases" title="From first conversation to handover" />
        <StepList steps={processPage.phases} />
      </Band>

      <Band ground="oat">
        <BandHeading
          eyebrow="Communication"
          title={processPage.communication.title}
          lead="Set the contacts, working hours, and review cadence that fit the project."
        />
        <DataTable rows={processPage.communication.rows} />
      </Band>

      <Band ground="burgundy">
        <BandHeading
          eyebrow="Legal"
          title={processPage.legal.title}
          lead="Confirm these requirements in the engagement agreement before work starts."
        />
        <ul className="mt-step-4 space-y-step-3">
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
