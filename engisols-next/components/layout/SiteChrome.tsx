import type { ReactNode } from 'react'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import {
  FooterReveal,
  FooterRevealContent,
  FooterRevealFooter,
} from '@/components/motion/FooterReveal'
import { Cursor } from '@/components/motion/Cursor'

/**
 * Everything that makes a page part of the SITE: the header and its nav, the
 * revealed footer and its link columns, and the custom cursor.
 *
 * This lives outside the root layout because one route — the campaign landing
 * page — must not have it. A layout cannot read the pathname, so "chrome on
 * every page except that one" is not something the root layout can express;
 * the route group `(site)` renders this and `(campaign)` renders nothing.
 * Every link into the site is inside this component, which is what makes that
 * split a real boundary rather than a visual one: the landing page does not
 * hide the nav, it never renders it, so there is nothing in its DOM to tab to,
 * read out, or find in source.
 *
 * `not-found.tsx` uses it directly. A root not-found belongs to no route group,
 * so it gets the root layout — without this it would render as a bare 404 with
 * no way back to anything.
 *
 * The footer reveal (animation spec 13): the page is an opaque sheet that
 * scrolls off a sticky footer pinned behind it. The pin is CSS; Motion only
 * fades, scales and sharpens what it uncovers. Nothing between here and <body>
 * may clip overflow — that would turn the clipping element into the sticky
 * footer's scroll container and the reveal would silently never happen.
 */
export function SiteChrome({ children }: { children: ReactNode }) {
  return (
    <>
      <Header />
      <FooterReveal className="flex-1">
        <FooterRevealContent>
          <main id="main">{children}</main>
        </FooterRevealContent>
        <FooterRevealFooter>
          <div className="on-dark" data-ground="dark">
            <Footer />
          </div>
        </FooterRevealFooter>
      </FooterReveal>
      <Cursor />
    </>
  )
}
