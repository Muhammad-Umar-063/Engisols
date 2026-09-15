import { resolveMetaConsent } from '../../../../src/meta/consent'
import { isProductionCheckOfferUrl } from '../../../../src/production-check/analytics-privacy'

export const dynamic = 'force-dynamic'

export function GET(request: Request): Response {
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID
  const consent = resolveMetaConsent({
    cookieHeader: request.headers.get('cookie'),
    globalPrivacyControl: request.headers.get('sec-gpc') === '1',
  })
  const sourceUrl = request.headers.get('referer') ?? ''
  if (
    !pixelId ||
    !/^\d{5,32}$/.test(pixelId) ||
    consent === 'denied' ||
    isProductionCheckOfferUrl(sourceUrl)
  ) {
    return new Response(null, {
      status: 204,
      headers: { 'Cache-Control': 'private, no-store' },
    })
  }
  const fallback = new URL('https://www.facebook.com/tr')
  fallback.searchParams.set('id', pixelId)
  fallback.searchParams.set('ev', 'PageView')
  fallback.searchParams.set('noscript', '1')
  return Response.redirect(fallback, 307)
}
