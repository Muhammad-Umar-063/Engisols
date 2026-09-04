import type { Metadata } from 'next'
import Link from 'next/link'
import { Band, BandHeading, Blocked } from '@/components/layout/Band'
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

export const metadata: Metadata = {
  title: 'Free repo health scan',
  description:
    'Point us at the repository and we run the first-pass checks the paid audit starts with. Security, dependencies, architecture, scalability and running cost.',
  alternates: { canonical: '/scan' },
}

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
          title="Five categories, named specifically"
          lead="Specificity is what makes a free tool credible. A scan that promises to check everything is checking nothing."
        />
        <div className="mt-step-5 grid gap-step-4 md:grid-cols-2">
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
        <BandHeading eyebrow="Sample" title="What the output looks like" />
        <div className="mt-step-4 rounded-sm border border-dashed border-current/40 p-step-5">
          <Blocked
            marker="{{TODO: SAMPLE_REPORT}}"
            need="a redacted example scan output — this is the highest-value missing asset on the page"
          />
        </div>
      </Band>

      {/* The biggest objection to handing over a repo gets its own section. */}
      <Band ground="bordeaux">
        <BandHeading
          eyebrow="Privacy"
          title={scanPage.privacy.title}
          lead="This is the real objection to sending anyone your repository, so it gets a section rather than a line in the FAQ."
        />
        <DataTable rows={scanPage.privacy.rows} />
      </Band>

      <FAQAccordion items={scanPage.faqs} ground="greige" />

      <Band ground="vanilla" id="scan-form">
        <BandHeading
          eyebrow="Start"
          title="Send us the repo"
          lead="Repository URL, an email to send the findings to, and one question about where you are."
        />
        <div className="mt-step-5 rounded-sm border border-dashed border-current/40 p-step-5">
          <Blocked
            marker="{{TODO: SCAN_FORM}}"
            need="the form needs a backend before it exists as a form — an inbox that receives repo URLs and a queue that runs the checks. Section 19 of the spec says this funnel needs its own technical spec first, and it does."
          />
          <p className="measure mt-step-3 text-sm text-current/70">
            Until that lands, the manual route works and is monitored:
          </p>
          <Link
            href="/contact"
            data-cursor="link"
            className="mt-step-2 inline-block underline decoration-current/40 underline-offset-4"
          >
            Send it to us directly
          </Link>
        </div>
      </Band>
    </>
  )
}
