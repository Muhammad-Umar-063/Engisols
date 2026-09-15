import { notFound } from 'next/navigation'

import { OfferDecisionControls } from '@/components/production-check/OfferDecisionControls'
import { ProductionCheckFooter } from '@/components/production-check/ProductionCheckFooter'
import { ProductionCheckHeader } from '@/components/production-check/ProductionCheckHeader'
import { formatProductionScopeOfferPrice } from '@/src/production-check/config'
import { isValidScopeOfferId } from '@/src/production-check/scope-review'
import { getScopeOfferStore } from '@/src/production-check/store'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Your recommended next step | Engisols', robots: { index: false, follow: false } }

export default async function ScopeOfferPage({ params }: { params: Promise<{ offerId: string }> }) {
  const { offerId } = await params
  if (!isValidScopeOfferId(offerId)) notFound()
  const offer = await getScopeOfferStore().get(offerId)
  if (!offer || offer.status === 'draft') notFound()
  // This dynamic Server Component evaluates commercial expiry once per request.
  // eslint-disable-next-line react-hooks/purity
  const status = offer.status === 'sent' && new Date(offer.expiresAt).getTime() <= Date.now()
    ? 'expired'
    : offer.status
  const price = formatProductionScopeOfferPrice(offer.amount, offer.billing)

  return (
    <>
      <ProductionCheckHeader variant="report" />
      <main data-ground="light" className="bg-vanilla text-bordeaux">
        <div className="shell pb-step-6 pt-[calc(var(--spacing-step-4)+4.5rem)]">
          <p className="font-mono text-[0.68rem] tracking-[0.08em] text-cherry">ENGISOLS</p>
          <p className="mt-step-1 font-mono text-xs tracking-[0.06em] text-bordeaux/55">YOUR RECOMMENDED NEXT STEP</p>
          <div className="mt-step-3 grid gap-step-4 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
            <article className="min-w-0">
              <h1 className="max-w-[20ch] text-[clamp(2.4rem,6vw,5rem)]">{offer.title}</h1>
              {offer.type === 'launch_blocker_fix' ? (
                <p className="mt-step-2 max-w-[62ch] text-lg leading-relaxed text-bordeaux/75">Engisols fixes the small set of production blockers we’ve already validated in your application.</p>
              ) : null}
              <OfferSection title="Why we’re recommending this"><p>{offer.summary}</p></OfferSection>
              <OfferSection title="What we’ll fix / do"><ItemList items={offer.includedItems} /></OfferSection>
              <OfferSection title="What’s not included"><ItemList items={offer.exclusions.length ? offer.exclusions : ['Anything outside the agreed items above.']} /></OfferSection>
              <OfferSection title="Delivery"><p>{offer.deliveryWindow ?? 'Confirmed during onboarding.'}</p></OfferSection>
              {offer.type === 'launch_blocker_fix' ? (
                <OfferSection title="Package delivery">
                  <ItemList items={['Up to 3 specifically agreed production blockers', 'Implementation in your project or a working branch', 'Production Check re-run and written change summary', 'Short Loom walkthrough and one delivery clarification']} />
                </OfferSection>
              ) : null}
            </article>
            <aside className="rounded-2xl border border-cherry/30 bg-oat p-step-3 lg:sticky lg:top-28">
              <p className="font-mono text-[0.68rem] tracking-[0.06em] text-bordeaux/55">PRICE</p>
              <p className="mt-step-1 font-display text-[clamp(2rem,5vw,3.2rem)] font-semibold text-cherry">{price}</p>
              <div className="mt-step-3 border-t border-greige/60 pt-step-3">
                <OfferDecisionControls offerId={offer.id} scopeReviewId={offer.scopeReviewId} offerType={offer.type} amount={offer.amount} currency={offer.currency} initialStatus={status} />
              </div>
            </aside>
          </div>
        </div>
      </main>
      <ProductionCheckFooter />
    </>
  )
}

function OfferSection({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="mt-step-4 border-t border-greige/60 pt-step-3"><h2 className="font-mono text-xs font-semibold uppercase tracking-[0.06em] text-bordeaux/55">{title}</h2><div className="mt-step-2 max-w-[70ch] text-base leading-relaxed text-bordeaux/80">{children}</div></section>
}
function ItemList({ items }: { items: string[] }) { return <ul className="space-y-step-1">{items.map((item, index) => <li key={`${index}-${item}`} className="grid grid-cols-[1.5rem_minmax(0,1fr)] gap-step-1"><span aria-hidden className="font-mono text-cherry">{index + 1}.</span><span>{item}</span></li>)}</ul> }
