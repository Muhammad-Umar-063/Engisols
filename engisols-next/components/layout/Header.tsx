'use client'

import Link from 'next/link'
import {
  m,
  AnimatePresence,
  useScroll,
  useMotionValueEvent,
} from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import {
  HEADER_LINKS,
  INDUSTRIES,
  MEGA_MENU_LINKS,
  PRIMARY_CTA,
  SERVICES,
  type NavLink,
} from '@/lib/site'
import { Logo } from '@/components/layout/Logo'
import { useMotionPrefs } from '@/hooks/useMotionPrefs'
import { EASE, STAGGER } from '@/lib/motion'

/**
 * Global header — animation spec sections 2.1 (hide on scroll) and 2.2 (mega
 * menu).
 *
 * 2.1: scrolling down past 120px slides it out; any upward scroll returns it;
 * it never hides while the mega menu is open, and never hides at all under
 * reduced motion. Scroll state comes from useMotionValueEvent, not a manual
 * listener.
 *
 * 2.2: hover intent — 120ms open delay so a pointer crossing the trigger does
 * not fire it, 180ms close delay so a diagonal move into the panel does not
 * dismiss it. Switching between the two menus animates the panel via `layout`
 * rather than closing and reopening. Columns stagger in; a shared-layout
 * indicator slides between rows.
 *
 * Ground handling: the header carries the hero's own oat while it is over the
 * hero and vanilla past it, driven by an IntersectionObserver on the hero's
 * sentinel — never a scroll-position constant. The mega menu overrides both
 * with bordeaux.
 */

function MegaPanel({ href }: { href: string }) {
  const items: NavLink[] = href === '/services' ? SERVICES : INDUSTRIES
  const [hovered, setHovered] = useState<string | null>(null)
  const { reduced } = useMotionPrefs()

  const column = {
    hidden: { opacity: 0, y: reduced ? 0 : 8 },
    show: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { duration: 0.2, ease: EASE.enter, delay: i * STAGGER },
    }),
  }

  return (
    <div className="shell grid gap-x-step-5 gap-y-step-3 py-step-4 md:grid-cols-3">
      <m.div className="md:col-span-2" custom={0} variants={column} initial="hidden" animate="show">
        {items.length === 0 ? (
          // {{TODO: VERTICALS}} — spec section 3 forbids inventing these.
          <p className="max-w-[42ch] font-mono text-sm text-greige">
            {'{{TODO: VERTICALS}}'} — needs the 6 industries with real shipped
            evidence before this menu can render.
          </p>
        ) : (
          <ul className="grid gap-step-1 sm:grid-cols-2" onMouseLeave={() => setHovered(null)}>
            {items.map((item) => (
              <li key={item.href} className="relative">
                <Link
                  href={item.href}
                  onMouseEnter={() => setHovered(item.href)}
                  onFocus={() => setHovered(item.href)}
                  className="relative block rounded-sm p-step-2 no-underline"
                >
                  {hovered === item.href ? (
                    <m.span
                      layoutId="mega-indicator"
                      className="absolute inset-0 -z-10 rounded-sm bg-vanilla/8"
                      transition={reduced ? { duration: 0 } : EASE.spring}
                    />
                  ) : null}
                  <span className="font-display text-lg text-vanilla">{item.label}</span>
                  {item.blurb ? (
                    <span className="mt-1 block max-w-[38ch] text-sm text-greige">
                      {item.blurb}
                    </span>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </m.div>

      {/* Column 3: featured case study — blocked on {{TODO: CASE_STUDIES}}. */}
      <m.div
        className="border-greige/25 md:border-l md:pl-step-4"
        custom={1}
        variants={column}
        initial="hidden"
        animate="show"
      >
        <p className="font-mono text-xs tracking-tight text-greige">{'{{TODO: CASE_STUDIES}}'}</p>
        <p className="mt-step-1 max-w-[30ch] text-sm text-greige">
          Featured case study slot. Needs a named client, industry and one hard number.
        </p>
      </m.div>
    </div>
  )
}

export function Header() {
  const [hidden, setHidden] = useState(false)
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [overHero, setOverHero] = useState(true)
  const { reduced } = useMotionPrefs()
  const { scrollY } = useScroll()

  const openTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const menuOpenRef = useRef(false)
  useEffect(() => {
    menuOpenRef.current = openMenu !== null
  }, [openMenu])

  useMotionValueEvent(scrollY, 'change', (latest) => {
    const prev = scrollY.getPrevious() ?? 0
    if (menuOpenRef.current) return // never hide with the mega menu open
    if (reduced) return setHidden(false) // reduced motion: header never hides
    if (latest > prev && latest > 120) setHidden(true)
    else if (latest < prev) setHidden(false)
  })

  // Ground swap: observe the hero block's end, not a pixel constant.
  useEffect(() => {
    const sentinel = document.querySelector('[data-hero-end]')
    if (!sentinel) return
    const observer = new IntersectionObserver(
      ([entry]) => setOverHero(entry.boundingClientRect.top > 0 || entry.isIntersecting),
      { rootMargin: '-64px 0px 0px 0px', threshold: 0 },
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [])

  // Hover intent (spec 2.2): 120ms to open, 180ms grace to close.
  const intendOpen = (href: string) => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    openTimer.current = setTimeout(() => setOpenMenu(href), 120)
  }
  const intendClose = () => {
    if (openTimer.current) clearTimeout(openTimer.current)
    closeTimer.current = setTimeout(() => setOpenMenu(null), 180)
  }
  const cancelClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpenMenu(null)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const menuIsOpen = openMenu !== null
  // Three grounds, not two. Over the hero the header takes the hero's own oat,
  // so the bar disappears into that block the way it used to disappear into the
  // dark one; past the hero it is vanilla; and an open mega menu forces
  // bordeaux, because the panel hanging off it is bordeaux and a light bar on
  // top of a dark panel reads as a seam rather than as a header.
  const ground = menuIsOpen ? 'bordeaux' : overHero ? 'oat' : 'vanilla'
  // `on-dark` only when the header actually IS dark. It switches focus rings to
  // vanilla, which on the two light grounds would be a ring you cannot see.
  const onDark = ground === 'bordeaux'

  return (
    <m.header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-200 ${onDark ? 'on-dark' : ''}`}
      style={{
        background: `var(--color-${ground})`,
        color: onDark ? 'var(--color-vanilla)' : 'var(--color-bordeaux)',
        transitionTimingFunction: 'var(--ease-micro)',
      }}
      initial={false}
      animate={{ y: hidden ? '-100%' : '0%' }}
      transition={{ duration: 0.3, ease: EASE.micro }}
      onMouseLeave={intendClose}
    >
      <div className="shell flex items-center justify-between py-step-2">
        {/* The logo inherits the header's colour, so it stays legible through
            the ground swap. Height only — the aspect ratio is the SVG's. */}
        <Link
          href="/"
          aria-label="Engisols — home"
          className="no-underline"
          style={{ color: 'inherit' }}
        >
          <Logo idPrefix="nav" title="Engisols" className="h-6 w-auto md:h-7" />
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-step-3 lg:flex">
          {HEADER_LINKS.map((link) => {
            const hasMenu = MEGA_MENU_LINKS.has(link.href)
            return (
              <div
                key={link.href}
                onMouseEnter={() => (hasMenu ? intendOpen(link.href) : intendClose())}
              >
                <Link
                  href={link.href}
                  data-cursor="link"
                  className="py-step-1 text-sm no-underline underline-offset-4 hover:underline"
                  style={{ color: 'inherit' }}
                  aria-expanded={hasMenu ? openMenu === link.href : undefined}
                  aria-haspopup={hasMenu ? 'true' : undefined}
                  onFocus={() => hasMenu && setOpenMenu(link.href)}
                >
                  {link.label}
                </Link>
              </div>
            )
          })}
        </nav>

        {/* No data-cursor: this is already a button. See cursor-registry. */}
        <Link
          href={PRIMARY_CTA.href}
          className="rounded-full bg-cherry px-step-3 py-step-1 text-sm font-medium text-vanilla no-underline transition-opacity hover:opacity-90"
          style={{ transitionTimingFunction: 'var(--ease-micro)' }}
        >
          {PRIMARY_CTA.label}
        </Link>
      </div>

      <AnimatePresence>
        {openMenu ? (
          <m.div
            key="panel"
            className="absolute inset-x-0 top-full border-t border-greige/30 bg-bordeaux"
            onMouseEnter={cancelClose}
            onMouseLeave={intendClose}
            initial={{ opacity: 0, y: reduced ? 0 : -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: reduced ? 0 : -4, transition: { duration: 0.14, ease: EASE.micro } }}
            transition={{ duration: 0.2, ease: EASE.enter }}
          >
            {/* `layout` animates the height difference when switching between
                the Services and Industries panels instead of close/reopen. */}
            <m.div layout transition={reduced ? { duration: 0 } : EASE.spring}>
              <MegaPanel href={openMenu} />
            </m.div>
          </m.div>
        ) : null}
      </AnimatePresence>
    </m.header>
  )
}
