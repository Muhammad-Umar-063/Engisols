import Link from 'next/link'

/**
 * Legal pages for the campaign, on the campaign's own routes.
 *
 * The site has /privacy and /terms already, and linking to them from the
 * landing page would have punched the one hole the brief does not allow: a
 * visitor who clicks Privacy lands in the portfolio, with the header, the nav
 * and every route out of the funnel. Ad platforms want a privacy policy
 * reachable from the landing page, so the copy is shared and the ROUTE is not.
 *
 * Same source of truth as the site's versions — `content/pages.ts` — so the two
 * cannot drift into saying different things about the same company.
 *
 * The only link on the page goes back to the landing page.
 */
export function LpLegal({
  page,
}: {
  page: {
    title: string
    updated: string
    sections: { heading: string; body: string }[]
    blocker: string
  }
}) {
  return (
    <div className="shell py-step-6 lg:py-step-7">
      <Link
        href="/ai-app-audit"
        className="font-mono text-xs underline decoration-bordeaux/40 underline-offset-4"
      >
        Back to the audit page
      </Link>

      <h1 className="mt-step-4 text-[clamp(2rem,4vw,3rem)]">{page.title}</h1>
      <p className="mt-step-2 font-mono text-xs text-bordeaux/60">Last updated {page.updated}</p>

      <div className="mt-step-5 max-w-3xl">
        {page.sections.map((section) => (
          <section key={section.heading} className="border-t border-greige/50 py-step-4">
            <h2 className="font-display text-xl">{section.heading}</h2>
            <p className="measure mt-step-2 text-bordeaux/85">{section.body}</p>
          </section>
        ))}
        <p className="mt-step-4 border-l-2 border-bordeaux/30 pl-step-2 font-mono text-xs text-bordeaux/70">
          {page.blocker}
        </p>
      </div>
    </div>
  )
}
