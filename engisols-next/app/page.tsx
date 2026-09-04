import Link from 'next/link'
import { Band, BandHeading, Blocked } from '@/components/layout/Band'
import { Hero } from '@/components/sections/Hero'
import { ScopeEstimator } from '@/components/sections/ScopeEstimator'
import { CaseStudyCard, TeamRow } from '@/components/sections/shared'
import { Reveal } from '@/components/motion/Reveal'
import { Counter } from '@/components/motion/Counter'
import { CollisionGrid } from '@/components/motion/CollisionGrid'
import { ScrollLineHighlight } from '@/components/motion/ScrollLineHighlight'
import { SmoothTabs } from '@/components/motion/SmoothTabs'
import { ScrollHighlight } from '@/components/motion/ScrollHighlight'
import { caseStudies } from '@/content/case-studies'
import { pricing, proof, process, stall } from '@/content/demo'
import { services } from '@/content/services'

/**
 * Home — content spec section 1. Twelve sections, and the structure is LOCKED.
 *
 * The order is the argument: hook, agitate, prove, explain, price, remove risk,
 * close. Sections are not reordered or added without changing the spec first —
 * the editorial marquee built earlier lives on /services for exactly this
 * reason, since it would have been a thirteenth section here.
 *
 * Two dark bands now, per build spec section 7: the capability grid on cherry
 * (7) and how we work (8). The hero block gave up the third when it moved to
 * oat, so there is one dark band spare — but spending it directly above or
 * below either of those two would merge them into one dark run, which is what
 * the cap exists to prevent.
 *
 * Server component. Every word is in the first HTML response.
 */

export const metadata = {
  alternates: { canonical: '/' },
}

export default function Home() {
  return (
    <>
      {/* 1 Hero + 2 TrustStrip — one continuous oat block, hairline between. */}
      <Hero />

      {/* 3 The stall. This used to be the hard cut out of the dark hero and the
          biggest contrast moment on the page. With the hero on oat it is a
          1.27 step — no seam at all — so the section now has to open on its
          heading alone. Moving this band to greige is what would buy the cut
          back; the hero cannot do it from its side. */}
      <Band ground="vanilla">
        <Reveal>
          <h2 className="measure text-[clamp(1.75rem,3.5vw,3rem)]">{stall.heading}</h2>
        </Reveal>
        <div className="mt-step-5 space-y-step-2">
          <ScrollLineHighlight>
            {stall.lines.map((line) => (
              <p key={line} className="measure text-lg text-bordeaux/80">
                {line}
              </p>
            ))}
          </ScrollLineHighlight>
        </div>
        <Reveal y={8} delay={0.1}>
          <p className="measure mt-step-5 text-lg">
            If two of those are true, the problem is usually not what you have been told it is.{' '}
            <Link
              href="/compare/ai-coding-tools"
              data-cursor="link"
              className="underline decoration-bordeaux/40 underline-offset-4 hover:decoration-bordeaux"
            >
              This is what the 70% wall actually costs
            </Link>
            .
          </p>
        </Reveal>
      </Band>

      {/* 4 Proof band. Real numbers only; the invented two are marked as such
          until {{TODO: PROOF_METRIC}} resolves. The line graph stays deleted. */}
      <Band ground="oat">
        <BandHeading
          eyebrow="Proof"
          title="What we have actually shipped"
          lead="Two of these come from client dashboards. The other two are marked, because a figure you cannot defend is worth less than no figure."
        />
        <div className="mt-step-5 grid gap-step-4 sm:grid-cols-2 lg:grid-cols-4">
          {proof.map((stat) => (
            <div key={stat.label} className="border-t-2 border-cherry pt-step-2">
              <Counter
                value={stat.value}
                className="font-display text-[clamp(2rem,4vw,3.5rem)] font-medium tabular-nums"
              />
              <p className="mt-step-1 text-sm text-bordeaux/75">{stat.label}</p>
              {stat.invented ? (
                <p className="mt-step-1 font-mono text-xs text-cherry">demo figure</p>
              ) : null}
            </div>
          ))}
        </div>
      </Band>

      {/* 5 Services. Five tabs, two sentences each, one link through. */}
      <Band ground="vanilla">
        <BandHeading
          eyebrow="Services"
          title="Five ways in"
          lead="Not a capability list. Each of these is a different shape of problem."
        />
        <div className="mt-step-5">
          <SmoothTabs
            tabs={services.map((service) => ({
              id: service.slug,
              label: service.label,
              content: (
                <div>
                  <p className="measure text-lg">{service.hero.title}</p>
                  <p className="measure mt-step-3 text-bordeaux/80">{service.hero.lead}</p>
                  <Link
                    href={`/services/${service.slug}`}
                    data-cursor="link"
                    className="mt-step-4 inline-block underline decoration-bordeaux/40 underline-offset-4 hover:decoration-bordeaux"
                  >
                    {service.label}
                  </Link>
                </div>
              ),
            }))}
          />
        </div>
      </Band>

      {/* 6 Selected work. Four case studies. */}
      <Band ground="greige">
        <BandHeading eyebrow="Work" title="Shipped, with the numbers attached" />
        <ul className="mt-step-5 grid gap-step-4 sm:grid-cols-2 lg:grid-cols-4">
          {caseStudies.slice(0, 4).map((study, i) => (
            <li key={study.slug}>
              <Reveal y={16} delay={i * 0.04}>
                <CaseStudyCard study={study} />
              </Reveal>
            </li>
          ))}
        </ul>
        <Link
          href="/work"
          data-cursor="link"
          className="mt-step-5 inline-block underline decoration-current/40 underline-offset-4"
        >
          All work
        </Link>
      </Band>

      {/* 7 Capability grid. Full-bleed cherry, no copy beyond the heading.
          The site's one show-off moment; everything around it stays quiet. */}
      <Band ground="cherry">
        <BandHeading title="The stack, without the adjectives" />
        <div className="mt-step-5">
          <CollisionGrid
            items={[
              'Python', 'FastAPI', 'Node', 'Rails', 'React', 'Next.js', 'Go',
              'PostgreSQL', 'LangChain', 'LangGraph', 'pgvector', 'n8n',
              'Ollama', 'AWS', 'GCP', 'Azure',
            ]}
          />
        </div>
      </Band>

      {/* 8 How we work. Commitments, not process theatre. This is where the
          offshore-risk objection is won. */}
      <Band ground="bordeaux">
        <BandHeading
          eyebrow="How we work"
          title="Six commitments, all of them in the contract"
          lead="This is the section that answers the question nobody asks on the call."
        />
        <div className="mt-step-5">
          <ScrollHighlight heading="Commitments" items={process} />
        </div>
        <Link
          href="/process"
          data-cursor="link"
          className="mt-step-5 inline-block underline decoration-current/40 underline-offset-4"
        >
          The full process, including what we need from you
        </Link>
      </Band>

      {/* 9 The three of you. The differentiator, so it is a section. */}
      <TeamRow
        title="Three seniors. That is the whole company."
        lead="No juniors, no account managers, no bench. The honest cost of that is capacity, which is why the availability line at the top of this page is real."
        ground="oat"
      />

      {/* 10 Pricing. The ladder with a who-it-is-for line under each. */}
      <Band ground="vanilla">
        <BandHeading
          eyebrow="Pricing"
          title="Published, because most agencies do not"
          lead="If you can rule us out from this section without a call, it has done its job."
        />
        <ul className="mt-step-5 grid gap-step-4 lg:grid-cols-3">
          {pricing.map((tier) => (
            <li key={tier.name} className="border-t-2 border-current/30 pt-step-3">
              <h3 className="font-display text-xl">{tier.name}</h3>
              <p className="mt-step-2 font-display text-2xl tabular-nums">{tier.price}</p>
              <p className="font-mono text-xs text-bordeaux/60">{tier.cadence}</p>
              {tier.invented ? (
                <p className="mt-1 font-mono text-[0.65rem] text-cherry">demo figure</p>
              ) : null}
              <p className="measure mt-step-3 text-sm text-bordeaux/80">{tier.who}</p>
            </li>
          ))}
        </ul>
        <div className="mt-step-5 flex flex-wrap items-center gap-step-4">
          <Link
            href="/pricing"
            data-cursor="link"
            className="underline decoration-bordeaux/40 underline-offset-4 hover:decoration-bordeaux"
          >
            Full pricing, billing terms and the guarantee
          </Link>
          <Blocked marker="{{TODO: PRICING}}" need="every figure above is invented" />
        </div>
      </Band>

      {/* 11 Scope estimator. Qualifies before a call. */}
      <Band ground="greige">
        <ScopeEstimator />
      </Band>

      {/* 12 Footer — mounted in the root layout, inside the reveal. */}
    </>
  )
}
