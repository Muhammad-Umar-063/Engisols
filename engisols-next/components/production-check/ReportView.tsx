import { ProductionCheckFrame } from './ProductionCheckFrame'
import { ReportActions } from './ReportActions'
import { TrackedDisclosure } from './TrackedDisclosure'
import type { FounderFinding, FounderReport, PersistedScan } from '@/src/production-check/types'

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
      <ProductionCheckFrame
        eyebrow="ENGISOLS / PRODUCTION READINESS REPORT"
        title={report.verdict}
        lead={<>Public-surface assessment for <span className="production-check-wrap font-medium">{result.target.finalUrl}</span></>}
      >
        <div className="flex flex-wrap items-center gap-x-step-3 gap-y-step-1 font-mono text-xs text-current/60">
          <span>SCANNED {scannedAt.toUpperCase()}</span>
          <span>{scan.status === 'partial' ? 'PARTIAL SCAN' : 'SCAN COMPLETE'}</span>
          <span>PUBLIC-SURFACE ONLY</span>
        </div>

        {scan.status === 'partial' ? (
          <div className="mt-step-4 border-l-2 border-bordeaux bg-oat p-step-3">
            <p className="font-mono text-xs">PARTIAL SCAN</p>
            <p className="measure mt-step-1 text-sm">We inspected the public application, but some assets blocked or outlasted automated access. This report includes everything Scanner v1.1 was able to verify.</p>
          </div>
        ) : null}

        <div className="mt-step-5 grid gap-step-3 lg:grid-cols-[1.1fr_.9fr]">
          <section className="border-t-2 border-bordeaux pt-step-3">
            <p className="font-mono text-xs text-current/60">OBSERVED PUBLIC-SURFACE RISK</p>
            <div className="mt-step-1 flex items-end gap-step-2">
              <p className="font-display text-6xl tabular-nums">{report.publicSurfaceRisk}</p>
              <p className="pb-2 text-current/60">/ 100 risk</p>
            </div>
            <p className="measure mt-step-2 text-sm text-current/70">This measures deterministic public exposure signals. It is not a claim that the app is {100 - report.publicSurfaceRisk}% production-ready.</p>
          </section>
          <section className="border-t border-bordeaux/25 pt-step-3">
            <p className="font-mono text-xs text-current/60">EVIDENCE COVERAGE</p>
            <p className="mt-step-1 text-3xl capitalize">{report.coverage.confidence}</p>
            <p className="mt-step-1 text-sm text-current/70">{report.coverage.score}/100 bounded coverage · {report.productionProof.needsCodeReview} production controls still need code review.</p>
          </section>
        </div>

        <div className="mt-step-5 grid grid-cols-3 gap-step-1 sm:gap-step-3" aria-label="Finding summary">
          <SummaryCard label="FIX NOW" count={report.counts.fixNow} />
          <SummaryCard label="REVIEW" count={report.counts.review} />
          <SummaryCard label="EXPECTED" count={report.counts.expected} />
        </div>

        <section className="mt-step-6 border-t-2 border-bordeaux pt-step-4">
          <p className="font-mono text-xs text-current/60">START HERE</p>
          <h2 className="mt-step-2 max-w-[24ch] text-[clamp(1.75rem,4vw,3rem)]">{report.startHere.title}</h2>
          <p className="measure mt-step-3 text-lg text-current/80">{report.startHere.action}</p>
        </section>
      </ProductionCheckFrame>

      <section data-ground="light" className="bg-oat text-bordeaux">
        <div className="shell py-step-6 md:py-step-7">
          <p className="font-mono text-xs text-current/60">PRIORITIZED FINDINGS</p>
          <h2 className="mt-step-2 text-[clamp(2rem,5vw,4rem)]">What matters, in order</h2>
          {report.findings.length ? (
            <div className="mt-step-5 space-y-step-4">
              {report.findings.map((finding) => <FindingCard key={finding.id} finding={finding} />)}
            </div>
          ) : (
            <p className="measure mt-step-4 text-lg">No supported public exposure signal was found in the files Scanner v1.1 observed. Continue with the production-proof checks below.</p>
          )}
        </div>
      </section>

      <section data-ground="light" className="bg-vanilla text-bordeaux">
        <div className="shell py-step-6 md:py-step-7">
          <div className="grid gap-step-5 lg:grid-cols-2">
            <section>
              <p className="font-mono text-xs text-current/60">DETECTED</p>
              <h2 className="mt-step-2 text-3xl">Technology signals</h2>
              {report.detectedTechnologies.length ? (
                <ul className="mt-step-3 flex flex-wrap gap-step-1">
                  {report.detectedTechnologies.map((technology) => (
                    <li key={technology.name} className="rounded-full border border-bordeaux/25 px-step-2 py-step-1 text-sm">{technology.name} · {technology.confidence}</li>
                  ))}
                </ul>
              ) : <p className="mt-step-2 text-current/70">No supported stack signal was confirmed in the sampled files.</p>}
            </section>
            <section>
              <p className="font-mono text-xs text-current/60">WHAT THIS SCAN CANNOT VERIFY</p>
              <h2 className="mt-step-2 text-3xl">The private side of production</h2>
              <ul className="mt-step-3 space-y-step-1 text-sm text-current/75">
                {['Database Row Level Security policies', 'Private server-side authorization logic', 'Private APIs and internal infrastructure', 'Source-code security and authentication bypasses', 'Penetration-test or compliance coverage'].map((item) => <li key={item}>— {item}</li>)}
              </ul>
              <p className="measure mt-step-3 text-sm">We deliberately do not use discovered credentials, call discovered APIs, or attempt to exploit your application.</p>
            </section>
          </div>

          {report.builderPrompt ? (
            <section className="mt-step-6 border-t-2 border-bordeaux pt-step-4">
              <p className="font-mono text-xs text-current/60">{report.builderPrompt.label.toUpperCase()}</p>
              <pre className="production-check-wrap mt-step-3 max-w-3xl whitespace-pre-wrap rounded-sm bg-oat p-step-3 font-mono text-sm leading-relaxed">{report.builderPrompt.prompt}</pre>
            </section>
          ) : null}

          <section className="mt-step-6 border-t-2 border-bordeaux pt-step-4">
            <p className="font-mono text-xs text-current/60">NEXT ACTION</p>
            <h2 className="mt-step-2 text-[clamp(2rem,5vw,4rem)]">What do you want to do next?</h2>
            <div className="mt-step-4"><ReportActions reportId={scan.publicId} fixes={fixes} prompt={report.builderPrompt?.prompt} /></div>
          </section>

          <section className="mt-step-6 max-w-2xl border-t border-bordeaux/25 pt-step-4">
            <p className="font-mono text-xs text-current/60">WANT A COPY OF THIS REPORT?</p>
            <p className="mt-step-2 text-current/75">Email delivery and automatic re-checks arrive in a later step. Your full report is already visible and shareable above.</p>
            <div className="mt-step-3 flex flex-col gap-step-2 sm:flex-row">
              <label className="sr-only" htmlFor="future-report-email">Work email</label>
              <input id="future-report-email" type="email" disabled placeholder="work@email.com" className="h-12 min-w-0 flex-1 rounded-sm border border-bordeaux/20 bg-transparent px-step-2 opacity-60" />
              <button type="button" disabled className="h-12 rounded-full border border-bordeaux/20 px-step-3 opacity-60 disabled:cursor-not-allowed">Email delivery coming next</button>
            </div>
          </section>
        </div>
      </section>
    </>
  )
}

function SummaryCard({ label, count }: { label: string; count: number }) {
  return (
    <div className="min-w-0 border-t border-bordeaux/30 pt-step-2">
      <p className="font-display text-[clamp(2rem,7vw,4rem)] tabular-nums">{count}</p>
      <p className="production-check-wrap font-mono text-[0.65rem] tracking-tight text-current/65 sm:text-xs">{label}</p>
    </div>
  )
}

export function FindingCard({ finding }: { finding: FounderFinding }) {
  return (
    <article className="rounded-sm border border-bordeaux/20 bg-vanilla p-step-3 sm:p-step-4">
      <p className="font-mono text-xs text-current/60">{finding.label}</p>
      <h3 className="mt-step-2 max-w-[30ch] text-[clamp(1.4rem,3vw,2.25rem)]">{finding.title}</h3>
      <div className="mt-step-4 grid gap-step-3 md:grid-cols-2">
        <Explanation title={finding.label === 'EXPECTED' ? 'Why this is expected' : 'Why this matters'} body={finding.whyItMatters} />
        <Explanation title="What we found" body={finding.whatWeFound} />
        {finding.whatWeCannotVerify ? <Explanation title="What we cannot verify" body={finding.whatWeCannotVerify} /> : null}
        <Explanation title="Recommended action" body={finding.recommendedAction} />
      </div>
      <div className="mt-step-4">
        <TrackedDisclosure findingId={finding.id}>
          <dl className="production-check-wrap mt-step-2 grid gap-step-1 rounded-sm bg-oat p-step-2 font-mono text-xs">
            <div><dt className="inline text-current/55">Rule </dt><dd className="inline">{finding.ruleId}</dd></div>
            <div><dt className="inline text-current/55">Category </dt><dd className="inline">{finding.technical.category}</dd></div>
            <div><dt className="inline text-current/55">Location </dt><dd className="inline">{finding.technical.location}</dd></div>
            <div><dt className="inline text-current/55">Evidence </dt><dd className="inline">{finding.technical.evidence}</dd></div>
          </dl>
        </TrackedDisclosure>
      </div>
    </article>
  )
}

function Explanation({ title, body }: { title: string; body: string }) {
  return <div><p className="font-mono text-xs text-current/55">{title.toUpperCase()}</p><p className="measure mt-step-1 text-sm leading-relaxed text-current/80">{body}</p></div>
}
