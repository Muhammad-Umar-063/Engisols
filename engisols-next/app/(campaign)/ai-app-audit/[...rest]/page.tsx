import { notFound } from 'next/navigation'

/**
 * Catch-all under /ai-app-audit, so a mistyped campaign URL stays in the
 * campaign.
 *
 * Without it, /ai-app-audit/anything matches no route at all, and an unmatched
 * URL belongs to no route group — so Next falls back to the ROOT `not-found`,
 * which renders `SiteChrome`. Paid traffic that fat-fingers the URL would land
 * on the site's 404 with the full nav on it, which is the one destination this
 * campaign is built to avoid. Verified: before this file, /ai-app-audit/nope
 * served the site header.
 *
 * This route exists only to fail. Matching puts the request inside
 * `(campaign)`, and `notFound()` then resolves to the nearest boundary, which
 * is that group's own 404.
 *
 * It does not shadow /ai-app-audit/privacy or /terms — a static segment beats a
 * catch-all in App Router routing, so those still win.
 */
export default function CampaignCatchAll(): never {
  notFound()
}
