import type { Metadata } from 'next'
import { Bricolage_Grotesque, DM_Sans, Geist_Mono } from 'next/font/google'
import { MotionProvider } from '@/components/motion/MotionProvider'
import { SmoothScroll } from '@/components/motion/SmoothScroll'
import { ToastProvider } from '@/components/motion/Toast'
import { SITE } from '@/lib/site'
import './globals.css'
// Lenis ships five rules its instance depends on — most importantly
// `html.lenis, html.lenis body { height: auto }`. Imported from the package
// rather than copied into globals.css so it cannot drift from the version
// installed. It is why <html> no longer carries `h-full`: that rule would
// override it the moment smooth scrolling mounts, and a layout that depends on
// a height the scroller deletes is a layout that breaks on one npm update.
import 'lenis/dist/lenis.css'

/**
 * Engisols brand faces, carried over from the current site and self-hosted
 * through next/font — no external font requests, no CLS.
 *
 * This substitutes Bricolage Grotesque and DM Sans for the spec's Uncut Sans
 * and Inter Tight. The locked rule the spec actually cares about is "grotesque
 * only, no serif anywhere" (section 2), and Bricolage Grotesque is a grotesque,
 * so the typographic counterweight that stops this palette reading as a beauty
 * brand still holds. Bonus: both are on Google Fonts, which removes the
 * self-hosting blocker the spec's picks carried.
 */
const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-display-brand',
  display: 'swap',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-body-brand',
  display: 'swap',
})

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    // {{TODO: POSITIONING}} — the default title is a positioning decision, not
    // a copy decision. Left deliberately plain until Build Rescue vs general
    // AI-native build is settled.
    default: `${SITE.name} — Senior engineering practice`,
    template: `%s — ${SITE.name}`,
  },
  description:
    'Three senior engineers. No juniors, no account managers, no handoffs. AI-native software for teams whose last build stalled.',
  alternates: { canonical: '/' },
  robots: { index: true, follow: true },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${bricolage.variable} ${dmSans.variable} ${geistMono.variable}`}
    >
      {/* min-h-dvh, not min-h-full: a percentage min-height resolves against
          <html>'s height, which Lenis sets to auto. Viewport units do not care. */}
      <body className="flex min-h-dvh flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-60 focus:rounded-sm focus:bg-cherry focus:px-4 focus:py-2 focus:text-vanilla"
        >
          Skip to content
        </a>
        {/* Only what BOTH the site and the campaign landing page need. The
            header, the revealed footer and the cursor moved to `SiteChrome`,
            because the landing page must not render a single link back into
            the site — see components/layout/SiteChrome.tsx.

            The skip link stays here: every layout below provides `#main`. */}
        <MotionProvider>
          <SmoothScroll />
          <ToastProvider>{children}</ToastProvider>
        </MotionProvider>
      </body>
    </html>
  )
}
