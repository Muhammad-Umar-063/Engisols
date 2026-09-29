import { createPageMetadata } from '@/lib/seo'
import Link from 'next/link'
import { ArrowIcon } from '@/components/ui/ActionIcons'
import { Band, BandHeading } from '@/components/layout/Band'
import { CTABlock, PageHero } from '@/components/sections/shared'
import { Reveal } from '@/components/motion/Reveal'
import { comparePages } from '@/content/compare'

/** Compare hub — content spec section 11. Three sections. */

export const metadata = createPageMetadata({
  title: 'Compare Software Development Options',
  description:
    'Honest comparisons against an in-house hire, an offshore dev shop, marketplace freelancers and AI coding tools — including when each of them is the better choice.',
  path: '/compare',
})

export default function CompareHubPage() {
  return (
    <>
      <PageHero
        eyebrow="Compare"
        title="Find the right engineering approach."
        lead="Compare a project engagement with hiring internally, working with an agency or freelancer, and using AI coding tools."
      />

      <Band ground="vanilla">
        <BandHeading eyebrow="The alternatives" title="What else you could do" />
        <ul className="mt-step-4 grid gap-step-4 md:grid-cols-2">
          {comparePages.map((page, i) => (
            <li key={page.slug}>
              <Reveal y={16} delay={i * 0.04} className="h-full">
                <Link
                  href={`/compare/${page.slug}`}
                  data-cursor="target"
                  className="site-card flex h-full flex-col border p-step-3 sm:p-step-4 no-underline"
                >
                  <h3 className="font-display text-xl">{page.label}</h3>
                  <p className="measure mt-step-2 flex-1 text-sm text-current/80">
                    {page.tldr[0]}
                  </p>
                  <span className="site-card-action mt-step-3">Read comparison <ArrowIcon /></span>
                </Link>
              </Reveal>
            </li>
          ))}
        </ul>
      </Band>

      <CTABlock line="Discuss the work and decide whether we are a fit." />
    </>
  )
}
