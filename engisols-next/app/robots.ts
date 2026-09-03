import type { MetadataRoute } from 'next'
import { SITE } from '@/lib/site'

/** robots.txt — build spec section 12, "required at launch". */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // The scan handoff is a post-conversion page, not an entry point.
      disallow: ['/scan/next'],
    },
    sitemap: `${SITE.url}/sitemap.xml`,
    host: SITE.url,
  }
}
