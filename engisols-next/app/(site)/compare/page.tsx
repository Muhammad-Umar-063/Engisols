import type { Metadata } from 'next'
import Link from 'next/link'
import { Band, BandHeading } from '@/components/layout/Band'
import { CTABlock, PageHero } from '@/components/sections/shared'
import { Reveal } from '@/components/motion/Reveal'
import { comparePages } from '@/content/compare'

/** Compare hub — content spec section 11. Three sections. */

export const metadata: Metadata = {
  title: 'Compare',
  description:
    'Honest comparisons against an in-house hire, an offshore dev shop, marketplace freelancers and AI coding tools — including when each of them is the better choice.',
  alternates: { canonical: '/compare' },
}

export default function CompareHubPage() {
  return (
    <>
      <PageHero
        eyebrow="Compare"
        title="Four honest comparisons, including the parts where we lose."
        lead="Every one of these names the situations where the alternative is the better answer. That is not modesty — a comparison that never concedes anything is read as marketing and ignored."
      />

      <Band ground="vanilla">
        <BandHeading eyebrow="The alternatives" title="What else you could do" />
        <ul className="mt-step-5 grid gap-step-4 md:grid-cols-2">
          {comparePages.map((page, i) => (
            <li key={page.slug}>
              <Reveal y={16} delay={i * 0.04}>
                <Link
                  href={`/compare/${page.slug}`}
                  data-cursor="target"
                  className="flex h-full flex-col rounded-sm border border-current/20 p-step-4 no-underline transition-colors hover:bg-current/5"
                >
                  <h3 className="font-display text-xl">{page.label}</h3>
                  <p className="measure mt-step-2 flex-1 text-sm text-current/80">
                    {page.tldr[0]}
                  </p>
                </Link>
              </Reveal>
            </li>
          ))}
        </ul>
      </Band>

      <CTABlock line="Ruled us out? Good. That took four minutes instead of a call." />
    </>
  )
}
