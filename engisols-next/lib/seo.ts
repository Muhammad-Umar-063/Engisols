import type { Metadata } from 'next'
import { SITE } from '@/lib/site'

export const SITE_DESCRIPTION =
  'Software engineering for AI systems, web products, build rescue, automation, and cloud infrastructure. Explore client work and discuss your project with Engisols.'

type PageMetadata = {
  title: string
  description: string
  path: string
  robots?: Metadata['robots']
  image?: { url: string; alt: string }
}

/** Keep search results and shared links tied to the page being visited. */
export function createPageMetadata({ title, description, path, robots, image }: PageMetadata): Metadata {
  const url = new URL(path, SITE.url).href
  const socialTitle = `${title} — ${SITE.name}`
  const socialImage = image
    ? { url: new URL(image.url, SITE.url).href, alt: image.alt }
    : { url: `${SITE.url}/og-image.jpg`, width: 1200, height: 630, alt: 'Engisols — software engineering' }

  return {
    title,
    description,
    alternates: { canonical: url },
    ...(robots ? { robots } : {}),
    openGraph: {
      type: 'website',
      siteName: SITE.name,
      title: socialTitle,
      description,
      url,
      images: [socialImage],
    },
    twitter: {
      card: 'summary_large_image',
      title: socialTitle,
      description,
      images: [socialImage],
    },
  }
}

export function breadcrumbData(items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [{ name: 'Home', path: '/' }, ...items].map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: new URL(item.path, SITE.url).href,
    })),
  }
}
