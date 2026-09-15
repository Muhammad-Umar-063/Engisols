import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'

import { OperatorReviewForm } from '@/components/production-check/OperatorReviewForm'
import { OPERATOR_COOKIE_NAME } from '@/src/production-check/operator-session.server'
import { productionCheckOperatorSecret, verifyOperatorToken } from '@/src/production-check/operator-token.server'
import { productionReportPath } from '@/src/production-check/paths'
import { loadScan } from '@/src/production-check/load'
import { buildFounderReport } from '@/src/production-check/report'
import { isValidScopeReviewId } from '@/src/production-check/scope-review'
import { getLeadStore, getScopeReviewStore } from '@/src/production-check/store'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Production Check operator review', robots: { index: false, follow: false } }

export default async function OperatorReviewPage({ params }: { params: Promise<{ scopeReviewId: string }> }) {
  const { scopeReviewId } = await params
  if (!isValidScopeReviewId(scopeReviewId)) notFound()
  const token = (await cookies()).get(OPERATOR_COOKIE_NAME)?.value
  let authorized = false
  try { authorized = Boolean(token && verifyOperatorToken(token, scopeReviewId, productionCheckOperatorSecret())) } catch { authorized = false }
  if (!authorized) notFound()
  const review = await getScopeReviewStore().get(scopeReviewId)
  if (!review) notFound()
  const lead = await getLeadStore().get(review.leadId)
  if (!lead) notFound()
  const scan = await loadScan(review.scanId).catch(() => null)
  const report = scan?.result ? buildFounderReport(scan.result, scan.answers.builder) : null

  return (
    <main data-ph-no-capture className="ph-no-capture min-h-screen bg-oat px-step-2 py-step-5 text-bordeaux sm:px-step-4">
      <div className="mx-auto max-w-5xl">
        <p className="font-mono text-xs tracking-[0.08em] text-cherry">ENGISOLS · SECURE OPERATOR REVIEW</p>
        <h1 className="mt-step-2 text-[clamp(2rem,5vw,4rem)]">Human scope decision</h1>
        <p className="mt-step-2 max-w-[68ch] text-bordeaux/70">Use the scanner as public-surface evidence and the founder context as commercial context. The final decision must remain human.</p>

        <section className="mt-step-4 grid gap-step-3 rounded-2xl border border-greige/55 bg-vanilla p-step-3 sm:grid-cols-2 sm:p-step-4">
          <div><p className={eyebrow}>Founder</p><p className="mt-1 text-lg font-semibold">{lead.name}</p><p className="text-bordeaux/70">{lead.email}</p></div>
          <div><p className={eyebrow}>Application</p><a className="mt-1 block break-all underline" href={lead.appUrl} rel="noreferrer">{lead.appUrl}</a><a className="mt-1 block underline" href={productionReportPath(review.scanId)}>Open public report</a></div>
          <Detail label="Launch stage" value={lead.launchStage ?? 'Not provided'} />
          <Detail label="Builder" value={lead.builder ?? 'Not provided'} />
          <Detail label="Help intent" value={lead.helpNeeded} />
          <Detail label="Timeline" value={lead.timeline} />
          <Detail label="Main concern" value={review.concern} />
          <Detail label="Limited evidence willingness" value={review.accessWillingness} />
          <div className="sm:col-span-2"><p className={eyebrow}>Sanitized scan summary</p><p className="mt-1">{lead.scanSummary.fixNow} FIX NOW · {lead.scanSummary.review} REVIEW · {lead.scanSummary.expected} EXPECTED · public risk {lead.scanSummary.publicRisk}/100</p></div>
          {report ? (
            <div className="sm:col-span-2">
              <p className={eyebrow}>Public-surface finding titles</p>
              <ul className="mt-step-1 space-y-1">
                {report.findings.filter((finding) => finding.label !== 'EXPECTED').map((finding) => (
                  <li key={finding.id}><span className="font-mono text-xs text-cherry">{finding.label}</span> · {finding.title}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {lead.shippingContext ? <div className="sm:col-span-2"><p className={eyebrow}>Founder context</p><p className="mt-1 whitespace-pre-wrap">{lead.shippingContext}</p></div> : null}
          {review.concernDetail ? <div className="sm:col-span-2"><p className={eyebrow}>Concern detail</p><p className="mt-1 whitespace-pre-wrap">{review.concernDetail}</p></div> : null}
        </section>

        <OperatorReviewForm scopeReviewId={review.id} initialDecision={review.decision} initialSummary={review.recommendationSummary} initialInformation={review.informationRequested} initialInternalNotes={review.internalNotes} />
      </div>
    </main>
  )
}

function Detail({ label, value }: { label: string; value: string }) { return <div><p className={eyebrow}>{label}</p><p className="mt-1 capitalize">{value.replaceAll('_', ' ')}</p></div> }
const eyebrow = 'font-mono text-[0.68rem] font-semibold uppercase tracking-[0.06em] text-bordeaux/55'
