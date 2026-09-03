import type { MetadataRoute } from 'next'
import { caseStudies } from '@/content/case-studies'
import { comparePages } from '@/content/compare'
import { industries } from '@/content/industries'
import { services } from '@/content/services'
import { SITE } from '@/lib/site'

/**
 * Sitemap — build spec section 12, "required at launch".
 *
 * Two exclusions, both deliberate:
 *   Industry pages without a real case study. They are `noindex` in their own
 *   metadata, and listing a noindex URL in the sitemap tells Google two
 *   opposite things about the same page.
 *   `/scan/next`, which is a post-scan handoff and has no standalone value.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = SITE.url
  const now = new Date()

  const entry = (path: string, priority: number): MetadataRoute.Sitemap[number] => ({
    url: `${base}${path}`,
    lastModified: now,
    priority,
  })

  return [
    entry('/', 1),
    entry('/pricing/build-audit', 0.9),
    entry('/work', 0.8),
    ...caseStudies.map((study) => entry(`/work/${study.slug}`, 0.8)),
    entry('/services', 0.8),
    ...services.map((service) => entry(`/services/${service.slug}`, 0.8)),
    entry('/pricing', 0.8),
    entry('/compare', 0.7),
    ...comparePages.map((page) => entry(`/compare/${page.slug}`, 0.7)),
    entry('/process', 0.6),
    entry('/about', 0.6),
    entry('/contact', 0.6),
    entry('/industries', 0.5),
    ...industries.filter((i) => i.evidenced).map((i) => entry(`/industries/${i.slug}`, 0.5)),
    entry('/scan', 0.5),
    entry('/blog', 0.3),
    entry('/privacy', 0.2),
    entry('/terms', 0.2),
  ]
}
