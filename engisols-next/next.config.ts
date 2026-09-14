import type { NextConfig } from 'next'
import { caseStudies } from './content/case-studies'

const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST
const posthogAssetsHost = posthogHost?.replace(/\/\/[^.]+\./, '//*.')

/**
 * Redirects and headers carried over from the old site.
 *
 * The live site's entire indexed surface is two patterns: `/` and
 * `/case-studies/{slug}`. The five slugs are identical in the new content file,
 * so the case study mapping is 1:1 and nothing needs a manual table. Every old
 * URL keeps its ranking; without these, five indexed pages 404 on launch day.
 *
 * Headers are the old `vercel.json` set, unchanged. The CSP still allows
 * googletagmanager because analytics is expected back — dropping it here and
 * rediscovering it after launch is a worse trade than a slightly wide policy.
 */
const nextConfig: NextConfig = {
  reactCompiler: true,

  async redirects() {
    return [
      // Apex to www. This lived in the old engisolsPortfoilio/vercel.json, and
      // Vercel reads vercel.json from the project ROOT — the moment the root
      // moves to engisols-next that file stops applying. Without this,
      // engisols.com serves the site instead of redirecting and Google sees
      // every page on two hostnames. Kept in code so it cannot be lost again.
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'engisols.com' }],
        destination: 'https://www.engisols.com/:path*',
        permanent: true,
      },
      // The old site's case studies moved to /work.
      ...caseStudies.map((study) => ({
        source: `/case-studies/${study.slug}`,
        destination: `/work/${study.slug}`,
        permanent: true,
      })),
      // Anything else under the old prefix goes to the index rather than a 404.
      { source: '/case-studies', destination: '/work', permanent: true },
      { source: '/case-studies/:slug*', destination: '/work', permanent: true },
    ]
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          {
            key: 'Content-Security-Policy',
            value:
              `default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://connect.facebook.net ${posthogAssetsHost ?? ''}; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https: https://www.google-analytics.com https://www.facebook.com; connect-src 'self' https: https://www.google-analytics.com https://analytics.google.com https://www.facebook.com; worker-src 'self' blob:; frame-ancestors 'self'; base-uri 'self'; form-action 'self'`,
          },
        ],
      },
    ]
  },
}

export default nextConfig
