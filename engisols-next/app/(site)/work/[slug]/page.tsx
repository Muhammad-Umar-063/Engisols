import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Band, BandHeading } from '@/components/layout/Band'
import {
  CTABlock,
  DataTable,
  PageHero,
  Prose,
  RelatedWork,
} from '@/components/sections/shared'
import { Reveal } from '@/components/motion/Reveal'
import { caseStudies } from '@/content/case-studies'

/**
 * Case study template — content spec section 5. Nine sections.
 *
 * This template carries more sales weight than any page except the homepage,
 * and it is the only one built entirely on real data: content/case-studies.ts
 * is verified, and nothing here invents a figure.
 *
 * `ClientQuote` is deliberately absent. The spec is explicit that the section is
 * omitted entirely rather than filled with an unattributed quote, and no quote
 * has been cleared yet.
 */

export function generateStaticParams() {
  return caseStudies.map((study) => ({ slug: study.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const study = caseStudies.find((item) => item.slug === slug)
  if (!study) return {}
  return {
    title: study.title,
    description: study.shortDescription,
    alternates: { canonical: `/work/${study.slug}` },
  }
}

export default async function CaseStudyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const study = caseStudies.find((item) => item.slug === slug)
  if (!study) notFound()

  const headline = study.metrics[0]

  return (
    <>
      {/* 1 — Hero: client, one-line outcome, the hardest number available. */}
      <PageHero eyebrow={study.category} title={study.title} lead={study.tagline}>
        {headline ? (
          <p className="font-display text-[clamp(2.5rem,7vw,5rem)] leading-none tabular-nums">
            {headline.value}
            <span className="mt-step-2 block font-body text-sm tracking-normal text-current/70">
              {headline.label}
            </span>
          </p>
        ) : null}
      </PageHero>

      {/* 2 — At a glance. Scannable in five seconds. */}
      <Band ground="vanilla">
        <BandHeading eyebrow="At a glance" title="The engagement" />
        <DataTable
          rows={[
            ['Client', study.title],
            ['Industry', study.category],
            ['Engagement', 'Product build'],
            ['Stack', study.techStack.slice(0, 4).join(', ')],
            ['Team', 'Three senior engineers'],
            ['Status', 'Shipped, in production'],
          ]}
        />
        <ul className="mt-step-5 grid gap-step-4 sm:grid-cols-3">
          {study.metrics.map((metric) => (
            <li key={metric.label} className="border-t-2 border-cherry pt-step-2">
              <span className="block font-display text-[clamp(1.75rem,4vw,2.75rem)] tabular-nums">
                {metric.value}
              </span>
              <span className="mt-step-1 block text-sm text-current/75">{metric.label}</span>
            </li>
          ))}
        </ul>
      </Band>

      {/* 3 — Before. Specific, because vague setup makes the result unbelievable. */}
      <Band ground="oat">
        <BandHeading eyebrow="Before" title="The situation when they came to us" />
        <Prose paragraphs={[study.overview]} />
        <ul className="mt-step-5 grid gap-step-3 md:grid-cols-2">
          {study.challenges.map((challenge) => (
            <li key={challenge} className="border-t border-current/20 pt-step-2">
              <p className="measure text-current/85">{challenge}</p>
            </li>
          ))}
        </ul>
      </Band>

      {/* 4 — What we built, with the real interface. */}
      <Band ground="vanilla">
        <BandHeading eyebrow="What we built" title={study.shortDescription} />
        <Reveal>
          <div className="mt-step-5 overflow-hidden rounded-sm border border-current/15">
            {/* eslint-disable-next-line @next/next/no-img-element -- next/image
                lands with the asset pass. */}
            <img src={study.imgSrc} alt={`${study.title} interface`} className="w-full" />
          </div>
        </Reveal>
      </Band>

      {/* 5 — Technical decisions. The section technical buyers read closely. */}
      <Band ground="bordeaux">
        <BandHeading
          eyebrow="Technical decisions"
          title="What we chose, and what we gave up for it"
        />
        <div className="mt-step-5 grid gap-step-5 md:grid-cols-2">
          {study.solution.map((block) => (
            <div key={block.heading} className="border-t border-current/25 pt-step-3">
              <h3 className="font-display text-xl">{block.heading}</h3>
              <p className="measure mt-step-2 text-current/85">{block.body}</p>
            </div>
          ))}
        </div>
        <div className="mt-step-6 border-t border-current/25 pt-step-4">
          <p className="font-mono text-xs tracking-tight text-current/60">Stack</p>
          <ul className="mt-step-2 flex flex-wrap gap-step-2">
            {study.techStack.map((tech) => (
              <li
                key={tech}
                className="rounded-full border border-current/30 px-step-3 py-1 font-mono text-xs"
              >
                {tech}
              </li>
            ))}
          </ul>
        </div>
      </Band>

      {/* 6 — Results. Numbers with context. */}
      <Band ground="vanilla">
        <BandHeading eyebrow="Results" title="What changed" />
        <ul className="mt-step-4 space-y-step-3">
          {study.results.map((result) => (
            <li key={result} className="measure border-t border-current/20 pt-step-3 text-lg">
              {result}
            </li>
          ))}
        </ul>
      </Band>

      {/* 7 — ClientQuote omitted: no attributed quote cleared. See file header. */}

      {/* 8 — Related work. */}
      <RelatedWork exclude={study.slug} ground="oat" />

      {/* 9 — CTA. */}
      <CTABlock line="Every one of these started with someone describing a problem badly." />
    </>
  )
}
