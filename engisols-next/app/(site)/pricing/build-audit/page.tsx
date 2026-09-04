import type { Metadata } from 'next'
import { Band, BandHeading, Blocked } from '@/components/layout/Band'
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

export const metadata: Metadata = {
  title: 'Build Audit',
  description:
    'Ten working days, a fixed fee, and a written verdict on your build. Refunded in full if it tells you nothing you did not already know.',
  alternates: { canonical: '/pricing/build-audit' },
}

export default function BuildAuditPage() {
  return (
    <>
      <PageHero eyebrow="The paid front door" title={buildAudit.hero.title} lead={buildAudit.hero.lead}>
        <div className="max-w-2xl">
          <DataTable rows={buildAudit.hero.facts} />
          <div className="mt-step-3">
            <Blocked marker="{{TODO: PRICING}}" need="the fee above is invented" />
          </div>
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
        <div className="mt-step-5 rounded-sm border border-dashed border-current/40 p-step-4">
          <Blocked
            marker="{{TODO: SAMPLE_REPORT}}"
            need="a redacted sample page from a real audit report — the spec is right that showing the artifact converts better than describing it"
          />
        </div>
      </Band>

      {/* 4 — Day by day. */}
      <Band ground="vanilla">
        <BandHeading eyebrow="Ten days" title="What happens, day by day" />
        <StepList steps={buildAudit.howItWorks} />
      </Band>

      {/* 5 — Why it is paid. Short and direct. */}
      <Band ground="bordeaux">
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
        title="Builds that started as an audit"
        lead="Each of these began with someone describing the problem one way and the code saying something else."
        ground="oat"
      />

      {/* 7 — Guarantee, full terms. */}
      <Band ground="vanilla">
        <BandHeading eyebrow="Guarantee" title="The actual terms" />
        <ol className="mt-step-4 space-y-step-3">
          <li className="measure border-t border-current/20 pt-step-3">
            If the report does not tell you something you did not already know, we refund the
            fee in full. Not a credit against future work — the money back.
          </li>
          <li className="measure border-t border-current/20 pt-step-3">
            You decide, not us. There is no adjudication and no requirement to justify it. One
            line by email is enough, and it is processed that week.
          </li>
          <li className="measure border-t border-current/20 pt-step-3">
            If you start a build with us within ninety days, the full fee credits against it.
          </li>
          <li className="measure border-t border-current/20 pt-step-3">
            The report is yours either way, including if you take it to another team. It is
            written to be useful to whoever does the work.
          </li>
        </ol>
      </Band>

      <FAQAccordion items={buildAudit.faqs} title="Before you send us a repo" ground="greige" />

      {/* 9 — Booking. A real calendar, not a contact form. */}
      <Booking ground="vanilla" />
    </>
  )
}
