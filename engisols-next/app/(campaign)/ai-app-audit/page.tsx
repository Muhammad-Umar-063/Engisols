import Link from 'next/link'
import type { CSSProperties } from 'react'
import { HeroHeadline } from '@/components/sections/HeroHeadline'
import { Magnetic } from '@/components/motion/Magnetic'
import { Reveal } from '@/components/motion/Reveal'
import { LpHeader } from '@/components/campaign/LpHeader'
import { AuditPanel } from '@/components/campaign/AuditPanel'
import { BookButton, BookingProvider } from '@/components/campaign/Booking'
import { CheckCards, PointRow } from '@/components/campaign/CheckCards'
import { WorkGrid } from '@/components/campaign/WorkGrid'
import { Card, Eyebrow, LpSection, TickItem } from '@/components/campaign/ui'
import { Logo } from '@/components/layout/Logo'
import { SITE } from '@/lib/site'
import {
  lpChecks,
  lpFamiliar,
  lpFinal,
  lpFooter,
  lpHero,
  lpSteps,
  lpTools,
  lpWork,
} from '@/content/campaign'

/**
 * AI App Audit — the campaign landing page.
 *
 * MATCHED TO THE SUPPLIED COMP. Same sections in the same order, same copy,
 * same labels and casing, same arrows. The only thing translated is colour:
 * white/blue/lime becomes vanilla/cherry/oat/bordeaux, mapped in
 * components/campaign/ui.tsx. Two treatments here are ones the site's own build
 * spec bans — all-caps letterspaced eyebrows and "→" on buttons — and they stay,
 * because the instruction is that only the palette changes.
 *
 * SEALED. No link leaves for the site. The header is anchors, "Learn more" and
 * every CTA open the booking dialog, "View project" opens a dialog, "View full
 * report" scrolls, and the footer's service names are text as they cannot be
 * links to /services. Only a mailto and this page's own legal routes go
 * anywhere. That is why the page sits in the `(campaign)` route group, outside
 * the layout that renders the site's header and footer: there is nothing to
 * hide with CSS because nothing is rendered.
 *
 * ONE GAP IN THE COMP. Its nav lists "What You Get" and "FAQ" and it draws
 * neither section. Rather than invent two sections of copy, those two items
 * point at the nearest thing that exists. Send the artboards and they become
 * real sections; otherwise the two items should come out of the nav.
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
        <div className="shell grid gap-step-5 pb-step-6 pt-[calc(var(--spacing-step-6)+3.5rem)] lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:items-start lg:pb-step-7 lg:pt-[calc(var(--spacing-step-7)+1rem)]">
          <div>
            <div className="lp-in" style={{ '--i': 0 } as CSSProperties}>
              <Eyebrow>{lpHero.eyebrow}</Eyebrow>
            </div>

            {/* Word-level stagger, CSS, runs once on load. The words carry
                their own delays, so the headline starts moving before the
                elements below it are scheduled. */}
            <HeroHeadline
              text={lpHero.headline}
              className="mt-step-3 text-[clamp(2.25rem,4.6vw,3.9rem)]"
            />

            <p
              className="lp-in mt-step-1 font-display text-[clamp(1.5rem,3vw,2.5rem)] leading-[1.1] tracking-[-0.02em] text-bordeaux/45"
              style={{ '--i': 3 } as CSSProperties}
            >
              {lpHero.counter}
            </p>

            <p
              className="lp-in measure mt-step-4 text-lg font-medium"
              style={{ '--i': 4 } as CSSProperties}
            >
              {lpHero.lede}
            </p>
            <p
              className="lp-in measure mt-step-2 text-bordeaux/75"
              style={{ '--i': 5 } as CSSProperties}
            >
              {lpHero.body}
            </p>

            <ul className="mt-step-4 grid gap-step-1 sm:grid-cols-2">
              {lpHero.questions.map((question, i) => (
                <TickItem
                  key={question}
                  className="lp-in text-sm text-bordeaux/85"
                  style={{ '--i': 6 + i } as CSSProperties}
                >
                  {question}
                </TickItem>
              ))}
            </ul>

            <div
              className="lp-in mt-step-4 flex flex-wrap items-center gap-step-3"
              style={{ '--i': 11 } as CSSProperties}
            >
              {/* Magnetic: a 24px invisible field around the CTA so the pull
                  catches before the pointer arrives. -m-6 cancels that padding
                  so the row sits exactly where it did. */}
              <Magnetic className="-m-6" snap={false}>
                <BookButton label={lpHero.primary} />
              </Magnetic>
              <a
                href="#checks"
                data-cursor="link"
                className="inline-flex items-center gap-1.5 font-mono text-xs tracking-tight underline decoration-bordeaux/40 underline-offset-4 transition-colors hover:decoration-bordeaux"
              >
                {lpHero.secondary}
                <span aria-hidden>↓</span>
              </a>
            </div>

            <PointRow
              points={lpHero.assurances}
              className="lp-in mt-step-4 text-bordeaux/65"
              style={{ '--i': 12 } as CSSProperties}
            />
          </div>

          {/* The audit panel assembles itself on view, then rests on the frame
              the comp draws — see AuditPanel. */}
          <div className="lp-in lg:pt-step-4" style={{ '--i': 2 } as CSSProperties}>
            <AuditPanel />
          </div>
        </div>
      </section>

      {/* 2 Tool strip */}
      <section className="border-y border-greige/40 bg-vanilla">
        <div className="shell flex flex-col gap-step-3 py-step-3 lg:flex-row lg:items-center lg:gap-step-4">
          <p className="max-w-[24ch] shrink-0 font-mono text-[0.65rem] leading-relaxed tracking-[0.08em] text-bordeaux/70">
            {lpTools.line}
          </p>
          {/* Scrolls rather than wraps on a phone: seven chips in one row is the
              comp's arrangement, and stacking them would double the strip. */}
          <ul className="-mx-step-3 flex min-w-0 flex-1 gap-step-2 overflow-x-auto px-step-3 lg:mx-0 lg:justify-between lg:overflow-visible lg:px-0">
            {lpTools.tools.map((tool, i) => (
              <li key={tool} className="shrink-0">
                <Reveal y={8} delay={i * 0.05}>
                  <span className="lp-card block rounded-full border border-greige/50 px-step-3 py-1.5 font-display text-sm whitespace-nowrap hover:border-greige">
                    {tool}
                  </span>
                </Reveal>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 3 Sound familiar */}
      <LpSection id="familiar" ground="oat">
        <div className="grid gap-step-4 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
          <Reveal y={16}>
            <Eyebrow>{lpFamiliar.eyebrow}</Eyebrow>
            <h2 className="mt-step-3 text-[clamp(1.75rem,3vw,2.5rem)]">{lpFamiliar.heading}</h2>
            <p className="mt-step-4 text-sm text-bordeaux/70">{lpFamiliar.note}</p>
            <p className="text-sm font-medium">{lpFamiliar.noteStrong}</p>
          </Reveal>

          <div className="grid gap-step-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,17rem)]">
            <ul className="grid gap-step-2 sm:grid-cols-2 xl:grid-cols-3">
              {lpFamiliar.quotes.map((quote, i) => (
                <li key={quote}>
                  <Reveal y={8} delay={i * 0.05} className="h-full">
                    <Card className="h-full">
                      <span
                        aria-hidden
                        className="block font-display text-2xl leading-none text-cherry"
                      >
                        “
                      </span>
                      <p className="mt-step-1 text-sm leading-relaxed">{quote}</p>
                    </Card>
                  </Reveal>
                </li>
              ))}
            </ul>

            {/* The comp's blue panel. Cherry here — a full-bleed panel is one of
                the two jobs that colour has. */}
            <Reveal y={16} delay={0.1} className="flex">
            <div className="flex flex-1 flex-col rounded-2xl bg-cherry p-step-3 text-vanilla on-dark">
              <p className="font-display text-lg leading-snug">{lpFamiliar.panel.heading}</p>
              <ul className="mt-step-3 space-y-1.5 text-sm">
                {lpFamiliar.panel.points.map((point) => (
                  <TickItem key={point} className="text-vanilla/90">
                    {point}
                  </TickItem>
                ))}
              </ul>
              <div className="mt-step-4">
                <BookButton label={lpFamiliar.panel.cta} variant="inverse" />
              </div>
            </div>
            </Reveal>
          </div>
        </div>
      </LpSection>

      {/* 4 The five checks */}
      <LpSection id="checks">
        <div className="grid gap-step-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:items-end">
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
        <div className="grid gap-step-4 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
          <Reveal y={16}>
            <Eyebrow>{lpSteps.eyebrow}</Eyebrow>
            <h2 className="mt-step-3 text-[clamp(1.75rem,3vw,2.5rem)]">{lpSteps.heading}</h2>
          </Reveal>
          {/* The comp puts an arrow between the cards. It is decorative and
              hidden from assistive tech; the numbering already carries order. */}
          <ol className="grid items-stretch gap-step-2 md:grid-cols-[1fr_auto_1fr_auto_1fr]">
            {lpSteps.steps.map((step, i) => (
              <li key={step.n} className="contents">
                <Reveal y={16} delay={i * 0.12} className="h-full">
                <Card className="h-full">
                  <span className="grid size-8 place-items-center rounded-full bg-oat/70 font-mono text-xs">
                    {step.n}
                  </span>
                  <h3 className="mt-step-3 text-base font-medium">{step.title}</h3>
                  <p className="mt-step-1 text-sm text-bordeaux/75">{step.body}</p>
                  <p className="mt-step-3 border-t border-greige/40 pt-step-2 font-mono text-xs text-bordeaux/60">
                    {step.meta}
                  </p>
                </Card>
                </Reveal>
                {i < lpSteps.steps.length - 1 ? (
                  <Reveal y={8} delay={i * 0.12 + 0.08} className="hidden self-center md:block">
                    <span aria-hidden className="font-mono text-bordeaux/40">
                      →
                    </span>
                  </Reveal>
                ) : null}
              </li>
            ))}
          </ol>
        </div>
      </LpSection>

      {/* 7 Closing band */}
      <section className="bg-cherry text-vanilla on-dark" data-ground="dark">
        <div className="shell grid gap-step-4 py-step-6 lg:grid-cols-[minmax(0,1fr)_auto_auto] lg:items-center lg:gap-step-5 lg:py-step-7">
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
            <Magnetic className="-m-6" snap={false}>
              <BookButton label={lpFinal.cta} variant="inverse" />
            </Magnetic>
          </Reveal>
        </div>
      </section>

      {/* 8 Footer */}
      <footer className="bg-vanilla">
        <div className="shell flex flex-col gap-step-3 border-t border-greige/40 py-step-4 md:flex-row md:items-center md:justify-between">
          <Logo idPrefix="lp-foot" title="Engisols" className="h-5 w-auto shrink-0" />
          <p className="font-mono text-xs text-bordeaux/60">{lpFooter.services.join('  ·  ')}</p>
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
        </div>
      </footer>
    </BookingProvider>
  )
}
