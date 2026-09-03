import Link from 'next/link'
import { HeroHeadline } from '@/components/sections/HeroHeadline'
import { Reveal } from '@/components/motion/Reveal'
import { Ticker } from '@/components/motion/Ticker'
import { ZoomHeroScene } from '@/components/motion/ZoomHeroScene'
import { Magnetic } from '@/components/motion/Magnetic'
import { ParticleField } from '@/components/motion/ParticleField'
import { hero, heroStats, trustMarkers } from '@/content/demo'

/**
 * Hero + trust strip — build spec sections 1 and 2, one continuous dark block
 * split by a hairline greige rule.
 *
 * Layout carried from the previous site: left-aligned column, badge with
 * pulsing dot, oversized headline, subtitle, CTA pair, stats row. Palette
 * translation note: the old crimson accent line cannot exist here — cherry is
 * 2.02 against bordeaux — so the headline is single-tone vanilla.
 *
 * Animation spec compliance:
 *  - Headline is CSS-only word stagger (3.2) — it is the LCP text and must not
 *    depend on JS. Server component, `word-up` keyframes in globals.css.
 *  - Scroll zoom (3.1) wraps the content; the particle field is the backdrop.
 *  - Ticker (4.1) is a CSS marquee — no animation library above the fold.
 *  - Capacity dot (3.3) pulses via the `capacity-dot` CSS class.
 *
 * `data-hero-end` is the sentinel the header observes to swap its ground
 * colour — an element, never a scroll-position constant.
 */
export function Hero() {
  return (
    <section className="on-dark relative bg-bordeaux text-vanilla" data-ground="dark">
      <ZoomHeroScene backdrop={<ParticleField />}>
        <div className="shell band pt-[calc(var(--spacing-step-6)+4rem)] lg:pt-[calc(var(--spacing-step-7)+2rem)]">
          {/* Availability badge. {{TODO: CAPACITY}} — currently demo copy. */}
          <p className="inline-flex items-center gap-step-1 rounded-full border border-greige/40 bg-vanilla/5 px-step-3 py-1.5 font-mono text-xs tracking-tight text-greige backdrop-blur-sm">
            <span className="capacity-dot size-1.5 shrink-0 rounded-full bg-cherry" />
            {hero.capacity}
          </p>

          <HeroHeadline
            text={hero.headline}
            className="mt-step-4 max-w-[15ch] text-[clamp(2.75rem,6vw,7rem)]"
          />

          <Reveal y={8} delay={0.12}>
            <p className="measure mt-step-3 text-lg text-oat">{hero.sub}</p>
          </Reveal>

          <Reveal y={8} delay={0.18}>
            <div className="mt-step-4 flex flex-wrap items-center gap-step-3">
              {/* Magnetic wraps the CTA in a 24px invisible field so the pull
                  catches before the pointer arrives, and -m-6 cancels that
                  padding so the CTA row sits exactly where it did.
                  snap={false}: the button leans toward the pointer but the
                  cursor stays a dot on it. The cover is for links, which have
                  no shape of their own to show. */}
              <Magnetic className="-m-6" snap={false}>
                <Link
                  href={hero.primaryCta.href}
                  className="block rounded-full bg-cherry px-step-4 py-step-2 font-medium text-vanilla no-underline transition-opacity hover:opacity-90"
                  style={{ transitionTimingFunction: 'var(--ease-micro)' }}
                >
                  {hero.primaryCta.label}
                </Link>
              </Magnetic>
              {/* Secondary is an underlined link, not an outlined button —
                  build spec section 7, and links are always underlined. */}
              {/* data-cursor="link": the cursor wraps this in a pill while the
                  pointer is on it, so a plain underlined link wears a button
                  for as long as it is being considered. */}
              <Link
                href={hero.secondaryCta.href}
                data-cursor="link"
                className="px-step-1 py-step-2 text-vanilla underline decoration-greige underline-offset-4 transition-colors hover:decoration-vanilla"
              >
                {hero.secondaryCta.label}
              </Link>
            </div>
          </Reveal>

          {/* Stats row above a hairline — carried from the previous design. */}
          <Reveal y={8} delay={0.24}>
            <dl className="mt-step-6 grid max-w-3xl gap-step-4 border-t border-greige/25 pt-step-3 sm:grid-cols-3">
              {heroStats.map((stat) => (
                <div key={stat.label}>
                  <dt className="sr-only">{stat.label}</dt>
                  <dd>
                    <span className="block font-display text-[clamp(1.75rem,3vw,2.5rem)] font-medium tabular-nums">
                      {stat.value}
                    </span>
                    <span className="mt-1 block text-sm text-greige">{stat.label}</span>
                    {stat.invented ? (
                      <span className="mt-1 block font-mono text-[0.65rem] text-cherry">
                        demo figure
                      </span>
                    ) : null}
                  </dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>
      </ZoomHeroScene>

      {/* Trust strip: same dark block, hairline divider, CSS marquee. */}
      <div className="relative border-t border-greige/25 py-step-3">
        <Ticker>
          {trustMarkers.map((marker) => (
            <span key={marker} className="font-mono text-sm whitespace-nowrap text-greige">
              {marker}
            </span>
          ))}
        </Ticker>
      </div>

      {/* Header ground-swap sentinel — see Header.tsx. */}
      <div data-hero-end aria-hidden className="absolute bottom-0 h-px w-full" />
    </section>
  )
}
