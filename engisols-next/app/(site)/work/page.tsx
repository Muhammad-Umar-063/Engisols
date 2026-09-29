import { createPageMetadata } from '@/lib/seo'
import { CaseStudyGrid, CTABlock, PageHero } from '@/components/sections/shared'
import { caseStudies } from '@/content/case-studies'

/** Work index — content spec section 4. Three sections. */

export const metadata = createPageMetadata({
  title: 'Client Software Engineering Case Studies',
  description:
    'Shipped products across legal tech, agentic AI, SaaS and Web3. Every metric is a verified figure or a product fact.',
  path: '/work',
})

export default function WorkPage() {
  const categories = [...new Set(caseStudies.map((study) => study.category))]

  return (
    <>
      <PageHero
        eyebrow="Work"
        title="Software built for our clients."
        lead="Explore five client projects across legal technology, AI, SaaS, and Web3. Each case study describes our engineering contribution and the project results."
      >
        <ul aria-label="Project areas" className="flex flex-wrap gap-x-step-3 gap-y-step-1">
          {categories.map((category) => (
            <li
              key={category}
              className="text-sm text-current/80"
            >
              {category}
            </li>
          ))}
        </ul>
      </PageHero>

      <CaseStudyGrid title="All work" />

      <CTABlock line="Have a project in mind? Let’s discuss it." />
    </>
  )
}
