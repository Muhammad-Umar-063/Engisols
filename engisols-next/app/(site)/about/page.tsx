import { createPageMetadata } from '@/lib/seo'
import { Band, BandHeading } from '@/components/layout/Band'
import { CTABlock, PageHero, Prose, TeamRow } from '@/components/sections/shared'
import { aboutPage } from '@/content/pages'

/** About — content spec section 13. Six sections. */

export const metadata = createPageMetadata({
  title: 'About Our Engineering Practice',
  description:
    'Software engineering across AI systems, web applications, integrations, and infrastructure. Explore our client work and approach.',
  path: '/about',
})

export default function AboutPage() {
  return (
    <>
      <PageHero eyebrow="About" title={aboutPage.hero.title} lead={aboutPage.hero.lead} />

      <TeamRow title="Engineering expertise" ground="vanilla" />

      <Band ground="oat">
        <BandHeading eyebrow="The argument" title={aboutPage.why.title} />
        <Prose paragraphs={aboutPage.why.paragraphs} />
      </Band>

      <Band ground="vanilla">
        <BandHeading eyebrow="History" title={aboutPage.history.title} />
        <Prose paragraphs={aboutPage.history.paragraphs} />
      </Band>

      <Band ground="burgundy">
        <BandHeading
          eyebrow="Limits"
          title={aboutPage.wont.title}
          lead="Agree expectations and responsibilities before starting."
        />
        <ul className="mt-step-4 space-y-step-3">
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
