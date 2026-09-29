import { createPageMetadata } from '@/lib/seo'
import Link from 'next/link'
import { Band, BandHeading } from '@/components/layout/Band'
import { DataTable, FAQAccordion, PageHero } from '@/components/sections/shared'
import { scanPage } from '@/content/pages'

/**
 * Scan funnel — content spec section 19. Seven sections.
 *
 * The spec flags this as proposed rather than agreed architecture, and it is
 * built here as a marketing page only. `/scan/results/{id}` is deliberately NOT
 * built: the spec is explicit that the results view is a product surface
 * needing its own technical spec, and building it as a marketing template is
 * the specific mistake it warns against.
 */

export const metadata = createPageMetadata({
  title: 'Free public app check',
  description:
    'Inspect a public app URL for observable risk signals, with findings, evidence, and coverage from Production Check.',
  path: '/scan',
})

export default function ScanPage() {
  return (
    <>
      <PageHero eyebrow="Free" title={scanPage.hero.title} lead={scanPage.hero.lead}>
        <div className="max-w-2xl">
          <DataTable rows={scanPage.hero.facts} />
        </div>
      </PageHero>

      <Band ground="vanilla">
        <BandHeading
          eyebrow="What it checks"
          title="What is visible from a public URL"
          lead="Each report states what was observed and what needs a deeper review."
        />
        <div className="mt-step-4 grid gap-step-4 md:grid-cols-2">
          {scanPage.checks.map((check) => (
            <div key={check.title} className="border-t border-current/20 pt-step-3">
              <h3 className="font-display text-lg">{check.title}</h3>
              <p className="measure mt-step-2 text-sm text-current/80">{check.body}</p>
            </div>
          ))}
        </div>
      </Band>

      <Band ground="oat">
        <BandHeading eyebrow="Who it is for" title="You, if any of this is true" />
        <ul className="mt-step-4 space-y-step-3">
          {scanPage.whoFor.map((item) => (
            <li key={item} className="measure border-t border-current/20 pt-step-3 text-lg">
              {item}
            </li>
          ))}
        </ul>
      </Band>

      <Band ground="vanilla">
        <BandHeading eyebrow="Report" title="What the output contains" />
        <div className="mt-step-4 rounded-sm border border-dashed border-current/40 p-step-5">
          <p className="measure text-current/80">Your report groups findings as FIX NOW, REVIEW, or EXPECTED. It includes supporting evidence labels, detected technologies, and a coverage summary so you can see the limits of the check.</p>
        </div>
      </Band>

      {/* The biggest objection to handing over a repo gets its own section. */}
      <Band ground="burgundy">
        <BandHeading
          eyebrow="Privacy"
          title={scanPage.privacy.title}
          lead="The check uses public information. See the privacy policy for data handling and retention details."
        />
        <DataTable rows={scanPage.privacy.rows} />
      </Band>

      <FAQAccordion items={scanPage.faqs} ground="blush" />

      <Band ground="vanilla" id="scan-form">
        <BandHeading
          eyebrow="Start"
          title="Check your public app"
          lead="Start with the public URL of an app you own or are authorised to check."
        />
        <div className="mt-step-4 rounded-sm border border-dashed border-current/40 p-step-5">
          <p className="measure mt-step-3 text-sm text-current/70">
            Open Production Check to enter the URL and see the scan progress and report.
          </p>
          <Link
            href="/production-check"
            data-cursor="link"
            className="mt-step-2 inline-block underline decoration-current/40 underline-offset-4"
          >
            Open Production Check
          </Link>
        </div>
      </Band>
    </>
  )
}
