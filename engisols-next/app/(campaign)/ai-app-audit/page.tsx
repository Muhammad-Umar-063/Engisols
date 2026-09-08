import Link from 'next/link'
import type { CSSProperties } from 'react'
import { HeroHeadline } from '@/components/sections/HeroHeadline'
import { Reveal } from '@/components/motion/Reveal'
import { LpHeader } from '@/components/campaign/LpHeader'
import { AuditPanel } from '@/components/campaign/AuditPanel'
import { BookButton, BookingProvider } from '@/components/campaign/Booking'
import { CheckCards, PointRow } from '@/components/campaign/CheckCards'
import { ToolStrip } from '@/components/campaign/ToolStrip'
import { WorkGrid } from '@/components/campaign/WorkGrid'
import { Card, Eyebrow, LpSection, Tick, TickItem } from '@/components/campaign/ui'
import { Logo } from '@/components/layout/Logo'
import { SITE } from '@/lib/site'
import {
  lpChecks,
  lpFaq,
  lpFinal,
  lpFooter,
  lpHero,
  lpReport,
  lpSteps,
  lpTools,
  lpWork,
} from '@/content/campaign'

/**
 * AI App Audit — the campaign landing page.
 *
 * A focused, sealed paid-traffic funnel using the Engisols campaign identity:
 * Bright Gray, Chicago Black, Crimson, and Bricolage. Shared treatments live
 * in components/campaign/ui.tsx.
 *
 * SEALED. No link leaves for the site. Educational controls reveal useful
 * content, every CTA opens the booking dialog, and project controls open an
 * on-page detail sheet. The inquiry form posts to a same-origin server route
 * and keeps the user in this funnel. That is why the page sits in the
 * `(campaign)` route group, outside
 * the layout that renders the site's header and footer: there is nothing to
 * hide with CSS because nothing is rendered.
 *
 * Server component apart from the interactive parts. Every word is in the first
 * HTML response, which for a page this expensive to get a visitor onto is not a
 * preference.
 *
 * MOTION. The hero is entirely CSS — `HeroHeadline`'s per-word stagger and the
 * `lp-in` rise, both in globals.css — because it is above the fold, where spec
 * 1.5 forbids an animation library: Motion's entrance paints the final state
 * and then hides it to animate, and that flash lands on the first thing bought
 * traffic sees. `--i` on each element is its place in the sequence.
 *
 * Below the fold, `Reveal` does the work, because there is no flash to cause
 * and it carries the mount gate. Everything is ordered so a section arrives as
 * one movement — heading, then its content — rather than as parts that happen
 * to animate.
 */

export const metadata = {
  title: 'AI app audit — is your AI-built app production-ready?',
  description:
    'A fixed-scope review of AI-built apps: code quality, security, reliability, architecture and the AI layer. Free scoping call, written report, no lock-in.',
  alternates: { canonical: '/ai-app-audit' },
  // Belt and braces over the layout's own noindex: this must never be indexed,
  // and metadata objects merge rather than replace.
  robots: { index: false, follow: false },
}

export default function AiAppAuditPage() {
  return (
    <BookingProvider>
      <LpHeader />

      {/* 1 Hero */}
      <section id="top" className="bg-vanilla">
        <div className="shell grid gap-step-3 pb-step-5 pt-[calc(var(--spacing-step-2)+4rem)] sm:gap-step-4 sm:pt-[calc(var(--spacing-step-5)+4rem)] lg:grid-cols-[minmax(0,1fr)_minmax(24rem,0.78fr)] lg:gap-x-step-5 lg:gap-y-step-2 lg:pb-step-6">
          <div className="order-1 lg:col-start-1 lg:row-start-1">
            <div className="lp-in" style={{ '--i': 0 } as CSSProperties}>
              <Eyebrow>{lpHero.eyebrow}</Eyebrow>
            </div>

            {/* Word-level stagger, CSS, runs once on load. The words carry
                their own delays, so the headline starts moving before the
                elements below it are scheduled. */}
            <HeroHeadline
              text={lpHero.headline}
              className="mt-step-2 max-w-[13ch] text-[clamp(2.1rem,4.6vw,3.9rem)]"
            />

            <p
              className="lp-in mt-step-1 max-w-[24ch] font-display text-[clamp(1.25rem,2.3vw,2rem)] font-semibold leading-[1.15] tracking-[-0.02em] text-cherry"
              style={{ '--i': 3 } as CSSProperties}
            >
              {lpHero.counter}
            </p>
          </div>

          <div
            className="lp-in order-2 flex flex-wrap items-center gap-step-2 lg:col-start-1 lg:row-start-3"
            style={{ '--i': 4 } as CSSProperties}
          >
            <BookButton label={lpHero.primary} shortLabel="BOOK A FREE CALL" className="w-full justify-center sm:w-auto" />
            <a
              href="#sample"
              data-cursor="link"
              className="hidden min-h-11 items-center gap-1.5 px-step-1 font-mono text-xs font-semibold tracking-tight underline decoration-bordeaux/40 underline-offset-4 transition-colors hover:decoration-bordeaux lg:inline-flex"
            >
              {lpHero.secondary}
              <span aria-hidden>↓</span>
            </a>
          </div>

          <div
            id="sample"
            className="lp-in order-3 min-w-0 scroll-mt-24 lg:col-start-2 lg:row-span-4 lg:row-start-1 lg:self-center"
            style={{ '--i': 5 } as CSSProperties}
          >
            <AuditPanel />
          </div>

          <p
            className="lp-in measure order-4 text-base font-medium leading-relaxed sm:text-lg lg:col-start-1 lg:row-start-2"
            style={{ '--i': 6 } as CSSProperties}
          >
            {lpHero.lede}
          </p>

          <PointRow
            points={lpHero.assurances}
            className="lp-in order-5 text-bordeaux/65 lg:col-start-1 lg:row-start-4"
            style={{ '--i': 7 } as CSSProperties}
          />
        </div>
      </section>

      {/* 2 Tool strip */}
      <section className="border-y border-greige/40 bg-vanilla">
        <div className="shell flex flex-col gap-step-3 py-step-3 lg:flex-row lg:items-center lg:gap-step-4">
          <Reveal y={8} className="shrink-0">
            <p className="max-w-[24ch] font-mono text-[0.65rem] leading-relaxed tracking-[0.08em] text-bordeaux/70">
              {lpTools.line}
            </p>
          </Reveal>
          <Reveal y={8} delay={0.06} className="min-w-0 flex-1">
            <ToolStrip />
          </Reveal>
        </div>
      </section>

      {/* 3 Deliverable — proof of value before the long-form explanation. */}
      <LpSection id="report" ground="oat">
        <div className="grid gap-step-3 lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)] lg:items-end">
          <Reveal y={16}>
            <Eyebrow>{lpReport.eyebrow}</Eyebrow>
            <h2 className="mt-step-2 text-[clamp(1.75rem,3vw,2.5rem)]">{lpReport.heading}</h2>
          </Reveal>
          <Reveal y={8} delay={0.06}>
            <p className="measure text-sm text-bordeaux/75 sm:text-base">{lpReport.lead}</p>
          </Reveal>
        </div>
        <p className="mt-step-3 font-mono text-[0.65rem] font-semibold tracking-[0.08em] text-bordeaux/55 md:hidden">
          SWIPE THROUGH THE DELIVERABLE →
        </p>
        <ul className="-mx-step-2 mt-step-2 flex snap-x snap-mandatory gap-step-2 overflow-x-auto px-step-2 pb-step-2 [scrollbar-width:none] md:mx-0 md:mt-step-4 md:grid md:grid-cols-2 md:overflow-visible md:px-0 md:pb-0 xl:grid-cols-4 [&::-webkit-scrollbar]:hidden">
          {lpReport.items.map((item, i) => (
            <li key={item.title} className="min-w-[82vw] snap-center md:min-w-0">
              <Reveal y={8} delay={i * 0.04} className="h-full">
                <Card className="h-full">
                  <span className="font-mono text-xs text-bordeaux/45">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <h3 className="mt-step-2 text-lg font-semibold">{item.title}</h3>
                  <p className="mt-step-2 text-sm leading-relaxed text-bordeaux/75">
                    {item.body}
                  </p>
                </Card>
              </Reveal>
            </li>
          ))}
        </ul>
      </LpSection>

      {/* 4 The five checks */}
      <LpSection id="checks">
        <div className="grid gap-step-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:items-baseline">
          <Reveal y={16}>
            <Eyebrow>{lpChecks.eyebrow}</Eyebrow>
            <h2 className="mt-step-3 text-[clamp(1.75rem,3vw,2.5rem)]">{lpChecks.heading}</h2>
          </Reveal>
          <Reveal y={8} delay={0.08}>
            <p className="measure text-sm text-bordeaux/70">{lpChecks.lead}</p>
          </Reveal>
        </div>
        <CheckCards />
      </LpSection>

      {/* 5 Work */}
      <LpSection id="work" ground="oat">
        <Reveal y={16}>
          <Eyebrow>{lpWork.eyebrow}</Eyebrow>
          <h2 className="mt-step-3 text-[clamp(1.75rem,3vw,2.5rem)]">{lpWork.heading}</h2>
          <p className="measure mt-step-2 text-bordeaux/75">{lpWork.lead}</p>
        </Reveal>
        <WorkGrid />
      </LpSection>

      {/* 6 How it works */}
      <LpSection id="how">
        <div className="grid gap-step-4 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] lg:items-center">
          <Reveal y={16}>
            <Eyebrow>{lpSteps.eyebrow}</Eyebrow>
            <h2 className="mt-step-3 text-[clamp(1.75rem,3vw,2.5rem)]">{lpSteps.heading}</h2>
          </Reveal>
          {/* The arrow between cards is the comp's, drawn rather than typed: a
              mono "→" rendered at 14px next to a 200px card is a character, not
              a connector, and it read as a stray glyph. This is a real line
              with a head, in cherry, at the height of the card numbers. It is
              decorative and hidden from assistive tech — the numbering already
              carries the order. */}
          <ol className="grid items-stretch gap-step-2 md:grid-cols-[1fr_auto_1fr_auto_1fr] md:gap-step-1">
            {lpSteps.steps.map((step, i) => (
              <li key={step.n} className="contents">
                <Reveal y={16} delay={i * 0.12} className="h-full">
                  <Card className="flex h-full flex-col">
                    <div className="flex items-center justify-between gap-step-2">
                      <span className="grid size-8 place-items-center rounded-full bg-oat/70 font-mono text-xs">
                        {step.n}
                      </span>
                      <span className="font-mono text-[0.65rem] tracking-tight text-bordeaux/50">
                        {step.time}
                      </span>
                    </div>
                    <h3 className="mt-step-3 text-lg font-medium">{step.title}</h3>
                    <p className="mt-step-2 text-sm leading-relaxed text-bordeaux/75">
                      {step.body}
                    </p>
                    <p className="mt-auto flex items-center gap-step-1 border-t border-greige/40 pt-step-2 font-mono text-xs text-bordeaux/60">
                      <Tick className="size-3.5 opacity-70" />
                      {step.meta}
                    </p>
                  </Card>
                </Reveal>
                {i < lpSteps.steps.length - 1 ? (
                  <Reveal y={8} delay={i * 0.12 + 0.08} className="hidden self-center md:block">
                    <svg
                      aria-hidden
                      viewBox="0 0 40 12"
                      className="h-3 w-10 text-cherry"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.75"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M1 6h34m-6-5 6 5-6 5" />
                    </svg>
                  </Reveal>
                ) : null}
              </li>
            ))}
          </ol>
        </div>
      </LpSection>

      {/* 7 Closing band */}
      <section className="bg-cherry text-vanilla on-dark" data-ground="dark">
        <div className="shell grid gap-step-4 py-step-6 lg:grid-cols-[minmax(0,1fr)_auto_auto] lg:items-center lg:gap-step-5">
          <Reveal y={16}>
            <h2 className="text-[clamp(1.75rem,3vw,2.5rem)]">{lpFinal.heading}</h2>
            <p className="measure mt-step-3 text-vanilla/85">{lpFinal.body}</p>
          </Reveal>
          <Reveal y={8} delay={0.08}>
            <ul className="space-y-1.5">
              {lpFinal.points.map((point) => (
                <TickItem key={point} className="text-sm text-vanilla/90">
                  {point}
                </TickItem>
              ))}
            </ul>
          </Reveal>
          <Reveal y={8} delay={0.16}>
            <BookButton label={lpFinal.cta} shortLabel="BOOK A FREE CALL" variant="inverse" className="w-full justify-center sm:w-auto" />
          </Reveal>
        </div>
      </section>

      {/* 9 FAQ — after the ask, not before it.
          The objection-handling reads better once the offer has been made:
          a reader who is already sold scrolls past, and one who hesitated at
          the button finds their exact hesitation answered directly beneath
          it rather than having had it raised before they wanted it. */}
      <LpSection id="faq">
        <div className="grid gap-step-4 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:items-start">
          <Reveal y={16}>
            <Eyebrow>{lpFaq.eyebrow}</Eyebrow>
            <h2 className="mt-step-3 text-[clamp(1.75rem,3vw,2.5rem)]">{lpFaq.heading}</h2>
          </Reveal>

          <div>
            {lpFaq.items.map((item, i) => (
              <Reveal key={item.q} y={8} delay={i * 0.04}>
                {/* `details`, not a JS accordion: it opens without JavaScript,
                    browser find-in-page can reach the closed answers, and the
                    open state survives a reload. The arrow is the only thing
                    that animates. */}
                <details className="group border-t border-greige/50 py-step-3 last:border-b">
                  <summary
                    data-cursor="link"
                    className="flex cursor-pointer list-none items-start justify-between gap-step-3 font-display text-lg"
                  >
                    {item.q}
                    <span
                      aria-hidden
                      className="mt-1 shrink-0 text-cherry transition-transform duration-200 group-open:rotate-45"
                      style={{ transitionTimingFunction: 'var(--ease-micro)' }}
                    >
                      +
                    </span>
                  </summary>
                  <p className="measure mt-step-2 text-bordeaux/80">{item.a}</p>
                </details>
              </Reveal>
            ))}
          </div>
        </div>
      </LpSection>

      {/* 10 Footer */}
      <footer className="bg-vanilla pb-24 sm:pb-0">
        <Reveal
          y={8}
          className="shell flex flex-col gap-step-3 border-t border-greige/40 py-step-4 md:flex-row md:items-center md:justify-between"
        >
          <Logo idPrefix="lp-foot" title="Engisols" className="h-5 w-auto shrink-0" />
          <p className="font-mono text-xs text-bordeaux/60">
            {lpFooter.services.join('  ·  ')}
          </p>
          <div className="flex flex-wrap items-center gap-step-3 font-mono text-xs">
            <a href={`mailto:${SITE.email}`} className="underline underline-offset-4">
              {SITE.email}
            </a>
            {lpFooter.legal.map((item) => (
              <Link key={item.href} href={item.href} className="underline underline-offset-4">
                {item.label}
              </Link>
            ))}
            <span className="text-bordeaux/55">{lpFooter.copyright}</span>
          </div>
        </Reveal>
      </footer>
    </BookingProvider>
  )
}
