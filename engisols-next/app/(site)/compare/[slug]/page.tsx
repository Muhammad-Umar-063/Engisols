import { breadcrumbData, createPageMetadata } from '@/lib/seo'
import { JsonLd } from '@/components/seo/JsonLd'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Band, BandHeading } from '@/components/layout/Band'
import {
  CTABlock,
  FAQAccordion,
  PageHero,
  RelatedWork,
  SplitList,
} from '@/components/sections/shared'
import { comparePages, getComparePage } from '@/content/compare'
import { SITE } from '@/lib/site'

/**
 * Comparison page template — content spec section 12. Seven sections.
 *
 * Section order is the argument. TLDR first because most readers of a
 * comparison page read two sentences and leave; `WhenTheyWin` before
 * `WhenWeWin` because a comparison that never concedes anything is read as
 * marketing and discarded, and the concession is what makes the rest credible.
 */

export function generateStaticParams() {
  return comparePages.map((page) => ({ slug: page.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const page = getComparePage(slug)
  if (!page) return {}
  return createPageMetadata({
    title: `Software development ${page.label}`,
    description: page.tldr[0],
    path: `/compare/${page.slug}`,
  })
}

export default async function ComparePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const page = getComparePage(slug)
  if (!page) notFound()

  return (
    <>
      <JsonLd data={breadcrumbData([
        { name: 'Compare', path: '/compare' },
        { name: page.label, path: `/compare/${page.slug}` },
      ])} />
      <PageHero eyebrow="Comparison" title={page.hero.title} lead={page.hero.lead} />

      {/* 1 — TLDR. Many readers only read this. */}
      <Band ground="vanilla">
        <BandHeading eyebrow="Short version" title="Which approach fits?" />
        <div className="mt-step-4 space-y-step-3 border-l-2 border-cherry pl-step-4">
          {page.tldr.map((line) => (
            <p key={line} className="measure text-lg">
              {line}
            </p>
          ))}
        </div>
      </Band>

      {/* 2 — At a glance table. */}
      <Band ground="oat">
        <BandHeading eyebrow="At a glance" title="Side by side" />
        <div className="mt-step-4 overflow-x-auto" tabIndex={0} role="region" aria-label="Engineering options comparison; scroll horizontally on small screens">
          <table className="w-full min-w-[36rem] border-collapse text-left">
            <thead>
              <tr className="border-b border-current/30">
                <th className="py-step-2 pr-step-3 font-mono text-xs font-normal tracking-tight text-current/75">
                  Dimension
                </th>
                <th className="py-step-2 pr-step-3 font-display text-sm font-medium">
                  {page.alternative[0].toUpperCase() + page.alternative.slice(1)}
                </th>
                <th className="py-step-2 font-display text-sm font-medium">{SITE.name}</th>
              </tr>
            </thead>
            <tbody>
              {page.table.map(([dimension, them, us]) => (
                <tr key={dimension} className="border-b border-current/15 align-top">
                  <td className="py-step-2 pr-step-3 font-mono text-xs text-current/70">
                    {dimension}
                  </td>
                  <td className="py-step-2 pr-step-3 text-sm text-current/80">{them}</td>
                  <td className="py-step-2 text-sm">{us}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Band>

      {/* 3 — Dimension breakdown. Reasoning, not checkmarks. */}
      <Band ground="vanilla">
        <BandHeading eyebrow="In detail" title="What to consider" />
        <div className="mt-step-4 grid gap-step-5 md:grid-cols-2">
          {page.dimensions.map((dimension) => (
            <div key={dimension.title} className="border-t border-current/20 pt-step-3">
              <h3 className="font-display text-lg">{dimension.title}</h3>
              <p className="measure mt-step-2 text-current/80">{dimension.body}</p>
            </div>
          ))}
        </div>
      </Band>

      {/* 4 and 5 — When they win, then when we do. Order matters. */}
      <Band ground="burgundy">
        <BandHeading
          eyebrow="The honest part"
          title={`When ${page.alternative} is the better answer`}
          lead="Choose based on the work, the ownership you need, and the people available to do it."
        />
        <SplitList
          left={{ title: `Choose ${page.alternative}`, items: page.whenTheyWin }}
          right={{ title: `Choose ${SITE.name}`, items: page.whenWeWin }}
        />
      </Band>

      {/* 6 — Proof. */}
      <RelatedWork title="Relevant work" ground="oat" />

      <FAQAccordion items={page.faqs} ground="blush" />

      {/* 7 — CTA, routing to the Build Audit. */}
      <CTABlock line={page.cta} />
    </>
  )
}
