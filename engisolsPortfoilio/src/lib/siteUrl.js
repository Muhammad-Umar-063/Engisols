// Canonical site URL — no trailing slash so joining paths can never produce `//`.
export const SITE_URL = 'https://www.engisols.com'

export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.jpg`

/**
 * Resolves an image reference to an absolute URL. Social crawlers and
 * schema.org consumers ignore relative paths, so local assets under public/
 * must be prefixed with the canonical site URL. Already-absolute URLs pass
 * through untouched.
 */
export function toAbsoluteUrl(src) {
  if (!src) return DEFAULT_OG_IMAGE
  if (/^https?:\/\//i.test(src)) return src
  return `${SITE_URL}${src.startsWith('/') ? src : `/${src}`}`
}
