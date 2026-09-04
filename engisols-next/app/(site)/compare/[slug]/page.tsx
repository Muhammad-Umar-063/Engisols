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
  return {
    title: `Engisols ${page.label}`,
    description: page.tldr[0],
    alternates: { canonical: `/compare/${page.slug}` },
  }
}

export default async function ComparePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const page = getComparePage(slug)
  if (!page) notFound()

  return (
    <>
      <PageHero eyebrow="Comparison" title={page.hero.title} lead={page.hero.lead} />

      {/* 1 — TLDR. Many readers only read this. */}
      <Band ground="vanilla">
        <BandHeading eyebrow="Short version" title="The answer, before the argument" />
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
        <div className="mt-step-5 overflow-x-auto">
          <table className="w-full min-w-[36rem] border-collapse text-left">
            <thead>
              <tr className="border-b border-current/30">
                <th className="py-step-2 pr-step-3 font-mono text-xs font-normal tracking-tight text-current/60">
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
        <BandHeading eyebrow="In detail" title="Why each of those is true" />
        <div className="mt-step-5 grid gap-step-5 md:grid-cols-2">
          {page.dimensions.map((dimension) => (
            <div key={dimension.title} className="border-t border-current/20 pt-step-3">
              <h3 className="font-display text-lg">{dimension.title}</h3>
              <p className="measure mt-step-2 text-current/80">{dimension.body}</p>
            </div>
          ))}
        </div>
      </Band>

      {/* 4 and 5 — When they win, then when we do. Order matters. */}
      <Band ground="bordeaux">
        <BandHeading
          eyebrow="The honest part"
          title={`When ${page.alternative} is the better answer`}
          lead="Written without hedging. If one of these describes you, take it — the referral is worth more to us than a bad fit."
        />
        <SplitList
          left={{ title: `Choose ${page.alternative}`, items: page.whenTheyWin }}
          right={{ title: `Choose ${SITE.name}`, items: page.whenWeWin }}
        />
      </Band>

      {/* 6 — Proof. */}
      <RelatedWork title="Relevant work" ground="oat" />

      <FAQAccordion items={page.faqs} ground="greige" />

      {/* 7 — CTA, routing to the Build Audit. */}
      <CTABlock line={page.cta} />
    </>
  )
}
