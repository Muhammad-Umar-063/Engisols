import type { ReactNode } from 'react'
import { SiteChrome } from '@/components/layout/SiteChrome'

/**
 * The site. Everything the public navigates: home, services, work, pricing,
 * the lot.
 *
 * `(site)` is a route group, so it contributes nothing to any URL — /pricing is
 * still /pricing. Its only job is to be a layout boundary the campaign landing
 * page sits outside of.
 */
export default function SiteLayout({ children }: { children: ReactNode }) {
  return <SiteChrome>{children}</SiteChrome>
}
