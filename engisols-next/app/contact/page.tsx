import type { Metadata } from 'next'
import { Band, BandHeading } from '@/components/layout/Band'
import { Booking, DataTable, PageHero, StepList } from '@/components/sections/shared'
import { contactPage } from '@/content/pages'

/** Contact — content spec section 16. Four sections. */

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Talk to the engineer who would do the work. Overlap hours, email and response times.',
  alternates: { canonical: '/contact' },
}

export default function ContactPage() {
  return (
    <>
      <PageHero eyebrow="Contact" title={contactPage.hero.title} lead={contactPage.hero.lead} />

      <Booking ground="vanilla" />

      <Band ground="oat">
        <BandHeading
          eyebrow="After booking"
          title={contactPage.next.title}
          lead="Written down because knowing what happens next is what stops people cancelling."
        />
        <StepList steps={contactPage.next.steps} />
      </Band>

      <Band ground="vanilla">
        <BandHeading eyebrow="Direct" title={contactPage.alternatives.title} />
        <DataTable rows={contactPage.alternatives.rows} />
      </Band>
    </>
  )
}
