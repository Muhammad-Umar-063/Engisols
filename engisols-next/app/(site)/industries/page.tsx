import { createPageMetadata } from '@/lib/seo'
import Link from 'next/link'
import { ArrowIcon } from '@/components/ui/ActionIcons'
import { Band, BandHeading } from '@/components/layout/Band'
import { CTABlock, PageHero } from '@/components/sections/shared'
import { Reveal } from '@/components/motion/Reveal'
import { industries } from '@/content/industries'

/** Industries hub — content spec section 6. Three sections. */

export const metadata = createPageMetadata({
  title: 'Software Engineering by Industry',
  description:
    'Legal, SaaS, real estate, healthcare, construction, payroll and HR. Domain context is what makes the second week faster than the first.',
  path: '/industries',
})

export default function IndustriesPage() {
  return (
    <>
      <PageHero
        eyebrow="Industries"
        title="Engineering shaped by your industry."
        lead="Explore sector-specific workflows and constraints. Legal and SaaS include published client work; the other pages describe potential project areas."
      />

      <Band ground="vanilla">
        <BandHeading eyebrow="Six sectors" title="Explore sectors and project areas" />
        <ul className="mt-step-4 grid gap-step-4 md:grid-cols-2 lg:grid-cols-3">
          {industries.map((industry, i) => (
            <li key={industry.slug}>
              <Reveal y={16} delay={i * 0.04} className="h-full">
                <Link
                  href={`/industries/${industry.slug}`}
                  data-cursor="target"
                  className="site-card flex h-full flex-col border p-step-3 sm:p-step-4 no-underline"
                >
                  <div className="flex items-baseline justify-between gap-step-2">
                    <h3 className="font-display text-xl">{industry.label}</h3>
                    {industry.evidenced ? (
                      <span className="font-mono text-[0.65rem] text-current/75">
                        Client work
                      </span>
                    ) : (
                      <span className="font-mono text-[0.65rem] text-cherry">Project areas</span>
                    )}
                  </div>
                  <p className="measure mt-step-2 flex-1 text-sm text-current/80">
                    {industry.problems[0]?.title}
                  </p>
                  <span className="site-card-action mt-step-3">Explore sector <ArrowIcon /></span>
                </Link>
              </Reveal>
            </li>
          ))}
        </ul>
        <p className="measure mt-step-4 font-mono text-xs text-current/75">
          Published client case studies are available for legal technology and SaaS.
          We can discuss requirements in other sectors before proposing a scope.
        </p>
      </Band>

      <CTABlock line="Tell us about your sector and the work you need." />
    </>
  )
}
