import { createPageMetadata } from '@/lib/seo'
import Link from 'next/link'
import { ArrowIcon } from '@/components/ui/ActionIcons'
import { Band, BandHeading } from '@/components/layout/Band'
import { CTABlock, PageHero, RelatedWork } from '@/components/sections/shared'
import { Reveal } from '@/components/motion/Reveal'
import { ScrollTextLines } from '@/components/motion/ScrollTextLines'
import { services } from '@/content/services'

/** Services hub — content spec section 2. Five sections. */

export const metadata = createPageMetadata({
  title: 'Software Engineering Services',
  description:
    'Five ways in: AI and agentic systems, product and MVP build, build rescue, automation and integrations, cloud and DevOps.',
  path: '/services',
})

const SHAPES = [
  {
    title: 'Audit first',
    body: 'Understand an existing system and its next steps. Agree the review questions, deliverables, fee, and schedule before starting.',
    href: '/pricing/build-audit',
    label: 'Build Audit',
  },
  {
    title: 'Fixed-scope build',
    body: 'Define the product requirements, implementation milestones, and testing plan. The proposal sets out costs, dependencies, and delivery expectations.',
    href: '/pricing',
    label: 'Pricing',
  },
  {
    title: 'Ongoing engineering',
    body: 'Support an existing product with agreed engineering capacity, priorities, and a review cadence that fits your team.',
    href: '/pricing',
    label: 'Pricing',
  },
]

export default function ServicesPage() {
  return (
    <>
      <PageHero
        eyebrow="Services"
        title="Engineering for every stage of your product."
        lead="Build a product, add AI, connect systems, improve infrastructure, or get an existing build moving again."
      />

      <Band ground="vanilla">
        <BandHeading eyebrow="The five" title="Explore our services" />
        <ul className="mt-step-4 grid gap-step-4 md:grid-cols-2">
          {services.map((service, i) => (
            <li key={service.slug}>
              <Reveal y={16} delay={i * 0.04} className="h-full">
                <Link
                  href={`/services/${service.slug}`}
                  data-cursor="target"
                  className="site-card flex h-full flex-col border p-step-3 sm:p-step-4 no-underline"
                >
                  <h3 className="font-display text-xl">{service.label}</h3>
                  <p className="measure mt-step-2 flex-1 text-sm text-current/80">
                    {service.hero.lead}
                  </p>
                  <span className="mt-step-3 font-mono text-xs text-current/75">
                    {service.engagement.shape} · {service.engagement.from}
                  </span>
                  <span className="site-card-action mt-step-3">Explore service <ArrowIcon /></span>
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
        <div className="mt-step-4 grid gap-step-4 md:grid-cols-3">
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

      <CTABlock line="Tell us about the project. We can help define the next step." />
    </>
  )
}
