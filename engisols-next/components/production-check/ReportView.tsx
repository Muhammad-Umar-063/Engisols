import { Card, Eyebrow, TickItem } from '@/components/campaign/ui'
import { ProductionCheckFooter } from '@/components/production-check/ProductionCheckFooter'
import { ProductionCheckHeader } from '@/components/production-check/ProductionCheckHeader'
import type { FounderFinding, FounderReport, PersistedScan } from '@/src/production-check/types'

import { ReportActions } from './ReportActions'
import { TrackedDisclosure } from './TrackedDisclosure'

export function ReportView({ scan, report }: { scan: PersistedScan; report: FounderReport }) {
  const result = scan.result
  if (!result) return null
  const fixes = [
    `Production readiness review for ${result.target.finalUrl}`,
    '',
    ...report.findings.filter((item) => item.label !== 'EXPECTED').map((item, index) => `${index + 1}. ${item.title}\n${item.recommendedAction}`),
    '',
    'Do not weaken authentication, authorization, Row Level Security, or server-side validation while applying these changes.',
  ].join('\n')
  const scannedAt = new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(scan.createdAt))

  return (
    <>
      <ProductionCheckHeader />

      <section data-ground="light" className="bg-vanilla text-bordeaux">
        <div className="shell pb-step-6 pt-[calc(var(--spacing-step-6)+3.5rem)] lg:pt-[calc(var(--spacing-step-6)+4rem)]">
          <Eyebrow>PRODUCTION READINESS REPORT</Eyebrow>
          <div className="mt-step-4 grid gap-step-4 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,27rem)] lg:items-start">
            <div>
              <p className="production-check-wrap font-mono text-xs tracking-[0.08em] text-bordeaux/70">{result.target.finalUrl}</p>
              <h1 className="mt-step-2 max-w-[17ch] text-[clamp(2.6rem,5vw,4.5rem)]">{report.verdict}</h1>
              <div className="mt-step-4 flex flex-wrap gap-x-step-3 gap-y-step-1 font-mono text-xs text-bordeaux/70">
                <span>SCANNED {scannedAt.toUpperCase()}</span>
                <span>{scan.status === 'partial' ? 'PARTIAL SCAN' : 'SCAN COMPLETE'}</span>
                <span>PUBLIC-SURFACE ONLY</span>
              </div>
            </div>

            <section data-ground="dark" className="order-first rounded-2xl bg-cherry p-step-3 text-vanilla on-dark sm:p-step-4 lg:order-last">
              <p className="font-mono text-xs tracking-[0.08em] text-vanilla/75">OBSERVED PUBLIC-SURFACE RISK</p>
              <div className="mt-step-3 flex items-end gap-step-2">
                <p className="font-display text-[clamp(5rem,12vw,8rem)] leading-[0.75] tabular-nums">{report.publicSurfaceRisk}</p>
                <p className="pb-1 font-mono text-sm text-vanilla/75">/ 100</p>
              </div>
              <p className="mt-step-4 border-t border-vanilla/25 pt-step-3 text-sm leading-relaxed text-vanilla/90">Deterministic public exposure—not a claim that this app is {100 - report.publicSurfaceRisk}% production-ready.</p>
            </section>
          </div>

          {scan.status === 'partial' ? (
            <div className="mt-step-4 rounded-2xl border border-greige/60 bg-oat p-step-3">
              <p className="font-mono text-xs tracking-[0.08em]">PARTIAL SCAN</p>
              <p className="measure mt-step-2 text-bordeaux/85">Some public assets blocked or outlasted automated access. This report contains everything Scanner v1.1 could verify.</p>
            </div>
          ) : null}

          <div className="mt-step-5 grid grid-cols-3 gap-step-1 sm:gap-step-3" aria-label="Finding summary">
            <SummaryCard label="FIX NOW" count={report.counts.fixNow} tone="urgent" />
            <SummaryCard label="REVIEW" count={report.counts.review} tone="review" />
            <SummaryCard label="EXPECTED" count={report.counts.expected} tone="expected" />
          </div>

          <div className="mt-step-5 grid gap-step-3 lg:grid-cols-[minmax(0,1.2fr)_minmax(18rem,.8fr)]">
            <section className="rounded-2xl border border-greige/50 bg-oat p-step-3 sm:p-step-4">
              <p className="font-mono text-xs tracking-[0.08em] text-bordeaux/70">START HERE</p>
              <h2 className="mt-step-2 max-w-[25ch] text-[clamp(1.8rem,4vw,3rem)]">{report.startHere.title}</h2>
              <p className="measure mt-step-3 text-lg text-bordeaux/85">{report.startHere.action}</p>
            </section>
            <section className="rounded-2xl border border-greige/50 bg-vanilla p-step-3 sm:p-step-4">
              <p className="font-mono text-xs tracking-[0.08em] text-bordeaux/70">EVIDENCE COVERAGE</p>
              <p className="mt-step-2 font-display text-4xl capitalize">{report.coverage.confidence}</p>
              <p className="mt-step-2 text-sm leading-relaxed text-bordeaux/80">{report.coverage.score}/100 bounded coverage. {report.productionProof.needsCodeReview} production controls still need code review.</p>
            </section>
          </div>
        </div>
      </section>

      <section data-ground="light" className="bg-oat text-bordeaux">
        <div className="shell py-step-6">
          <div className="grid gap-step-3 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:items-end">
            <div>
              <Eyebrow>PRIORITIZED FINDINGS</Eyebrow>
              <h2 className="mt-step-3 text-[clamp(2.2rem,5vw,4.5rem)]">What matters, in order.</h2>
            </div>
            <p className="measure text-bordeaux/80">Every finding leads with the decision you need to make. Technical evidence stays available without taking over the report.</p>
          </div>
          {report.findings.length ? (
            <div className="mt-step-5 space-y-step-3">
              {report.findings.map((finding) => <FindingCard key={finding.id} finding={finding} />)}
            </div>
          ) : (
            <Card className="mt-step-5">
              <h3 className="text-2xl">No supported public exposure signal was found.</h3>
              <p className="measure mt-step-2 text-bordeaux/80">Continue with the production-proof checks below; a bounded public scan cannot verify private controls.</p>
            </Card>
          )}
        </div>
      </section>

      <section data-ground="light" className="bg-vanilla text-bordeaux">
        <div className="shell py-step-6">
          <div className="grid gap-step-3 lg:grid-cols-2">
            <Card className="h-full">
              <Eyebrow>DETECTED</Eyebrow>
              <h2 className="mt-step-3 text-3xl">Technology signals</h2>
              {report.detectedTechnologies.length ? (
                <ul className="mt-step-4 flex flex-wrap gap-step-1">
                  {report.detectedTechnologies.map((technology) => (
                    <li key={technology.name} className="rounded-full border border-greige/60 bg-oat/40 px-step-2 py-step-1 font-mono text-xs">{technology.name} · {technology.confidence}</li>
                  ))}
                </ul>
              ) : <p className="mt-step-3 text-bordeaux/75">No supported stack signal was confirmed in the sampled files.</p>}
            </Card>
            <Card className="h-full">
              <Eyebrow>WHAT THIS SCAN CANNOT VERIFY</Eyebrow>
              <h2 className="mt-step-3 text-3xl">The private side of production</h2>
              <ul className="mt-step-4 space-y-step-2 text-sm text-bordeaux/85">
                {['Database Row Level Security policies', 'Private server-side authorization logic', 'Private APIs and internal infrastructure', 'Source-code security and authentication bypasses', 'Penetration-test or compliance coverage'].map((item) => <TickItem key={item}>{item}</TickItem>)}
              </ul>
              <p className="measure mt-step-4 border-t border-greige/50 pt-step-3 text-sm text-bordeaux/80">We deliberately do not use discovered credentials, call discovered APIs, or attempt to exploit your application.</p>
            </Card>
          </div>

          {report.builderPrompt ? (
            <section className="mt-step-5 overflow-hidden rounded-2xl border border-greige/50">
              <div className="bg-bordeaux p-step-3 text-vanilla on-dark" data-ground="dark">
                <p className="font-mono text-xs tracking-[0.08em] text-vanilla/75">{report.builderPrompt.label.toUpperCase()}</p>
                <h2 className="mt-step-2 text-3xl">A safer first prompt.</h2>
              </div>
              <pre className="production-check-wrap whitespace-pre-wrap bg-oat p-step-3 font-mono text-sm leading-relaxed sm:p-step-4">{report.builderPrompt.prompt}</pre>
            </section>
          ) : null}

          <section className="mt-step-6">
            <Eyebrow>NEXT ACTION</Eyebrow>
            <h2 className="mt-step-3 text-[clamp(2.2rem,5vw,4.5rem)]">What do you want to do next?</h2>
            <div className="mt-step-4"><ReportActions reportId={scan.publicId} fixes={fixes} prompt={report.builderPrompt?.prompt} /></div>
          </section>

          <section className="mt-step-5 max-w-3xl rounded-2xl border border-greige/50 bg-oat p-step-3 sm:p-step-4">
            <p className="font-mono text-xs tracking-[0.08em] text-bordeaux/70">WANT A COPY OF THIS REPORT?</p>
            <p className="mt-step-2 text-bordeaux/80">Email delivery and automatic re-checks arrive in a later step. Your full report is already visible and shareable.</p>
            <div className="mt-step-3 flex flex-col gap-step-2 sm:flex-row">
              <label className="sr-only" htmlFor="future-report-email">Work email</label>
              <input id="future-report-email" type="email" disabled placeholder="work@email.com" className="h-12 min-w-0 flex-1 rounded-xl border border-bordeaux/25 bg-vanilla px-step-2 opacity-65" />
              <button type="button" disabled className="h-12 rounded-full border border-bordeaux/25 px-step-3 font-mono text-xs opacity-65 disabled:cursor-not-allowed">EMAIL DELIVERY COMING NEXT</button>
            </div>
          </section>
        </div>
      </section>

      <ProductionCheckFooter />
    </>
  )
}

function SummaryCard({ label, count, tone }: { label: string; count: number; tone: 'urgent' | 'review' | 'expected' }) {
  const urgent = tone === 'urgent' && count > 0
  const classes = urgent
    ? 'border-cherry bg-cherry text-vanilla on-dark'
    : tone === 'review'
      ? 'border-bordeaux bg-oat text-bordeaux'
      : 'border-greige/60 bg-vanilla text-bordeaux'
  return (
    <div data-ground={urgent ? 'dark' : 'light'} className={`min-w-0 rounded-2xl border p-step-2 text-center sm:p-step-3 ${classes}`}>
      <p className="font-display text-[clamp(2.75rem,8vw,5.5rem)] leading-none tabular-nums">{count}</p>
      <p className={`production-check-wrap mt-step-2 font-mono text-[0.62rem] tracking-[0.08em] sm:text-xs ${urgent ? 'text-vanilla/85' : 'text-bordeaux/75'}`}>{label}</p>
    </div>
  )
}

export function FindingCard({ finding }: { finding: FounderFinding }) {
  const urgent = finding.label === 'FIX NOW'
  const expected = finding.label === 'EXPECTED'
  return (
    <article className={`overflow-hidden rounded-2xl border bg-vanilla ${urgent ? 'border-cherry' : 'border-greige/60'}`}>
      <div className={`flex flex-wrap items-center justify-between gap-step-2 border-b px-step-3 py-step-2 sm:px-step-4 ${urgent ? 'border-cherry bg-cherry text-vanilla on-dark' : expected ? 'border-greige/50 bg-vanilla' : 'border-greige/60 bg-oat'}`} data-ground={urgent ? 'dark' : 'light'}>
        <p className="font-mono text-xs font-medium tracking-[0.1em]">{finding.label}</p>
        <p className={`font-mono text-[0.65rem] ${urgent ? 'text-vanilla/75' : 'text-bordeaux/60'}`}>{expected ? 'NORMAL BY DESIGN' : `RISK POINTS ${finding.riskPoints}`}</p>
      </div>
      <div className="p-step-3 sm:p-step-4">
        <h3 className="max-w-[30ch] text-[clamp(1.8rem,4vw,3.25rem)]">{finding.title}</h3>
        {expected ? <p className="mt-step-2 font-display text-xl">This can be normal.</p> : null}
        <div className="mt-step-4 grid gap-step-3 md:grid-cols-2">
          <Explanation title={expected ? 'Why this is expected' : 'Why this matters'} body={finding.whyItMatters} />
          <Explanation title="What we found" body={finding.whatWeFound} />
          {finding.whatWeCannotVerify ? <Explanation title="What we cannot verify" body={finding.whatWeCannotVerify} /> : null}
          <div className="rounded-xl bg-oat p-step-3">
            <Explanation title="Recommended action" body={finding.recommendedAction} />
          </div>
        </div>
        <div className="mt-step-4">
          <TrackedDisclosure findingId={finding.id}>
            <dl className="production-check-wrap mt-step-2 grid gap-step-1 rounded-xl bg-oat p-step-2 font-mono text-xs">
              <div><dt className="inline text-bordeaux/60">Rule </dt><dd className="inline">{finding.ruleId}</dd></div>
              <div><dt className="inline text-bordeaux/60">Category </dt><dd className="inline">{finding.technical.category}</dd></div>
              <div><dt className="inline text-bordeaux/60">Location </dt><dd className="inline">{finding.technical.location}</dd></div>
              <div><dt className="inline text-bordeaux/60">Evidence </dt><dd className="inline">{finding.technical.evidence}</dd></div>
            </dl>
          </TrackedDisclosure>
        </div>
      </div>
    </article>
  )
}

function Explanation({ title, body }: { title: string; body: string }) {
  return <div><p className="font-mono text-xs tracking-[0.06em] text-bordeaux/65">{title.toUpperCase()}</p><p className="measure mt-step-2 leading-relaxed text-bordeaux/90">{body}</p></div>
}
