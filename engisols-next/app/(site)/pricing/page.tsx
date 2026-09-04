import type { Metadata } from 'next'
import Link from 'next/link'
import { Band, BandHeading, Blocked } from '@/components/layout/Band'
import { CTABlock, DataTable, FAQAccordion, PageHero } from '@/components/sections/shared'
import { Reveal } from '@/components/motion/Reveal'
import { pricing } from '@/content/demo'
import { pricingPage } from '@/content/pages'

/** Pricing — content spec section 8. Seven sections. {{TODO: PRICING}} */

export const metadata: Metadata = {
  title: 'Pricing',
  description:
    'Three ways in with published prices: a fixed-fee Build Audit, fixed-scope builds, and an embedded retainer. Including who should not hire us.',
  alternates: { canonical: '/pricing' },
}

export default function PricingPage() {
  return (
    <>
      <PageHero eyebrow="Pricing" title={pricingPage.hero.title} lead={pricingPage.hero.lead} />

      {/* 2 — The ladder. */}
      <Band ground="vanilla">
        <BandHeading eyebrow="The ladder" title="Three ways in" />
        <ul className="mt-step-5 grid gap-step-4 lg:grid-cols-3">
          {pricing.map((tier, i) => (
            <li key={tier.name}>
              <Reveal y={16} delay={i * 0.05}>
                <div
                  className={`flex h-full flex-col rounded-sm border p-step-4 ${
                    tier.featured ? 'border-cherry border-2' : 'border-current/20'
                  }`}
                >
                  {tier.featured ? (
                    <p className="font-mono text-xs tracking-tight text-cherry">
                      Start here
                    </p>
                  ) : null}
                  <h3 className="mt-step-1 font-display text-2xl">{tier.name}</h3>
                  <p className="mt-step-2 font-display text-3xl tabular-nums">{tier.price}</p>
                  <p className="font-mono text-xs text-current/60">{tier.cadence}</p>
                  {tier.invented ? (
                    <p className="mt-1 font-mono text-[0.65rem] text-cherry">demo figure</p>
                  ) : null}
                  <p className="measure mt-step-3 text-sm text-current/80">{tier.who}</p>
                  <ul className="mt-step-3 flex-1 space-y-step-2 border-t border-current/20 pt-step-3">
                    {tier.includes.map((item) => (
                      <li key={item} className="flex gap-step-2 text-sm text-current/85">
                        <span aria-hidden className="font-mono text-xs text-current/50">
                          →
                        </span>
                        {item}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={tier.featured ? '/pricing/build-audit' : '/contact'}
                    data-cursor="target"
                    className={`mt-step-4 rounded-full px-step-4 py-step-2 text-center font-medium no-underline transition-opacity hover:opacity-90 ${
                      tier.featured
                        ? 'bg-cherry text-vanilla'
                        : 'border border-current/30'
                    }`}
                  >
                    {tier.featured ? 'Book a Build Audit' : 'Talk to us'}
                  </Link>
                </div>
              </Reveal>
            </li>
          ))}
        </ul>
        <div className="mt-step-5">
          <Blocked
            marker="{{TODO: PRICING}}"
            need="every figure above is invented. Publishing a wrong price is a commercial problem, not a copy problem."
          />
        </div>
      </Band>

      {/* 3 — When we are the wrong answer. */}
      <Band ground="bordeaux">
        <BandHeading
          eyebrow="Disqualifiers"
          title={pricingPage.whenWereWrong.title}
          lead={pricingPage.whenWereWrong.lead}
        />
        <ul className="mt-step-5 space-y-step-3">
          {pricingPage.whenWereWrong.items.map((item) => (
            <li key={item} className="measure border-t border-current/25 pt-step-3 text-lg">
              {item}
            </li>
          ))}
        </ul>
      </Band>

      {/* 4 — Billing mechanics. */}
      <Band ground="vanilla">
        <BandHeading
          eyebrow="Billing"
          title={pricingPage.billing.title}
          lead="Written down here so it is not a conversation later."
        />
        <DataTable rows={pricingPage.billing.rows} />
      </Band>

      {/* 5 — Guarantee, in actual terms. */}
      <Band ground="oat">
        <BandHeading eyebrow="Guarantee" title={pricingPage.guarantee.title} />
        <div className="mt-step-4 space-y-step-3">
          {pricingPage.guarantee.body.map((paragraph) => (
            <p key={paragraph} className="measure text-lg text-current/85">
              {paragraph}
            </p>
          ))}
        </div>
      </Band>

      <FAQAccordion items={pricingPage.faqs} title="The uncomfortable questions" ground="greige" />

      <CTABlock line={pricingPage.cta} />
    </>
  )
}
