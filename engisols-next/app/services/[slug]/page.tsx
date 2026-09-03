import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Band, BandHeading } from '@/components/layout/Band'
import {
  CTABlock,
  CheckList,
  FAQAccordion,
  PageHero,
  Prose,
  RelatedWork,
  StepList,
} from '@/components/sections/shared'
import { getService, services } from '@/content/services'
import { caseStudies } from '@/content/case-studies'

/**
 * Service page template — content spec section 3. Nine sections.
 *
 * Static at build time for all five services. The variation between them is
 * entirely content; if a service ever needs a different section order, that is
 * a signal the service does not belong in this template rather than a reason
 * to add a conditional here.
 */

export function generateStaticParams() {
  return services.map((service) => ({ slug: service.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const service = getService(slug)
  if (!service) return {}
  return {
    title: service.label,
    description: service.hero.lead,
    alternates: { canonical: `/services/${service.slug}` },
  }
}

export default async function ServicePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const service = getService(slug)
  if (!service) notFound()

  const related = caseStudies.filter((study) => service.evidence.includes(study.category))

  return (
    <>
      {/* 1 — Hero. The service named plainly, who it is for, the outcome. */}
      <PageHero eyebrow="Service" title={service.hero.title} lead={service.hero.lead}>
        <Link
          href="/pricing/build-audit"
          className="rounded-full bg-cherry px-step-4 py-step-2 font-medium text-vanilla no-underline transition-opacity hover:opacity-90"
        >
          Book a Build Audit
        </Link>
      </PageHero>

      {/* 2 — The problem, from the buyer's side. */}
      <Band ground="vanilla">
        <BandHeading eyebrow="The problem" title="What this actually looks like" />
        <Prose paragraphs={service.problem} />
      </Band>

      {/* 3 — What you get. Things a client can point at. */}
      <Band ground="oat">
        <BandHeading
          eyebrow="Deliverables"
          title="What you get"
          lead="Concrete artifacts, not activities. Everything below is something you can point at and say you received it."
        />
        <CheckList items={service.whatYouGet} />
      </Band>

      {/* 4 — How it works, with honest ranges rather than best cases. */}
      <Band ground="vanilla">
        <BandHeading
          eyebrow="Timeline"
          title="How it works"
          lead="Ranges, not best cases. The dates below are what it usually takes, including the week something goes wrong."
        />
        <StepList steps={service.howItWorks} />
      </Band>

      {/* 5 — Approach. The section that separates a practice from a body shop. */}
      <Band ground="bordeaux">
        <BandHeading eyebrow="Approach" title="How we think about this" />
        <Prose paragraphs={service.approach.paragraphs} />
        <div className="mt-step-6 border-t border-current/25 pt-step-4">
          <h3 className="font-display text-xl">What we refuse to do</h3>
          <ul className="mt-step-3 space-y-step-3">
            {service.approach.refuse.map((item) => (
              <li key={item} className="measure text-current/85">
                {item}
              </li>
            ))}
          </ul>
        </div>
      </Band>

      {/* 6 — Related work. Two case studies from this service. */}
      <RelatedWork
        title="Work in this area"
        filter={(study) => service.evidence.includes(study.category)}
        ground="oat"
      />

      {/* 7 — Engagement shape. {{TODO: PRICING}} */}
      <Band ground="vanilla">
        <BandHeading eyebrow="Engagement" title="How this is usually bought" />
        <div className="mt-step-4 grid gap-step-4 border-t border-current/20 pt-step-4 sm:grid-cols-3">
          <div>
            <p className="font-mono text-xs text-current/60">Shape</p>
            <p className="mt-step-1 font-display text-lg">{service.engagement.shape}</p>
          </div>
          <div>
            <p className="font-mono text-xs text-current/60">From</p>
            <p className="mt-step-1 font-display text-lg tabular-nums">
              {service.engagement.from}
            </p>
            <p className="mt-1 font-mono text-[0.65rem] text-cherry">demo figure</p>
          </div>
          <div className="sm:col-span-1">
            <p className="measure text-sm text-current/80">{service.engagement.note}</p>
            <Link
              href="/pricing"
              data-cursor="link"
              className="mt-step-2 inline-block underline decoration-current/40 underline-offset-4"
            >
              Full pricing
            </Link>
          </div>
        </div>
        {related.length === 0 ? null : null}
      </Band>

      {/* 8 — FAQ, including the awkward ones. */}
      <FAQAccordion items={service.faqs} ground="greige" />

      {/* 9 — CTA. */}
      <CTABlock line={service.cta} />
    </>
  )
}
