import { Helmet } from 'react-helmet-async'

const websiteUrl = 'https://engisols.com/'

const schema = {
  '@context': 'https://schema.org',
  '@type': 'ProfessionalService',
  name: 'ENGISOLS',
  url: websiteUrl,
  slogan: 'Your Engineering Vanguard',
  description:
    'ENGISOLS is a modern software development company delivering web, mobile, cloud, and backend engineering solutions.',
  areaServed: 'Worldwide',
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'customer support',
    email: 'hello@engisols.com',
    availableLanguage: ['English'],
  },
}

export default function SeoMeta() {
  return (
    <Helmet>
      <title>ENGISOLS | Your Engineering Vanguard</title>
      <meta
        name="description"
        content="ENGISOLS builds modern web, mobile, and cloud products with scalable engineering and clear delivery." />
      <meta name="keywords" content="ENGISOLS, software development, web app development, mobile app development, cloud devops" />
      <meta property="og:type" content="website" />
      <meta property="og:title" content="ENGISOLS | Your Engineering Vanguard" />
      <meta
        property="og:description"
        content="We engineer intelligent digital solutions that power growth and scale ideas." />
      <meta property="og:url" content={websiteUrl} />
      <meta property="og:site_name" content="ENGISOLS" />
      <meta property="og:image" content={`${websiteUrl}og-image.png`} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="ENGISOLS | Your Engineering Vanguard" />
      <meta
        name="twitter:description"
        content="Software engineering partner for modern businesses." />
      <meta name="twitter:image" content={`${websiteUrl}og-image.png`} />
      <link rel="canonical" href={websiteUrl} />
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  )
}
