import Link from 'next/link'
import { Logo } from '@/components/layout/Logo'
import { COMPANY, COMPARE, INDUSTRIES, LEGAL, SERVICES, SITE, type NavLink } from '@/lib/site'

/**
 * Footer — build spec section 9. Four columns: Services / Work and Industries /
 * Company / Legal.
 *
 * Server component. The reveal animation (section 12, `footer-reveal`) wraps
 * this in phase 2; the markup itself must stay server-rendered so the internal
 * links are in the first HTML response. Footer links carry a large share of the
 * site's internal linking — spec section 9 forbids orphan pages.
 */

function Column({ title, links }: { title: string; links: NavLink[] }) {
  return (
    <div>
      <h2 className="font-display text-sm font-medium text-vanilla">{title}</h2>
      <ul className="mt-step-2 space-y-step-1">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-sm text-greige underline decoration-greige/40 underline-offset-4 transition-colors hover:text-vanilla hover:decoration-vanilla"
              style={{ transitionTimingFunction: 'var(--ease-micro)' }}
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function Footer() {
  return (
    <footer className="on-dark bg-bordeaux text-vanilla">
      {/* py-step-6 rather than `band`, deliberately — the only place on the site
          that does not take the 160px desktop band. The footer reveal pins this
          with `sticky bottom-0`, and a sticky element taller than the viewport
          can never show its top edge, so the reveal stands down whenever the
          footer does not fit. At the band's 160px the footer measured 817px and
          the effect was dead on any laptop; at 96px it is ~689px and runs
          everywhere. Both values are on the spacing scale. */}
      <div className="shell py-step-6">
        <Link href="/" aria-label="Engisols — home" className="no-underline">
          <Logo idPrefix="footer" className="h-8 w-auto text-vanilla" />
        </Link>

        <div className="mt-step-5 grid gap-step-5 sm:grid-cols-2 lg:grid-cols-4">
          <Column title="Services" links={SERVICES} />

          <div>
            <h2 className="font-display text-sm font-medium text-vanilla">Work</h2>
            <ul className="mt-step-2 space-y-step-1">
              <li>
                <Link
                  href="/work"
                  className="text-sm text-greige underline decoration-greige/40 underline-offset-4 hover:text-vanilla"
                >
                  Selected work
                </Link>
              </li>
            </ul>

            <h2 className="mt-step-4 font-display text-sm font-medium text-vanilla">
              Industries
            </h2>
            {INDUSTRIES.length === 0 ? (
              // {{TODO: VERTICALS}} — these links are an SEO play; inventing
              // them would create orphan pages with no shipped evidence.
              <p className="mt-step-2 font-mono text-xs text-greige">
                {'{{TODO: VERTICALS}}'}
              </p>
            ) : (
              <ul className="mt-step-2 space-y-step-1">
                {INDUSTRIES.map((industry) => (
                  <li key={industry.href}>
                    <Link
                      href={industry.href}
                      className="text-sm text-greige underline decoration-greige/40 underline-offset-4 hover:text-vanilla"
                    >
                      {industry.label}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <Column title="Company" links={COMPANY} />
            <h2 className="mt-step-4 font-display text-sm font-medium text-vanilla">
              Compare
            </h2>
            <ul className="mt-step-2 space-y-step-1">
              {COMPARE.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-greige underline decoration-greige/40 underline-offset-4 hover:text-vanilla"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="font-display text-sm font-medium text-vanilla">Contact</h2>
            <ul className="mt-step-2 space-y-step-1">
              <li>
                <a
                  href={`mailto:${SITE.email}`}
                  className="text-sm text-greige underline decoration-greige/40 underline-offset-4 hover:text-vanilla"
                >
                  {SITE.email}
                </a>
              </li>
              <li>
                <a
                  href={`tel:${SITE.phone.replace(/\s/g, '')}`}
                  className="font-mono text-sm text-greige underline decoration-greige/40 underline-offset-4 hover:text-vanilla"
                >
                  {SITE.phone}
                </a>
              </li>
              <li>
                <a
                  href={SITE.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-greige underline decoration-greige/40 underline-offset-4 hover:text-vanilla"
                >
                  LinkedIn
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-step-6 flex flex-col gap-step-2 border-t border-greige/25 pt-step-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-greige">
            © {new Date().getFullYear()} {SITE.name}
          </p>
          <ul className="flex gap-step-3">
            {LEGAL.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-sm text-greige underline decoration-greige/40 underline-offset-4 hover:text-vanilla"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  )
}
