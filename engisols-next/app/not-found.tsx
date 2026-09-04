import Link from 'next/link'
import { Band } from '@/components/layout/Band'
import { SiteChrome } from '@/components/layout/SiteChrome'
import { HEADER_LINKS } from '@/lib/site'

/**
 * 404 — content spec section 18. One section.
 *
 * Renders `SiteChrome` itself. A root `not-found` belongs to no route group, so
 * it gets the root layout, which no longer carries the header or footer — and a
 * 404 with no way back to anything is the one page that cannot afford that.
 */

export default function NotFound() {
  return (
    <SiteChrome>
      <Band ground="oat" className="pt-[calc(var(--spacing-step-6)+3rem)]">
        <p className="font-mono text-xs tracking-tight text-current/60">404</p>
        <h1 className="mt-step-3 max-w-[18ch] text-[clamp(2.25rem,5vw,4rem)]">
          That page does not exist.
        </h1>
        <p className="measure mt-step-4 text-lg text-current/85">
          Either it moved or it never did. Here is everything that does exist.
        </p>
        <ul className="mt-step-5 flex flex-wrap gap-step-3">
          {[{ label: 'Home', href: '/' }, ...HEADER_LINKS].map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                data-cursor="link"
                className="underline decoration-current/40 underline-offset-4 hover:decoration-current"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </Band>
    </SiteChrome>
  )
}
