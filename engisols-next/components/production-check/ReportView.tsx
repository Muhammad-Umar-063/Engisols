import { ProductionCheckFooter } from '@/components/production-check/ProductionCheckFooter'
import { ProductionCheckHeader } from '@/components/production-check/ProductionCheckHeader'
import type { FounderReport, PersistedScan } from '@/src/production-check/types'
import type { ReviewRequestContext } from '@/src/production-check/review-intake'

import { FindingExplorer } from './FindingExplorer'
import { ReportActions } from './ReportActions'
import { ReportEvidenceExplorer } from './ReportEvidenceExplorer'

export function ReportView({ scan, report }: { scan: PersistedScan; report: FounderReport }) {
  return (
    <>
      <ProductionCheckHeader variant="report" />
      <ReportContent scan={scan} report={report} />
      <ProductionCheckFooter />
    </>
  )
}

export function ReportContent({ scan, report, showSummary = true }: { scan: PersistedScan; report: FounderReport; showSummary?: boolean }) {
  const result = scan.result
  if (!result) return null
  const fixes = fixesFor(result.target.finalUrl, report)
  const scannedAt = new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(scan.createdAt))
  const visibleFindings = report.counts.fixNow + report.counts.review
  const reviewContext = reviewContextFor(scan, report)

  return (
    <>
      {showSummary ? <section id="report-summary" data-ground="light" className="lp-in bg-vanilla text-bordeaux">
          <div className="shell scroll-mt-28 pb-step-5 pt-[calc(var(--spacing-step-3)+4.5rem)] lg:pb-step-6 lg:pt-[calc(var(--spacing-step-4)+4.5rem)]">
            <div className="flex flex-wrap items-center gap-x-step-2 gap-y-step-1 font-mono text-[0.68rem] tracking-[0.06em] text-bordeaux/65">
              <span>{scan.status === 'partial' ? 'PARTIAL SCAN' : 'SCAN COMPLETE'}</span>
              <span aria-hidden>·</span>
              <span>SCANNED {scannedAt.toUpperCase()}</span>
              <span aria-hidden>·</span>
              <span>PUBLIC SURFACE ONLY</span>
            </div>

            <p data-ph-sensitive-evidence className="production-check-wrap mt-step-2 font-mono text-xs text-bordeaux/70">{result.target.finalUrl}</p>
            <h1 data-ph-sensitive-evidence className="mt-step-2 max-w-[30ch] text-[clamp(2.2rem,4vw,3.6rem)]">{report.verdict}</h1>

            <div className="mt-step-4 grid gap-step-3 lg:grid-cols-[minmax(0,1.15fr)_minmax(22rem,.85fr)] lg:items-stretch">
              <section className="rounded-2xl border border-greige/55 bg-oat p-step-3" aria-labelledby="finding-summary-title">
                <div className="flex flex-wrap items-start justify-between gap-step-2">
                  <div>
                    <h2 id="finding-summary-title" className="text-xl sm:text-2xl">What the scan found</h2>
                    <p className="mt-step-1 text-sm text-bordeaux/70">
                      {visibleFindings === 0 ? 'No supported issue signal was observed.' : `${visibleFindings} ${visibleFindings === 1 ? 'item needs' : 'items need'} your attention.`}
                    </p>
                  </div>
                  <div className="rounded-full border border-bordeaux/20 bg-vanilla px-step-2 py-1 font-mono text-[0.68rem] tabular-nums text-bordeaux/70">
                    PUBLIC RISK {report.publicSurfaceRisk}/100
                  </div>
                </div>

                <div className="mt-step-3 grid grid-cols-3 divide-x divide-greige/60 border-y border-greige/60 py-step-2" aria-label="Finding summary">
                  <SummaryStat label="FIX NOW" count={report.counts.fixNow} urgent />
                  <SummaryStat label="REVIEW" count={report.counts.review} />
                  <SummaryStat label="EXPECTED" count={report.counts.expected} />
                </div>

                <p className="mt-step-2 text-sm leading-relaxed text-bordeaux/75">
                  <span className="font-medium capitalize text-bordeaux">{report.coverage.confidence} evidence coverage</span>
                  {' · '}{report.coverage.score}/100 sampled coverage
                  {' · '}{report.productionProof.needsCodeReview} controls still need code review.
                </p>
                {scan.status === 'partial' ? (
                  <p className="mt-step-2 text-sm leading-relaxed text-bordeaux/75">Some public assets blocked or outlasted automated access, so absence of a finding is not proof of readiness.</p>
                ) : null}
              </section>

              <section className="flex flex-col overflow-hidden rounded-2xl border border-cherry/30 bg-oat/45 p-step-3 text-bordeaux" aria-labelledby="start-here-title">
                <div className="flex flex-wrap items-center justify-between gap-step-2">
                  <div className="flex items-center gap-step-1">
                    <span aria-hidden className="h-1 w-step-3 rounded-full bg-cherry" />
                    <p className="font-mono text-[0.68rem] tracking-[0.08em] text-bordeaux/60">YOUR NEXT ENGINEERING DECISION</p>
                  </div>
                  <span className="rounded-full border border-cherry/35 bg-vanilla px-step-2 py-1 font-mono text-[0.62rem] text-bordeaux">START HERE</span>
                </div>
                <h2 data-ph-sensitive-evidence id="start-here-title" className="mt-step-2 max-w-[30ch] text-[clamp(1.55rem,2.5vw,2.05rem)]">{report.startHere.title}</h2>
                <p data-ph-sensitive-evidence className="mt-step-2 text-sm leading-relaxed text-bordeaux/80 sm:text-base">{report.startHere.action}</p>
                <div className="mt-auto pt-step-3">
                  <ReportActions
                    reportId={scan.publicId}
                    fixes={fixes}
                    prompt={report.builderPrompt?.prompt}
                    urgentFindings={report.counts.fixNow}
                    reviewContext={reviewContext}
                    tone="light"
                  />
                </div>
              </section>
            </div>
          </div>
      </section> : null}

      <section id="findings" data-ground="light" className="scroll-mt-24 bg-oat text-bordeaux">
          <div className="shell py-step-5 lg:py-step-6">
            <div className="grid gap-step-2 lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)] lg:items-end">
              <h2 className="text-[clamp(2.2rem,5vw,4.25rem)]">Choose a signal. See the decision behind it.</h2>
              <p className="measure text-bordeaux/75">Move between urgent, needs-review, and expected signals without reading a wall of cards. The selected finding keeps the evidence and next move together.</p>
            </div>
            {report.findings.length ? (
              <FindingExplorer findings={report.findings} />
            ) : (
              <div className="mt-step-4 border-t border-greige/60 py-step-4">
                <h3 className="text-2xl">No supported public exposure signal was found.</h3>
                <p className="measure mt-step-2 text-bordeaux/75">Continue with the production-proof checks below; a bounded public scan cannot verify private controls.</p>
              </div>
            )}
          </div>
      </section>

      <section id="coverage" data-ground="light" className="scroll-mt-24 bg-vanilla text-bordeaux">
          <div className="shell py-step-5 lg:py-step-6">
            <h2 className="max-w-[22ch] text-[clamp(2rem,4vw,3.6rem)]">Know what the scanner saw—and what it could not prove.</h2>
            <p className="measure mt-step-2 text-bordeaux/75">Explore the sampled surface, the source-level proof gap, and a ready-to-use engineering handoff.</p>
            <ReportEvidenceExplorer
              reportId={scan.publicId}
              coverage={result.coverage}
              coverageScore={report.coverage.score}
              confidence={report.coverage.confidence}
              coverageReasons={report.coverage.reasons}
              checks={report.productionProof.checks}
              needsCodeReview={report.productionProof.needsCodeReview}
              technologies={report.detectedTechnologies}
              builderPrompt={report.builderPrompt}
            />
          </div>
      </section>

    </>
  )
}

export function InlineReportPanel({ scan, report }: { scan: PersistedScan; report: FounderReport }) {
  const result = scan.result
  if (!result) return null
  const visibleFindings = report.counts.fixNow + report.counts.review
  const reviewContext = reviewContextFor(scan, report)

  return (
    <section className="rounded-2xl border border-greige/50 bg-vanilla p-step-3 text-bordeaux shadow-[0_24px_70px_-48px_rgba(42,20,24,0.75)] sm:p-step-4" aria-labelledby="inline-report-title">
      <div className="flex flex-wrap items-center justify-between gap-step-2 border-b border-greige/50 pb-step-2">
        <p className="font-display text-lg">Production check</p>
        <span className="rounded-full bg-oat px-step-2 py-1 font-mono text-[0.65rem] tabular-nums">100%</span>
      </div>

      <p data-ph-sensitive-evidence className="production-check-wrap mt-step-3 font-mono text-[0.68rem] text-bordeaux/60">{result.target.finalUrl}</p>
      <p role="status" className="mt-step-2 text-xl font-medium">
        {scan.status === 'partial' ? 'Check complete with limited coverage' : 'Check complete'}
      </p>

      <div
        className="mt-step-3 h-2 overflow-hidden rounded-full bg-oat"
        role="progressbar"
        aria-label="Production check progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={100}
      >
        <div className="h-full w-full rounded-full bg-cherry" />
      </div>

      <div className="lp-in mt-step-2 border-t border-greige/60 pt-step-2">
        <div className="flex flex-wrap items-center justify-between gap-step-2">
          <p className="font-mono text-[0.65rem] tracking-[0.06em] text-bordeaux/60">YOUR REPORT</p>
          <span className="rounded-full border border-bordeaux/20 px-step-2 py-1 font-mono text-[0.65rem] tabular-nums text-bordeaux/70">PUBLIC RISK {report.publicSurfaceRisk}/100</span>
        </div>
        <h2 data-ph-sensitive-evidence id="inline-report-title" className="mt-step-2 text-[clamp(1.55rem,2.4vw,2rem)]">{report.verdict}</h2>

        <div className="mt-step-2 grid grid-cols-3 divide-x divide-greige/60 border-y border-greige/60 py-step-1" aria-label="Finding summary">
          <SummaryStat label="FIX NOW" count={report.counts.fixNow} urgent compact />
          <SummaryStat label="REVIEW" count={report.counts.review} compact />
          <SummaryStat label="EXPECTED" count={report.counts.expected} compact />
        </div>
        <p className="mt-step-1 text-sm text-bordeaux/70">
          {visibleFindings} {visibleFindings === 1 ? 'item needs' : 'items need'} attention · <span className="capitalize">{report.coverage.confidence}</span> coverage.
        </p>

        <div className="mt-step-2 border-t border-greige/60 pt-step-2">
          <p className="font-mono text-[0.65rem] tracking-[0.06em] text-bordeaux/60">FIRST ACTION</p>
          <h3 data-ph-sensitive-evidence className="mt-step-1 text-lg">{report.startHere.title}</h3>
          <p data-ph-sensitive-evidence className="mt-step-1 text-sm leading-relaxed text-bordeaux/80">{report.startHere.action}</p>
        </div>

        <div className="mt-step-1">
          <ReportActions
            reportId={scan.publicId}
            fixes={fixesFor(result.target.finalUrl, report)}
            prompt={report.builderPrompt?.prompt}
            urgentFindings={report.counts.fixNow}
            reviewContext={reviewContext}
            tone="light"
          />
        </div>
        <a href="#findings" className="mt-step-2 inline-flex min-h-11 items-center font-mono text-xs text-bordeaux underline decoration-bordeaux/35 underline-offset-4">VIEW ALL FINDINGS</a>
      </div>
    </section>
  )
}

function fixesFor(targetUrl: string, report: FounderReport): string {
  return [
    `Production readiness review for ${targetUrl}`,
    '',
    ...report.findings.filter((item) => item.label !== 'EXPECTED').map((item, index) => `${index + 1}. ${item.title}\n${item.recommendedAction}`),
    '',
    'Do not weaken authentication, authorization, Row Level Security, or server-side validation while applying these changes.',
  ].join('\n')
}

function reviewContextFor(scan: PersistedScan, report: FounderReport): ReviewRequestContext {
  return {
    reportId: scan.publicId,
    targetUrl: scan.result?.target.finalUrl ?? scan.requestedUrl,
    verdict: report.verdict,
    recommendedAction: report.startHere.action,
    fixNow: report.counts.fixNow,
    review: report.counts.review,
    expected: report.counts.expected,
    needsCodeReview: report.productionProof.needsCodeReview,
    builder: scan.answers.builder,
    launchStage: scan.answers.launchStage,
  }
}

function SummaryStat({ label, count, urgent = false, compact = false }: { label: string; count: number; urgent?: boolean; compact?: boolean }) {
  return (
    <div className="min-w-0 px-step-1 text-center sm:px-step-2">
      <p className={`font-display leading-none tabular-nums ${compact ? 'text-[2rem]' : 'text-[clamp(2.2rem,6vw,3.5rem)]'} ${urgent && count > 0 ? 'text-cherry' : ''}`}>{count}</p>
      <p className="production-check-wrap mt-step-1 font-mono text-[0.58rem] tracking-[0.06em] text-bordeaux/65 sm:text-[0.68rem]">{label}</p>
    </div>
  )
}
