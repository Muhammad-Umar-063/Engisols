import type { Metadata } from 'next'
import { Band, BandHeading } from '@/components/layout/Band'
import { Booking, PageHero } from '@/components/sections/shared'
import { scanNextPage } from '@/content/pages'

/** Scan handoff — content spec section 19. Four sections. */

export const metadata: Metadata = {
  title: 'After your scan',
  description: 'What a scan can and cannot tell you, and when the paid audit is worth it.',
  alternates: { canonical: '/scan/next' },
  robots: { index: false, follow: false },
}

export default function ScanNextPage() {
  return (
    <>
      <PageHero eyebrow="Next" title={scanNextPage.hero.title} lead={scanNextPage.hero.lead} />

      <Band ground="vanilla">
        <BandHeading
          eyebrow="Honest limits"
          title="What the scan could not tell you"
          lead="The scan is automated checks plus a human summary. It finds what is wrong. It cannot tell you what to do about it, because that needs somebody to reproduce your specific failures and read the code around them."
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
        <p className="measure mt-step-5 text-current/80">
          The audit fee is refunded in full if it tells you nothing new, and credits against a
          build if you proceed. The only outcome where you are out of pocket is the one where we
          were genuinely wrong.
        </p>
      </Band>

      <Booking ground="vanilla" />
    </>
  )
}
