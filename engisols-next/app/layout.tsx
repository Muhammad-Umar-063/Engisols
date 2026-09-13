import type { Metadata } from 'next'
import { DM_Sans, Geist_Mono } from 'next/font/google'
import localFont from 'next/font/local'
import { Suspense } from 'react'
import { MetaPixel } from '@/components/meta/MetaPixel'
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
 * The supplied Bricolage variable file is the approved interim Engisols face
 * while the Aeronaut webfont from the identity guide is unavailable. Loading
 * the exact local asset keeps it private, stable, and free of runtime requests.
 */
const bricolage = localFont({
  src: './fonts/BricolageGrotesque-Variable.ttf',
  variable: '--font-display-brand',
  display: 'swap',
  weight: '200 800',
  style: 'normal',
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
  const metaPixelId = /^\d{5,32}$/.test(process.env.NEXT_PUBLIC_META_PIXEL_ID ?? '')
    ? process.env.NEXT_PUBLIC_META_PIXEL_ID
    : undefined
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
        <Suspense fallback={null}>
          <MetaPixel pixelId={metaPixelId} />
        </Suspense>
        {metaPixelId ? (
          <noscript>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt=""
              height="1"
              width="1"
              className="absolute size-px overflow-hidden opacity-0"
              src="/api/meta/page-view"
            />
          </noscript>
        ) : null}
      </body>
    </html>
  )
}
