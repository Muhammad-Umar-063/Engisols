import type { Metadata } from 'next'
import Link from 'next/link'
import { Band, BandHeading } from '@/components/layout/Band'
import { CTABlock, PageHero, RelatedWork } from '@/components/sections/shared'
import { Reveal } from '@/components/motion/Reveal'
import { ScrollTextLines } from '@/components/motion/ScrollTextLines'
import { services } from '@/content/services'

/** Services hub — content spec section 2. Five sections. */

export const metadata: Metadata = {
  title: 'Services',
  description:
    'Five ways in: AI and agentic systems, product and MVP build, build rescue, automation and integrations, cloud and DevOps.',
  alternates: { canonical: '/services' },
}

const SHAPES = [
  {
    title: 'Audit first',
    body: 'Ten working days, fixed fee, a written verdict on what is wrong and what it costs to fix. Credited against a build if you proceed. This is how most engagements start.',
    href: '/pricing/build-audit',
    label: 'Build Audit',
  },
  {
    title: 'Fixed-scope build',
    body: 'A written scope, a fixed price and a fixed date agreed before we start. Weekly shipped increments on a real URL. Change orders priced in writing, never as a surprise.',
    href: '/pricing',
    label: 'Pricing',
  },
  {
    title: 'Ongoing retainer',
    body: 'Dedicated senior capacity per month with four hours of daily overlap, thirty days notice either way. For teams that need continuity without carrying the hiring risk.',
    href: '/pricing',
    label: 'Pricing',
  },
]

export default function ServicesPage() {
  return (
    <>
      <PageHero
        eyebrow="Services"
        title="Five ways in, depending on what is actually wrong."
        lead="We do not sell capabilities by the hour. Each of these is a different shape of problem, and the first job on any engagement is working out which one you have."
      />

      <Band ground="vanilla">
        <BandHeading eyebrow="The five" title="Pick the one that sounds like your situation" />
        <ul className="mt-step-5 grid gap-step-4 md:grid-cols-2">
          {services.map((service, i) => (
            <li key={service.slug}>
              <Reveal y={16} delay={i * 0.04}>
                <Link
                  href={`/services/${service.slug}`}
                  data-cursor="target"
                  className="flex h-full flex-col rounded-sm border border-current/20 p-step-4 no-underline transition-colors hover:bg-current/5"
                >
                  <h3 className="font-display text-xl">{service.label}</h3>
                  <p className="measure mt-step-2 flex-1 text-sm text-current/80">
                    {service.hero.lead}
                  </p>
                  <span className="mt-step-3 font-mono text-xs text-current/60">
                    {service.engagement.shape} · from {service.engagement.from}
                  </span>
                </Link>
              </Reveal>
            </li>
          ))}
        </ul>
      </Band>

      <Band ground="oat">
        <BandHeading
          eyebrow="Engagement shapes"
          title="Three ways work starts"
          lead="Whichever service it is, the commercial shape is one of these three."
        />
        <div className="mt-step-5 grid gap-step-4 md:grid-cols-3">
          {SHAPES.map((shape) => (
            <div key={shape.title} className="border-t-2 border-current pt-step-3">
              <h3 className="font-display text-lg">{shape.title}</h3>
              <p className="measure mt-step-2 text-sm text-current/80">{shape.body}</p>
              <Link
                href={shape.href}
                data-cursor="link"
                className="mt-step-3 inline-block text-sm underline decoration-current/40 underline-offset-4"
              >
                {shape.label}
              </Link>
            </div>
          ))}
        </div>
      </Band>

      {/* The editorial marquee lives here rather than on the homepage: the
          homepage structure is locked at twelve sections and this would have
          been a thirteenth. It reads as a lead-in to the work below it. */}
      <ScrollTextLines
        lines={services.map((service, i) => ({
          text: service.label,
          velocity: [30, 55, 18, 70, 40][i] ?? 40,
          direction: (i % 2 === 0 ? 1 : -1) as 1 | -1,
          outline: i % 2 === 1,
        }))}
      />

      <RelatedWork title="Recent work" ground="oat" />

      <CTABlock line="Not sure which of the five you need? That is what the audit is for." />
    </>
  )
}
