import type { Metadata } from 'next'
import { Band, BandHeading } from '@/components/layout/Band'
import { CTABlock, PageHero, Prose, TeamRow } from '@/components/sections/shared'
import { aboutPage } from '@/content/pages'

/** About — content spec section 13. Six sections. {{TODO: TEAM}} */

export const metadata: Metadata = {
  title: 'About',
  description:
    'Three senior engineers who decided not to become fifteen, and the honest cost of that choice.',
  alternates: { canonical: '/about' },
}

export default function AboutPage() {
  return (
    <>
      <PageHero eyebrow="About" title={aboutPage.hero.title} lead={aboutPage.hero.lead} />

      <TeamRow title="Who you actually get" ground="vanilla" />

      <Band ground="oat">
        <BandHeading eyebrow="The argument" title={aboutPage.why.title} />
        <Prose paragraphs={aboutPage.why.paragraphs} />
      </Band>

      <Band ground="vanilla">
        <BandHeading eyebrow="History" title={aboutPage.history.title} />
        <Prose paragraphs={aboutPage.history.paragraphs} />
      </Band>

      <Band ground="bordeaux">
        <BandHeading
          eyebrow="Limits"
          title={aboutPage.wont.title}
          lead="Naming the limits is cheaper for everyone than discovering them in week three."
        />
        <ul className="mt-step-5 space-y-step-3">
          {aboutPage.wont.items.map((item) => (
            <li key={item} className="measure border-t border-current/25 pt-step-3 text-lg">
              {item}
            </li>
          ))}
        </ul>
      </Band>

      <CTABlock line={aboutPage.cta} />
    </>
  )
}
