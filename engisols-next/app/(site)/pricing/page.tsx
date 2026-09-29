import { createPageMetadata } from '@/lib/seo'
import Link from 'next/link'
import { Band, BandHeading } from '@/components/layout/Band'
import { CTABlock, DataTable, FAQAccordion, PageHero } from '@/components/sections/shared'
import { Reveal } from '@/components/motion/Reveal'
import { pricing } from '@/content/demo'
import { pricingPage } from '@/content/pages'

/** Pricing — content spec section 8. Seven sections. */

export const metadata = createPageMetadata({
  title: 'Software Development Engagements & Pricing',
  description:
    'Engineering reviews, product builds, and ongoing support. Scope, price, and schedule are agreed in a project proposal.',
  path: '/pricing',
})

export default function PricingPage() {
  return (
    <>
      <PageHero eyebrow="Pricing" title={pricingPage.hero.title} lead={pricingPage.hero.lead} />

      {/* 2 — The ladder. */}
      <Band ground="vanilla">
        <BandHeading eyebrow="The ladder" title="Three ways in" />
        <ul className="mt-step-4 grid gap-step-4 lg:grid-cols-3">
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
                  <p className="font-mono text-xs text-current/75">{tier.cadence}</p>
                  <p className="measure mt-step-3 text-sm text-current/80">{tier.who}</p>
                  <ul className="mt-step-3 flex-1 space-y-step-2 border-t border-current/20 pt-step-3">
                    {tier.includes.map((item) => (
                      <li key={item} className="flex gap-step-2 text-sm text-current/85">
                        <span aria-hidden className="font-mono text-xs text-current/75">
                          →
                        </span>
                        {item}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={tier.featured ? '/pricing/build-audit' : '/contact'}
                    data-cursor="target"
                    className={`site-button mt-step-4 ${tier.featured ? 'site-button-primary' : 'site-button-outline'}`}
                  >
                    {tier.featured ? 'Explore the Build Audit' : 'Discuss this scope'}
                  </Link>
                </div>
              </Reveal>
            </li>
          ))}
        </ul>
        <p className="measure mt-step-4 text-sm text-current/80">Fees, payment stages, and delivery dates are confirmed in your proposal.</p>
      </Band>

      {/* 3 — When we are the wrong answer. */}
      <Band ground="burgundy">
        <BandHeading
          eyebrow="Disqualifiers"
          title={pricingPage.whenWereWrong.title}
          lead={pricingPage.whenWereWrong.lead}
        />
        <ul className="mt-step-4 space-y-step-3">
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
          lead="These details are agreed in the proposal before work starts."
        />
        <DataTable rows={pricingPage.billing.rows} />
      </Band>

      {/* 5 — Guarantee, in actual terms. */}
      <Band ground="oat">
        <BandHeading eyebrow="Before you commit" title={pricingPage.guarantee.title} />
        <div className="mt-step-4 space-y-step-3">
          {pricingPage.guarantee.body.map((paragraph) => (
            <p key={paragraph} className="measure text-lg text-current/85">
              {paragraph}
            </p>
          ))}
        </div>
      </Band>

      <FAQAccordion items={pricingPage.faqs} title="Pricing questions" ground="blush" />

      <CTABlock line={pricingPage.cta} />
    </>
  )
}
