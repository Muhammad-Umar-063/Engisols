import { createPageMetadata } from '@/lib/seo'
import { Band, BandHeading } from '@/components/layout/Band'
import { PageHero, StepList } from '@/components/sections/shared'
import { contactPage } from '@/content/pages'
import { SITE } from '@/lib/site'

/** Contact — content spec section 16. Four sections. */

export const metadata = createPageMetadata({
  title: 'Contact Our Software Engineering Team',
  description: 'Contact Engisols about software engineering, project reviews, and ongoing support.',
  path: '/contact',
})

export default function ContactPage() {
  return (
    <>
      <PageHero eyebrow="Contact" title={contactPage.hero.title} lead={contactPage.hero.lead}>
        <div className="flex flex-wrap gap-step-2">
          <a href={`mailto:${SITE.email}`} className="site-button site-button-primary break-all">{SITE.email}</a>
          <a href={`tel:${SITE.phone.replace(/\s/g, '')}`} className="site-button site-button-outline">{SITE.phone}</a>
        </div>
        <p className="measure mt-step-2 text-sm text-current/80">A product link, timeline, and budget help us understand the scope.</p>
      </PageHero>

      <Band ground="vanilla">
        <BandHeading
          eyebrow="Next steps"
          title={contactPage.next.title}
          lead="Start with your project context. We can then discuss the scope and the next step."
        />
        <StepList steps={contactPage.next.steps} />
      </Band>

    </>
  )
}
