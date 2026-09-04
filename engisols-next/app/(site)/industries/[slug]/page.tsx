import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Band, BandHeading, Blocked } from '@/components/layout/Band'
import {
  CTABlock,
  CheckList,
  FAQAccordion,
  PageHero,
  RelatedWork,
} from '@/components/sections/shared'
import { getIndustry, industries } from '@/content/industries'

/**
 * Industry page template — content spec section 7. Seven sections.
 *
 * The spec's rule: an industry page ships only with at least one real case
 * study in it. Four of the six do not have one, so instead of quietly showing
 * unrelated work they render the blocker where RelatedWork would be. That is
 * the honest version of "not ready" and it is visible to whoever opens the page.
 */

export function generateStaticParams() {
  return industries.map((industry) => ({ slug: industry.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const industry = getIndustry(slug)
  if (!industry) return {}
  return {
    title: industry.label,
    description: industry.hero.lead,
    alternates: { canonical: `/industries/${industry.slug}` },
    // Unevidenced verticals stay out of the index until they have a case study.
    robots: industry.evidenced ? undefined : { index: false, follow: true },
  }
}

export default async function IndustryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const industry = getIndustry(slug)
  if (!industry) notFound()

  return (
    <>
      <PageHero eyebrow="Industry" title={industry.hero.title} lead={industry.hero.lead} />

      <Band ground="vanilla">
        <BandHeading
          eyebrow="Failure patterns"
          title="What goes wrong here specifically"
          lead="Not generic software problems. These are the ones that recur in this sector."
        />
        <div className="mt-step-5 grid gap-step-4 md:grid-cols-2">
          {industry.problems.map((problem) => (
            <div key={problem.title} className="border-t border-current/20 pt-step-3">
              <h3 className="font-display text-lg">{problem.title}</h3>
              <p className="measure mt-step-2 text-sm text-current/80">{problem.body}</p>
            </div>
          ))}
        </div>
      </Band>

      <Band ground="oat">
        <BandHeading eyebrow="What we build" title="Systems we have shipped in this space" />
        <CheckList items={industry.whatWeBuild} />
        {industry.evidenced ? null : (
          <div className="mt-step-5">
            <Blocked
              marker="{{TODO: VERTICALS}}"
              need={`no published case study in ${industry.label.toLowerCase()} yet — this list describes capability, not evidence, and the page stays unindexed until that changes`}
            />
          </div>
        )}
      </Band>

      <Band ground="bordeaux">
        <BandHeading
          eyebrow="Constraints"
          title="The rules this sector plays by"
          lead="Compliance, data handling and integration reality. These are architecture decisions, not a checklist at the end."
        />
        <div className="mt-step-5 grid gap-step-5 md:grid-cols-3">
          {industry.constraints.map((constraint) => (
            <div key={constraint.title} className="border-t border-current/25 pt-step-3">
              <h3 className="font-display text-lg">{constraint.title}</h3>
              <p className="measure mt-step-2 text-sm text-current/80">{constraint.body}</p>
            </div>
          ))}
        </div>
      </Band>

      {industry.evidenced ? (
        <RelatedWork
          title={`Work in ${industry.label.toLowerCase()}`}
          filter={(study) => industry.evidence.includes(study.category)}
          ground="vanilla"
        />
      ) : (
        <Band ground="vanilla">
          <BandHeading eyebrow="Related work" title="Nothing published here yet" />
          <p className="measure mt-step-3 text-current/80">
            An industry page with no evidence is worse than not having the page, so this one
            does not borrow case studies from another sector to fill the gap. When there is
            work to show here, it appears in this slot.
          </p>
          <div className="mt-step-4">
            <Blocked
              marker="{{TODO: VERTICALS}}"
              need="at least one cleared case study in this vertical before publication"
            />
          </div>
        </Band>
      )}

      <FAQAccordion items={industry.faqs} ground="greige" />

      <CTABlock line={industry.cta} />
    </>
  )
}
