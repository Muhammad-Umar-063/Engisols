import type { MetadataRoute } from 'next'
import { SITE } from '@/lib/site'

/** robots.txt — build spec section 12, "required at launch". */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Public noindex pages must be crawlable for their robots meta tags to
      // take effect. API endpoints are not search landing pages.
      disallow: ['/api/'],
    },
    sitemap: `${SITE.url}/sitemap.xml`,
    host: SITE.url,
  }
}
