import { createPageMetadata } from '@/lib/seo'
import { Band, BandHeading } from '@/components/layout/Band'
import {
  Booking,
  CaseStudyGrid,
  CheckList,
  DataTable,
  FAQAccordion,
  PageHero,
  SplitList,
  StepList,
} from '@/components/sections/shared'
import { buildAudit } from '@/content/pages'
import { caseStudies } from '@/content/case-studies'

/**
 * Build Audit — content spec section 9. Nine sections.
 *
 * The single conversion target of the site, and a real landing page rather than
 * a pricing subpage. Everything above the fold answers the four questions in
 * the spec: what it costs, how long it takes, what you walk away with, and the
 * guarantee.
 */

export const metadata = createPageMetadata({
  title: 'Software Build Audit',
  description:
    'A scoped engineering review of your build, with prioritised findings and next-step recommendations. Fee and schedule agreed in advance.',
  path: '/pricing/build-audit',
})

export default function BuildAuditPage() {
  return (
    <>
      <PageHero eyebrow="Build Audit" title={buildAudit.hero.title} lead={buildAudit.hero.lead}>
        <div className="max-w-2xl">
          <DataTable rows={buildAudit.hero.facts} />
        </div>
      </PageHero>

      {/* 2 — Who this is for, and who it is not. */}
      <Band ground="vanilla">
        <BandHeading eyebrow="Qualification" title="Whether this is your problem" />
        <SplitList left={buildAudit.whoFor.left} right={buildAudit.whoFor.right} />
      </Band>

      {/* 3 — The deliverable. Seeing the artifact converts better than describing it. */}
      <Band ground="oat">
        <BandHeading
          eyebrow="The deliverable"
          title={buildAudit.deliverable.title}
          lead={buildAudit.deliverable.lead}
        />
        <CheckList items={buildAudit.deliverable.items} />
        <div className="mt-step-4 rounded-sm border border-dashed border-current/40 p-step-4">
          <p className="measure text-current/80">The findings document identifies the area reviewed, the observed issue, supporting evidence, its priority, and the recommended next step. The agreed scope defines which parts of your system are inspected.</p>
        </div>
      </Band>

      {/* 4 — Day by day. */}
      <Band ground="vanilla">
        <BandHeading eyebrow="Process" title="From review scope to next steps" />
        <StepList steps={buildAudit.howItWorks} />
      </Band>

      {/* 5 — Why it is paid. Short and direct. */}
      <Band ground="burgundy">
        <BandHeading eyebrow="Why paid" title={buildAudit.whyPaid.title} />
        <div className="mt-step-4 space-y-step-3">
          {buildAudit.whyPaid.body.map((paragraph) => (
            <p key={paragraph} className="measure text-lg text-current/85">
              {paragraph}
            </p>
          ))}
        </div>
      </Band>

      {/* 6 — Proof: work where an audit preceded a build. */}
      <CaseStudyGrid
        studies={caseStudies.slice(0, 3)}
        title="Related client work"
        lead="Published examples of the software and systems we have worked on for clients."
        ground="oat"
      />

      {/* 7 — Guarantee, full terms. */}
      <Band ground="vanilla">
        <BandHeading eyebrow="Engagement" title="Agree the terms before starting" />
        <ol className="mt-step-4 space-y-step-3">
          <li className="measure border-t border-current/20 pt-step-3">
            The proposal defines the review scope, access needed, deliverables, fee, and schedule.
          </li>
          <li className="measure border-t border-current/20 pt-step-3">
            Agree confidentiality and data-handling requirements before sharing a private system.
          </li>
          <li className="measure border-t border-current/20 pt-step-3">
            Review and implementation are separate decisions. Any credits or commercial conditions must be included in the written proposal.
          </li>
          <li className="measure border-t border-current/20 pt-step-3">
            Confirm ownership, handover requirements, and any follow-up support in the engagement agreement.
          </li>
        </ol>
      </Band>

      <FAQAccordion items={buildAudit.faqs} title="Build Audit questions" ground="blush" />

      {/* 9 — Booking. A real calendar, not a contact form. */}
      <Booking ground="vanilla" />
    </>
  )
}
