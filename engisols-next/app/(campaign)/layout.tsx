import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { Cursor } from '@/components/motion/Cursor'

/**
 * Campaign routes — paid traffic only, sealed off from the site.
 *
 * The isolation is structural, not cosmetic. This layout renders no header, no
 * footer, no nav: `SiteChrome` holds every link into the site, and it is
 * mounted by `(site)/layout.tsx`, which these routes are not inside. So there
 * is nothing here to hide with CSS, nothing to tab into, nothing for a crawler
 * to follow and nothing in view-source. The only way in is the URL on the ad,
 * and the only way out is a mailto or the browser's back button.
 *
 * `noindex, nofollow` applies to everything under this layout and overrides the
 * root layout's `index, follow`. The page is also absent from sitemap.ts and
 * disallowed in robots.ts — three separate statements of the same intent,
 * because each one is read by a different thing.
 *
 * What is still shared, all of it from the root layout: fonts, the palette,
 * smooth scrolling and the toast provider. None of them carry a link.
 *
 * The custom cursor is mounted here rather than inherited, for the same reason:
 * it is pure behaviour with no navigation in it. It gates itself on a fine
 * pointer and reduced motion, so phones and anyone who asked for less motion
 * get the native cursor untouched.
 *
 * `data-ground` on the main element is what makes it VISIBLE, and it is not
 * optional. The cursor picks its fill from the nearest `[data-ground]` above
 * the pointer and treats a missing one as dark — so it paints vanilla, and on
 * this vanilla page that is an invisible cursor. Sections that set their own
 * ground still win; this only catches everything that does not, which on a
 * hand-built page is most of it.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function CampaignLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <main id="main" data-ground="light" className="flex-1 bg-vanilla text-bordeaux">
        {children}
      </main>
      <Cursor />
    </>
  )
}
