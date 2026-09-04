import Link from 'next/link'

/**
 * 404 for campaign routes.
 *
 * Not cosmetic. Next serialises the nearest `not-found` boundary into the RSC
 * payload of every page under it, so with only a root one — which renders
 * `SiteChrome` — the site's entire footer link list shipped inside the landing
 * page's own HTML. Not in the DOM, not clickable, not crawlable as links, but
 * present in view-source on a page whose whole brief is that the site is not
 * reachable from it. This boundary keeps that payload inside the campaign.
 *
 * It also fixes the behaviour it is named for: a mistyped /ai-app-audit/... now
 * lands somewhere that still belongs to the campaign, instead of dropping paid
 * traffic onto the site's 404 with the full nav on it.
 */
export default function CampaignNotFound() {
  return (
    <div className="shell py-step-7">
      <p className="font-mono text-xs tracking-tight text-bordeaux/60">404</p>
      <h1 className="mt-step-3 max-w-[18ch] text-[clamp(2rem,4vw,3rem)]">
        That page does not exist.
      </h1>
      <p className="measure mt-step-4 text-lg text-bordeaux/80">
        The audit page is still where you left it.
      </p>
      <Link
        href="/ai-app-audit"
        className="mt-step-4 inline-block rounded-full bg-cherry px-step-4 py-step-2 font-medium text-vanilla no-underline transition-opacity hover:opacity-90"
      >
        Back to the audit page
      </Link>
    </div>
  )
}
