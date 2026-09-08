'use client'

import { m, useMotionValueEvent, useScroll } from 'motion/react'
import { useEffect, useState } from 'react'
import { useMotionPrefs } from '@/hooks/useMotionPrefs'
import { scrollToTarget } from '@/components/motion/SmoothScroll'
import { EASE } from '@/lib/motion'
import { lpNav } from '@/content/campaign'
import { BookButton } from '@/components/campaign/Booking'
import { Logo } from '@/components/layout/Logo'

/**
 * The landing page's header.
 *
 * Every item in it is an in-page anchor. There is no logo link to `/`, no nav
 * to the site, and no footer links either — this page is bought traffic and the
 * brief is that it is sealed, so the header that would normally carry the way
 * out is the first thing that had to change. The wordmark is a heading, not a
 * link.
 *
 * The active item is decided by an IntersectionObserver over the sections the
 * nav points at, with the root collapsed to a band across the upper third of
 * the viewport — the section you are reading is the one crossing that line, not
 * whichever is topmost. Where two sections overlap the band, the lower one
 * wins, which is what makes the indicator move forward as you scroll rather
 * than flicker between neighbours.
 *
 * The bar hides on scroll-down past the fold and returns on scroll-up, matching
 * the site's header so the two behave the same way even though they share no
 * code. Reduced motion pins it open.
 */
export function LpHeader() {
  const [active, setActive] = useState<string | null>(null)
  const [hidden, setHidden] = useState(false)
  const [lifted, setLifted] = useState(false)
  const { reduced } = useMotionPrefs()
  const { scrollY } = useScroll()

  useMotionValueEvent(scrollY, 'change', (latest) => {
    setLifted(latest > 24)
    if (reduced) return setHidden(false)
    const prev = scrollY.getPrevious() ?? 0
    if (latest > prev && latest > 240) setHidden(true)
    else if (latest < prev) setHidden(false)
  })

  useEffect(() => {
    const sections = lpNav
      .map((item) => document.querySelector<HTMLElement>(item.href))
      .filter((el): el is HTMLElement => el !== null)
    if (!sections.length) return

    const seen = new Set<string>()
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = `#${entry.target.id}`
          if (entry.isIntersecting) seen.add(id)
          else seen.delete(id)
        }
        // Document order, last one wins: scrolling down, the incoming section
        // takes the indicator the moment it reaches the band.
        const inOrder = lpNav.filter((item) => seen.has(item.href))
        setActive(inOrder.length ? inOrder[inOrder.length - 1].href : null)
      },
      { rootMargin: '-20% 0px -70% 0px', threshold: 0 },
    )

    sections.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  const go = (href: string) => (e: React.MouseEvent) => {
    e.preventDefault()
    scrollToTarget(href)
  }

  return (
    <m.header
      className="fixed inset-x-0 top-0 z-50 px-step-2 pt-step-2"
      initial={false}
      animate={{ y: hidden ? '-140%' : '0%' }}
      transition={{ duration: 0.3, ease: EASE.micro }}
    >
      <div
        className={`shell flex items-center justify-between gap-step-2 rounded-full border border-greige/55 bg-vanilla/88 py-1.5 pl-step-2 pr-1.5 backdrop-blur-md transition-shadow duration-300 sm:gap-step-3 sm:py-2 sm:pl-step-3 sm:pr-2 ${
          lifted ? 'shadow-[0_12px_32px_-20px_rgba(23,23,23,0.5)]' : ''
        }`}
        style={{ transitionTimingFunction: 'var(--ease-micro)' }}
      >
        {/* The lockup as drawn — mark plus wordmark — but NOT a link. On the
            site this is the route home; here home is the site, so it is a
            heading. */}
        <p className="flex shrink-0 items-center gap-2">
          <Logo idPrefix="lp" title="Engisols" className="h-5 w-auto" />
          <span className="sr-only">AI app audit</span>
        </p>

        <nav aria-label="On this page" className="hidden items-center gap-step-2 lg:flex">
          {lpNav.map((item) => (
            <a
              key={item.label}
              href={item.href}
              onClick={go(item.href)}
              aria-current={active === item.href ? 'true' : undefined}
              // Inactive items sit at 60% and go to full on hover. At a flat
              // 60% with no hover response the whole row read as disabled —
              // nothing told a reader the items were live until they clicked
              // one. `data-cursor="link"` gives them the pill the page's other
              // in-page links wear, which is the second half of the same signal.
              //
              // The opacity is a CLASS, not the inline style it used to be: an
              // inline `style` beats `hover:` every time, so the hover state was
              // written and then silently overridden.
              data-cursor="link"
              className={`relative px-step-1 py-1 text-sm no-underline transition-opacity duration-200 ${
                active === item.href ? 'opacity-100' : 'opacity-60 hover:opacity-100'
              }`}
              style={{ transitionTimingFunction: 'var(--ease-micro)' }}
            >
              {item.label}
              {active === item.href ? (
                <m.span
                  layoutId="lp-nav-marker"
                  className="absolute inset-x-step-1 -bottom-0.5 block h-px bg-cherry"
                  transition={reduced ? { duration: 0 } : EASE.spring}
                />
              ) : null}
            </a>
          ))}
        </nav>

        <div className="hidden sm:block">
          <BookButton label="BOOK A SCOPING CALL" shortLabel="BOOK CALL" variant="compact" />
        </div>
      </div>
    </m.header>
  )
}
