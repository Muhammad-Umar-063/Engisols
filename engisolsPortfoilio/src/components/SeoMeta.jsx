import { Helmet } from 'react-helmet-async'

// Canonical site URL — no trailing slash so we don't generate `//` when joining paths.
const SITE_URL = 'https://www.engisols.com'
const DEFAULT_TITLE =
  'ENGISOLS | Your Engineering Vanguard'
const DEFAULT_DESCRIPTION =
  'ENGISOLS builds modern web, mobile, and cloud products for startups and enterprises. Scalable engineering, on-time delivery, transparent pricing.'
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.jpg`
const DEFAULT_KEYWORDS = [
  'web development agency Lahore',
  'custom software development Pakistan',
  'React development services Lahore',
  'MERN stack developers for hire',
  'build SaaS MVP Pakistan',
  'mobile app development company Pakistan',
  'hire Next.js developer',
  'cloud DevOps services Pakistan',
].join(', ')

// ─── Brand profile ────────────────────────────────────────────────────────────
// To enrich Google's Knowledge Graph entry, fill in the following constants
// with REAL values when they exist. Empty arrays / undefined values are
// excluded from the JSON-LD output below (better than fake URLs that 404).
const FOUNDING_YEAR = undefined // e.g. '2023' — set the year ENGISOLS was founded
const SOCIAL_URLS = [
  // 'https://www.linkedin.com/company/engisols',   // ← uncomment + fix when account exists
  // 'https://x.com/engisols',                       // ← uncomment + fix when account exists
  // 'https://github.com/engisols',                  // ← uncomment + fix when account exists
  // 'https://www.facebook.com/engisols',            // ← uncomment + fix when account exists
]
const TWITTER_HANDLE = undefined // e.g. '@engisols' — used for twitter:site meta tag
// ──────────────────────────────────────────────────────────────────────────────

const baseSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'ENGISOLS',
  legalName: 'ENGISOLS',
  url: `${SITE_URL}/`,
  logo: `${SITE_URL}/engisols-mark.svg`,
  slogan: 'Your Engineering Vanguard',
  description: DEFAULT_DESCRIPTION,
  ...(FOUNDING_YEAR ? { foundingDate: FOUNDING_YEAR } : {}),
  areaServed: 'Worldwide',
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Lahore',
    addressRegion: 'Punjab',
    addressCountry: 'PK',
  },
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'customer support',
    email: 'hello@engisols.com',
    availableLanguage: ['English'],
  },
  ...(SOCIAL_URLS.length > 0 ? { sameAs: SOCIAL_URLS } : {}),
  hasOfferCatalog: {
    '@type': 'OfferCatalog',
    name: 'Engineering Services',
    itemListElement: [
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Web Development' } },
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Mobile App Development' } },
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Cloud Solutions' } },
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Custom Software Development' } },
    ],
  },
}

export default function SeoMeta({
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
  path = '/',
  image = DEFAULT_OG_IMAGE,
  type = 'website',
  schema,
  keywords = DEFAULT_KEYWORDS,
}) {
  // Always start with a leading slash so SITE_URL + path can never produce `//`.
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  const url = `${SITE_URL}${normalizedPath}`
  const jsonLd = schema ?? baseSchema

  return (
    <Helmet>
      <html lang="en" />

      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content="ENGISOLS" />
      <meta name="robots" content="index, follow, max-image-preview:large" />
      <meta name="theme-color" content="#0e0e0e" />

      <meta property="og:type" content={type} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:site_name" content="ENGISOLS" />
      <meta property="og:locale" content="en_US" />
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content="ENGISOLS — Your Engineering Vanguard" />

      <meta name="twitter:card" content="summary_large_image" />
      {TWITTER_HANDLE && <meta name="twitter:site" content={TWITTER_HANDLE} />}
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      <link rel="canonical" href={url} />
      <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
    </Helmet>
  )
}
