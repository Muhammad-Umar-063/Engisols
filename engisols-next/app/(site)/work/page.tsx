import type { Metadata } from 'next'
import { CaseStudyGrid, CTABlock, PageHero } from '@/components/sections/shared'
import { caseStudies } from '@/content/case-studies'

/** Work index — content spec section 4. Three sections. */

export const metadata: Metadata = {
  title: 'Work',
  description:
    'Shipped products across legal tech, agentic AI, SaaS and Web3. Every metric is a verified figure or a product fact.',
  alternates: { canonical: '/work' },
}

export default function WorkPage() {
  const categories = [...new Set(caseStudies.map((study) => study.category))]

  return (
    <>
      <PageHero
        eyebrow="Work"
        title="Shipped, in production, with the numbers attached."
        lead="Five projects. Where a hard performance figure exists it is stated; where it does not, the metric is a verifiable product fact rather than a number we would like to be true."
      >
        <ul className="flex flex-wrap gap-step-2">
          {categories.map((category) => (
            <li
              key={category}
              className="rounded-full border border-current/30 px-step-3 py-1.5 font-mono text-xs text-current/75"
            >
              {category}
            </li>
          ))}
        </ul>
      </PageHero>

      <CaseStudyGrid title="All work" />

      <CTABlock line="Your project would be the sixth. Start with an audit." />
    </>
  )
}
