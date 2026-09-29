import Link from 'next/link'
import { HeroHeadline } from '@/components/sections/HeroHeadline'
import { ZoomHeroScene } from '@/components/motion/ZoomHeroScene'
import { ParticleField } from '@/components/motion/ParticleField'
import { ArrowIcon } from '@/components/ui/ActionIcons'
import { hero } from '@/content/demo'

/** The original particle scene leads; secondary decoration stays out of its way. */
export function Hero() {
  return (
    <section className="home-hero relative bg-oat text-bordeaux" data-ground="light">
      <ZoomHeroScene backdrop={<ParticleField />}>
        <div className="shell hero-content">
          <HeroHeadline text={hero.headline} className="home-headline" />
          <div className="home-hero-bottom">
            <p className="home-hero-description">{hero.sub}</p>
            <div className="home-hero-actions">
              <Link href={hero.primaryCta.href} className="site-button site-button-primary">
                {hero.primaryCta.label}<ArrowIcon />
              </Link>
              <Link href="#client-work" className="site-text-link">See the work<ArrowIcon /></Link>
            </div>
          </div>
        </div>
      </ZoomHeroScene>
      <div data-hero-end aria-hidden className="absolute bottom-0 h-px w-full" />
    </section>
  )
}
