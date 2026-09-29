import { createPageMetadata } from '@/lib/seo'
import { Band, BandHeading } from '@/components/layout/Band'
import { Booking, PageHero } from '@/components/sections/shared'
import { scanNextPage } from '@/content/pages'

/** Scan handoff — content spec section 19. Four sections. */

export const metadata = createPageMetadata({
  title: 'After your scan',
  description: 'What a scan can and cannot tell you, and when the paid audit is worth it.',
  path: '/scan/next',
  robots: { index: false, follow: false },
})

export default function ScanNextPage() {
  return (
    <>
      <PageHero eyebrow="Next" title={scanNextPage.hero.title} lead={scanNextPage.hero.lead} />

      <Band ground="vanilla">
        <BandHeading
          eyebrow="Honest limits"
          title="What the scan could not tell you"
          lead="A public scan cannot verify private code, database permissions, authenticated flows, or server behavior. A deeper review needs an agreed scope and appropriate access."
        />
      </Band>

      <Band ground="oat">
        <BandHeading eyebrow="The case" title={scanNextPage.case.title} />
        <ul className="mt-step-4 space-y-step-3">
          {scanNextPage.case.items.map((item) => (
            <li key={item} className="measure border-t border-current/20 pt-step-3 text-lg">
              {item}
            </li>
          ))}
        </ul>
        <p className="measure mt-step-4 text-current/80">
          A review proposal defines the questions to investigate, deliverables, fee, and
          schedule. Discuss those details before deciding whether to proceed.
        </p>
      </Band>

      <Booking ground="vanilla" />
    </>
  )
}
