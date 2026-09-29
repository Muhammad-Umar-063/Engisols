import type { ReactNode } from 'react'
import { SiteChrome } from '@/components/layout/SiteChrome'
import { JsonLd } from '@/components/seo/JsonLd'
import { SITE } from '@/lib/site'
import { SITE_DESCRIPTION } from '@/lib/seo'

/**
 * The site. Everything the public navigates: home, services, work, pricing,
 * the lot.
 *
 * `(site)` is a route group, so it contributes nothing to any URL — /pricing is
 * still /pricing. Its only job is to be a layout boundary the campaign landing
 * page sits outside of.
 */
export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <SiteChrome>
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'Organization',
            '@id': `${SITE.url}/#organization`,
            name: SITE.name,
            url: SITE.url,
            logo: `${SITE.url}/icon.svg`,
            description: SITE_DESCRIPTION,
            email: SITE.email,
            telephone: SITE.phone,
            sameAs: [SITE.linkedin],
          },
          {
            '@type': 'WebSite',
            '@id': `${SITE.url}/#website`,
            name: SITE.name,
            url: SITE.url,
            inLanguage: 'en',
            publisher: { '@id': `${SITE.url}/#organization` },
          },
        ],
      }} />
      {children}
    </SiteChrome>
  )
}
