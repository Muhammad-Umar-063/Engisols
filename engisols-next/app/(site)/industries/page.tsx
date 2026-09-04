import type { Metadata } from 'next'
import Link from 'next/link'
import { Band, BandHeading } from '@/components/layout/Band'
import { CTABlock, PageHero } from '@/components/sections/shared'
import { Reveal } from '@/components/motion/Reveal'
import { industries } from '@/content/industries'

/** Industries hub — content spec section 6. Three sections. */

export const metadata: Metadata = {
  title: 'Industries',
  description:
    'Legal, SaaS, real estate, healthcare, construction, payroll and HR. Domain context is what makes the second week faster than the first.',
  alternates: { canonical: '/industries' },
}

export default function IndustriesPage() {
  return (
    <>
      <PageHero
        eyebrow="Industries"
        title="Domain context is the difference between week two and week six."
        lead="We are not generalists pretending otherwise, and we are not claiming six verticals of deep expertise either. Where we have shipped, the case study is on the page. Where we have not, it says so."
      />

      <Band ground="vanilla">
        <BandHeading eyebrow="Six sectors" title="Where we have worked" />
        <ul className="mt-step-5 grid gap-step-4 md:grid-cols-2 lg:grid-cols-3">
          {industries.map((industry, i) => (
            <li key={industry.slug}>
              <Reveal y={16} delay={i * 0.04}>
                <Link
                  href={`/industries/${industry.slug}`}
                  data-cursor="target"
                  className="flex h-full flex-col rounded-sm border border-current/20 p-step-4 no-underline transition-colors hover:bg-current/5"
                >
                  <div className="flex items-baseline justify-between gap-step-2">
                    <h3 className="font-display text-xl">{industry.label}</h3>
                    {industry.evidenced ? (
                      <span className="font-mono text-[0.65rem] text-current/60">
                        case study
                      </span>
                    ) : (
                      <span className="font-mono text-[0.65rem] text-cherry">no evidence</span>
                    )}
                  </div>
                  <p className="measure mt-step-2 flex-1 text-sm text-current/80">
                    {industry.problems[0]?.title}
                  </p>
                </Link>
              </Reveal>
            </li>
          ))}
        </ul>
        <p className="measure mt-step-5 font-mono text-xs text-current/60">
          Two of the six have published work behind them. The other four are marked, because a
          vertical page implying evidence it does not have is worse than no page at all.
        </p>
      </Band>

      <CTABlock line="Your sector is not on the list? The failure patterns rhyme more than people expect." />
    </>
  )
}
