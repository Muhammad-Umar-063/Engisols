'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ArrowIcon } from '@/components/ui/ActionIcons'
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
import { EASE } from '@/lib/motion'

/**
 * Light navigation over the original particle layout. Hover intent supports
 * pointer use; disclosure buttons support click, Enter, Arrow Down, and Escape.
 * Each panel follows its trigger in DOM order so Tab can reach every link.
 * The header stays visible while a menu is open or reduced motion is enabled.
 */

function MegaPanel({ href, close }: { href: string; close: () => void }) {
  const items: NavLink[] = href === '/services' ? SERVICES : INDUSTRIES
  const label = href === '/services' ? 'services' : 'industries'

  return (
    <div className="shell site-menu-content">
      <div className="site-menu-heading">
        <p className="font-display text-xl">{href === '/services' ? 'Services' : 'Industries'}</p>
        <Link href={href} onNavigate={close} className="site-card-action min-h-11">Explore all {label}<ArrowIcon /></Link>
      </div>
      <ul className="site-menu-list">
        {items.map((item) => (
          <li key={item.href}>
            <Link href={item.href} onNavigate={close} className="site-menu-row">
              <span className="site-service-name">{item.label}</span>
              {item.blurb ? <span className="site-service-description">{item.blurb}</span> : null}
              <ArrowIcon className="site-service-arrow" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function Header() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const mobileTrigger = useRef<HTMLButtonElement>(null)
  const menuTriggers = useRef<Record<string, HTMLButtonElement | null>>({})
  const menuPanels = useRef<Record<string, HTMLDivElement | null>>({})
  const focusMenuOnOpen = useRef<string | null>(null)
  const [hidden, setHidden] = useState(false)
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [overHero, setOverHero] = useState(true)
  const { reduced } = useMotionPrefs()
  const { scrollY } = useScroll()

  const openTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const menuOpenRef = useRef(false)
  useEffect(() => {
    menuOpenRef.current = openMenu !== null || mobileOpen
  }, [openMenu, mobileOpen])

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
  }, [pathname])

  // Hover intent (spec 2.2): 120ms to open, 180ms grace to close.
  const intendOpen = (href: string) => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    if (openTimer.current) clearTimeout(openTimer.current)
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
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (openTimer.current) clearTimeout(openTimer.current)
      if (closeTimer.current) clearTimeout(closeTimer.current)
      if (openMenu) menuTriggers.current[openMenu]?.focus()
      setOpenMenu(null)
      if (mobileOpen) {
        setMobileOpen(false)
        mobileTrigger.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [mobileOpen, openMenu])

  useEffect(() => () => {
    if (openTimer.current) clearTimeout(openTimer.current)
    if (closeTimer.current) clearTimeout(closeTimer.current)
  }, [])

  const closeNavigation = () => {
    focusMenuOnOpen.current = null
    setOpenMenu(null)
    setMobileOpen(false)
    if (openTimer.current) clearTimeout(openTimer.current)
    if (closeTimer.current) clearTimeout(closeTimer.current)
  }

  const ground = openMenu || mobileOpen ? 'vanilla' : pathname === '/' && overHero ? 'oat' : 'vanilla'

  return (
    <m.header
      className="site-header fixed inset-x-0 top-0 z-50 text-bordeaux transition-colors duration-200"
      style={{
        background: `var(--color-${ground})`,
        transitionTimingFunction: 'var(--ease-micro)',
      }}
      initial={false}
      animate={{ y: hidden ? '-100%' : '0%' }}
      transition={{ duration: 0.3, ease: EASE.micro }}
      onMouseLeave={intendClose}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) closeNavigation()
      }}
    >
      <div className="shell flex items-center justify-between gap-step-2 py-step-2">
        {/* The logo inherits the header's colour, so it stays legible through
            the ground swap. Height only — the aspect ratio is the SVG's. */}
        <Link
          href="/"
          aria-label="Engisols — home"
          className="inline-flex min-h-11 items-center no-underline"
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
                {hasMenu ? (
                  <button
                    ref={(node) => { menuTriggers.current[link.href] = node }}
                    type="button"
                    className="site-nav-link"
                    data-current={pathname === link.href || pathname.startsWith(`${link.href}/`) || undefined}
                    aria-expanded={openMenu === link.href}
                    aria-controls={`navigation-${link.label.toLowerCase()}`}
                    onClick={() => {
                      if (openTimer.current) clearTimeout(openTimer.current)
                      cancelClose()
                      setOpenMenu(openMenu === link.href ? null : link.href)
                    }}
                    onKeyDown={(event) => {
                      if (event.key !== 'ArrowDown') return
                      event.preventDefault()
                      if (openTimer.current) clearTimeout(openTimer.current)
                      cancelClose()
                      const firstLink = menuPanels.current[link.href]?.querySelector('a')
                      if (firstLink) firstLink.focus()
                      else {
                        focusMenuOnOpen.current = link.href
                        setOpenMenu(link.href)
                      }
                    }}
                  >
                    {link.label}
                    <svg className="site-nav-chevron" width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="m4 6 4 4 4-4" /></svg>
                  </button>
                ) : <Link
                  href={link.href}
                  data-cursor="link"
                  className="site-nav-link"
                  aria-current={pathname === link.href || pathname.startsWith(`${link.href}/`) ? 'page' : undefined}
                  onNavigate={closeNavigation}
                  onFocus={closeNavigation}
                >
                  {link.label}
                </Link>}
                <AnimatePresence>
                  {openMenu === link.href ? (
                    <m.div
                      id={`navigation-${link.label.toLowerCase()}`}
                      ref={(node) => {
                        menuPanels.current[link.href] = node
                        if (node && focusMenuOnOpen.current === link.href) {
                          focusMenuOnOpen.current = null
                          node.querySelector('a')?.focus()
                        }
                      }}
                      className="site-mega-panel absolute inset-x-0 top-full hidden lg:block"
                      data-lenis-prevent
                      onMouseEnter={cancelClose}
                      onMouseLeave={intendClose}
                      initial={{ opacity: 0, y: reduced ? 0 : -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, pointerEvents: 'none', transition: { duration: 0 } }}
                      transition={{ duration: reduced ? 0 : 0.18, ease: EASE.enter }}
                    >
                      <MegaPanel href={link.href} close={closeNavigation} />
                    </m.div>
                  ) : null}
                </AnimatePresence>
              </div>
            )
          })}
        </nav>

        <div className="flex items-center gap-step-1">
        <Link
          href={PRIMARY_CTA.href}
          className="site-button site-button-primary site-header-cta text-sm"
          onNavigate={closeNavigation}
          style={{ transitionTimingFunction: 'var(--ease-micro)' }}
        >
          {PRIMARY_CTA.label}
          <ArrowIcon />
        </Link>
        <button
          ref={mobileTrigger}
          type="button"
          className="site-button site-button-outline site-menu-toggle text-sm"
          aria-expanded={mobileOpen}
          aria-controls="mobile-navigation"
          onClick={() => { setMobileOpen(!mobileOpen); setOpenMenu(null); setHidden(false) }}
        >
          {mobileOpen ? 'Close' : 'Menu'}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
            <path d={mobileOpen ? 'm6 6 12 12M6 18 18 6' : 'M4 7h16M4 12h16M4 17h16'} />
          </svg>
        </button>
        </div>
      </div>

      <nav
        id="mobile-navigation"
        aria-label="Mobile navigation"
        hidden={!mobileOpen}
        className="absolute inset-x-0 top-full max-h-[calc(100svh-5rem)] overflow-y-auto border-t border-greige bg-vanilla text-bordeaux lg:hidden"
        data-lenis-prevent
      >
        <div className="shell py-step-2">
          {[...HEADER_LINKS, { label: 'About', href: '/about' }, { label: 'Contact', href: '/contact' }].map((link) => (
            <Link key={link.href} href={link.href} className="site-mobile-link"
              aria-current={pathname === link.href || pathname.startsWith(`${link.href}/`) ? 'page' : undefined}
              onNavigate={closeNavigation}>
              {link.label}<ArrowIcon />
            </Link>
          ))}
          <Link href={PRIMARY_CTA.href} onNavigate={closeNavigation} className="site-button site-button-primary my-step-2 w-full">{PRIMARY_CTA.label}</Link>
        </div>
      </nav>

    </m.header>
  )
}
