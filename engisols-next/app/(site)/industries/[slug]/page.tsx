import { breadcrumbData, createPageMetadata } from '@/lib/seo'
import { JsonLd } from '@/components/seo/JsonLd'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Band, BandHeading } from '@/components/layout/Band'
import {
  CTABlock,
  CheckList,
  FAQAccordion,
  PageHero,
  RelatedWork,
} from '@/components/sections/shared'
import { getIndustry, industries } from '@/content/industries'

/** Published client evidence and potential project areas remain distinct. */

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
  return createPageMetadata({
    title: `${industry.label} Software Development`,
    description: industry.hero.lead,
    path: `/industries/${industry.slug}`,
    // Unevidenced verticals stay out of the index until they have a case study.
    robots: industry.evidenced ? undefined : { index: false, follow: true },
  })
}

export default async function IndustryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const industry = getIndustry(slug)
  if (!industry) notFound()

  return (
    <>
      <JsonLd data={breadcrumbData([
        { name: 'Industries', path: '/industries' },
        { name: industry.label, path: `/industries/${industry.slug}` },
      ])} />
      <PageHero eyebrow="Industry" title={industry.hero.title} lead={industry.hero.lead} />

      <Band ground="vanilla">
        <BandHeading
          eyebrow="Where engineering helps"
          title="Workflows worth getting right"
          lead="The data, decisions, and handoffs that shape the product."
        />
        <div className="mt-step-4 grid gap-step-4 md:grid-cols-2">
          {industry.problems.map((problem) => (
            <div key={problem.title} className="border-t border-current/20 pt-step-3">
              <h3 className="font-display text-lg">{problem.title}</h3>
              <p className="measure mt-step-2 text-sm text-current/80">{problem.body}</p>
            </div>
          ))}
        </div>
      </Band>

      <Band ground="oat">
        <BandHeading eyebrow="What we build" title={industry.evidenced ? "Systems we have worked on in this space" : "Software we can scope with you"} />
        <CheckList items={industry.whatWeBuild} />
        {industry.evidenced ? null : (
          <div className="mt-step-4">
            <p className="measure text-sm text-current/80">These are potential project areas. We do not currently publish a client case study in this sector.</p>
          </div>
        )}
      </Band>

      <Band ground="burgundy">
        <BandHeading
          eyebrow="Constraints"
          title="Requirements to define early"
          lead="Agree data handling, integrations, and operating responsibilities before implementation."
        />
        <div className="mt-step-4 grid gap-step-5 md:grid-cols-3">
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
          <BandHeading eyebrow="Project fit" title="Discuss your sector and requirements" />
          <p className="measure mt-step-3 text-current/80">
            Share your existing systems, integration requirements, and operating constraints.
            We can discuss the relevant engineering work and the scope your project needs.
          </p>
          <div className="mt-step-4">
            <Link href="/contact" className="underline underline-offset-4">Discuss your project</Link>
          </div>
        </Band>
      )}

      <FAQAccordion items={industry.faqs} ground="blush" />

      <CTABlock line={industry.cta} />
    </>
  )
}
