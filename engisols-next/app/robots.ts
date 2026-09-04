import type { MetadataRoute } from 'next'
import { SITE } from '@/lib/site'

/** robots.txt — build spec section 12, "required at launch". */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // The scan handoff is a post-conversion page, not an entry point.
      // /ai-app-audit is a paid-traffic landing page: it duplicates the site's
      // pitch by design, nothing links to it, and it must never compete with
      // the real pages in search. It is `noindex` in its own layout and absent
      // from the sitemap as well — three statements of the same intent,
      // because a crawler, an indexer and a sitemap parser each read a
      // different one.
      disallow: ['/scan/next', '/ai-app-audit'],
    },
    sitemap: `${SITE.url}/sitemap.xml`,
    host: SITE.url,
  }
}
