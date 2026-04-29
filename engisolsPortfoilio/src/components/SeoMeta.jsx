import { Helmet } from 'react-helmet-async'

const SITE_URL = 'https://engisols.com'
const DEFAULT_TITLE = 'ENGISOLS | Your Engineering Vanguard'
const DEFAULT_DESCRIPTION =
  'ENGISOLS builds modern web, mobile, and cloud products with scalable engineering and clear delivery.'
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`

const baseSchema = {
  '@context': 'https://schema.org',
  '@type': 'ProfessionalService',
  name: 'ENGISOLS',
  url: `${SITE_URL}/`,
  slogan: 'Your Engineering Vanguard',
  description: DEFAULT_DESCRIPTION,
  areaServed: 'Worldwide',
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'customer support',
    email: 'hello@engisols.com',
    availableLanguage: ['English'],
  },
}

export default function SeoMeta({
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
  path = '/',
  image = DEFAULT_OG_IMAGE,
  type = 'website',
  schema,
  keywords = 'ENGISOLS, software development, web app development, mobile app development, cloud devops, case studies',
}) {
  const url = `${SITE_URL}${path}`
  const jsonLd = schema ?? baseSchema

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="robots" content="index, follow, max-image-preview:large" />

      <meta property="og:type" content={type} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:site_name" content="ENGISOLS" />
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      <link rel="canonical" href={url} />
      <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
    </Helmet>
  )
}
