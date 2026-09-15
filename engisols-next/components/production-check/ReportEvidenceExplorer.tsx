'use client'

import { useState } from 'react'
import type { ReactNode, SyntheticEvent } from 'react'

import { useToast } from '@/components/motion/Toast'
import { trackProductionCheck } from '@/src/production-check/analytics'
import type { DetectedTechnology, ProductionProofCheck, ScanCoverage } from '@/src/scanner/types'

type EvidenceLens = 'surface' | 'source' | 'handoff'

export function ReportEvidenceExplorer({
  reportId,
  coverage,
  coverageScore,
  confidence,
  coverageReasons,
  checks,
  needsCodeReview,
  technologies,
  builderPrompt,
}: {
  reportId: string
  coverage: ScanCoverage
  coverageScore: number
  confidence: string
  coverageReasons: string[]
  checks: ProductionProofCheck[]
  needsCodeReview: number
  technologies: DetectedTechnology[]
  builderPrompt?: { label: string; prompt: string }
}) {
  const [lens, setLens] = useState<EvidenceLens>('surface')
  const [copied, setCopied] = useState(false)
  const { push } = useToast()

  function chooseLens(nextLens: EvidenceLens) {
    setLens(nextLens)
    trackProductionCheck('report_lens_selected', { reportId, lens: nextLens })
  }

  async function copyPrompt() {
    if (!builderPrompt) return
    try {
      await navigator.clipboard.writeText(builderPrompt.prompt)
      setCopied(true)
      trackProductionCheck('copy_prompt_clicked', { reportId, location: 'evidence_lens' })
      push('Builder handoff copied.')
    } catch {
      setCopied(false)
      push('Copy was blocked by the browser. Select the text manually.', 'error')
    }
  }

  const needsSourceReview = checks.filter((check) => check.status === 'needs_code_review')
  const observedChecks = checks.filter((check) => check.status !== 'needs_code_review')

  return (
    <div className="mt-step-4 overflow-hidden rounded-2xl border border-greige/70 bg-oat/35">
      <div data-ph-sensitive-evidence className="grid gap-step-3 border-b border-greige/60 p-step-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end sm:p-step-4">
        <div>
          <div className="flex items-end gap-step-2">
            <span className="font-display text-[clamp(3rem,7vw,5.5rem)] leading-none tabular-nums">{coverageScore}</span>
            <span className="pb-step-1 font-mono text-xs text-bordeaux/55">/ 100 SAMPLED</span>
          </div>
          <p className="mt-step-1 max-w-[54ch] text-sm leading-relaxed text-bordeaux/70">
            <span className="font-medium capitalize text-bordeaux">{confidence} public evidence coverage.</span> This measures what the passive scan reached—not whether the private codebase is production-ready.
          </p>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-greige/35 sm:w-64" role="meter" aria-label="Sampled public evidence coverage" aria-valuemin={0} aria-valuemax={100} aria-valuenow={coverageScore}>
          <div className="h-full rounded-full bg-cherry transition-[width] duration-500 motion-reduce:transition-none" style={{ width: `${coverageScore}%` }} />
        </div>
      </div>

      <div className="divide-y divide-greige/60 md:hidden">
        <MobileEvidenceSection label="Public surface" count={`${coverage.scripts.scanned} scripts`} lens="surface" reportId={reportId} defaultOpen>
          <SurfaceEvidence coverage={coverage} coverageReasons={coverageReasons} technologies={technologies} />
        </MobileEvidenceSection>
        <MobileEvidenceSection label="Needs source access" count={`${needsCodeReview} checks`} lens="source" reportId={reportId}>
          <SourceEvidence needsSourceReview={needsSourceReview} observedChecks={observedChecks} />
        </MobileEvidenceSection>
        <MobileEvidenceSection label="Handoff kit" count={builderPrompt ? 'Ready to copy' : 'Review brief'} lens="handoff" reportId={reportId}>
          <HandoffEvidence builderPrompt={builderPrompt} copied={copied} onCopy={copyPrompt} />
        </MobileEvidenceSection>
      </div>

      <div className="hidden border-b border-greige/60 px-step-3 pt-step-2 md:block" role="tablist" aria-label="Report evidence views">
        <div className="flex gap-step-1 overflow-x-auto">
          <LensButton active={lens === 'surface'} onClick={() => chooseLens('surface')} controls="surface-evidence">PUBLIC SURFACE</LensButton>
          <LensButton active={lens === 'source'} onClick={() => chooseLens('source')} controls="source-evidence">NEEDS SOURCE ACCESS <span className="opacity-60">{needsCodeReview}</span></LensButton>
          <LensButton active={lens === 'handoff'} onClick={() => chooseLens('handoff')} controls="handoff-evidence">HANDOFF KIT</LensButton>
        </div>
      </div>

      <div className="hidden min-h-[22rem] bg-vanilla p-step-4 md:block">
        <div data-ph-sensitive-evidence id="surface-evidence" role="tabpanel" hidden={lens !== 'surface'}>
          <SurfaceEvidence coverage={coverage} coverageReasons={coverageReasons} technologies={technologies} />
        </div>

        <div data-ph-sensitive-evidence id="source-evidence" role="tabpanel" hidden={lens !== 'source'}>
          <SourceEvidence needsSourceReview={needsSourceReview} observedChecks={observedChecks} />
        </div>

        <div data-ph-sensitive-evidence id="handoff-evidence" role="tabpanel" hidden={lens !== 'handoff'}>
          <HandoffEvidence builderPrompt={builderPrompt} copied={copied} onCopy={copyPrompt} />
        </div>
      </div>
    </div>
  )
}

function MobileEvidenceSection({ label, count, lens, reportId, defaultOpen = false, children }: { label: string; count: string; lens: EvidenceLens; reportId: string; defaultOpen?: boolean; children: ReactNode }) {
  const [open, setOpen] = useState(defaultOpen)

  function trackOpen(event: SyntheticEvent<HTMLDetailsElement>) {
    const nextOpen = event.currentTarget.open
    setOpen(nextOpen)
    if (event.currentTarget === event.target && nextOpen && event.nativeEvent.isTrusted) {
      trackProductionCheck('report_lens_selected', { reportId, lens, layout: 'mobile_accordion' })
    }
  }

  return (
    <details className="group bg-vanilla" open={open} onToggle={trackOpen}>
      <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-step-2 px-step-3 font-mono text-[0.68rem] tracking-[0.04em] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-cherry">
        <span>{label.toUpperCase()} <span className="text-bordeaux/50">{count}</span></span>
        <ChevronIcon />
      </summary>
      <div data-ph-sensitive-evidence className="border-t border-greige/60 px-step-3 pb-step-4 pt-step-3">{children}</div>
    </details>
  )
}

function SurfaceEvidence({ coverage, coverageReasons, technologies }: { coverage: ScanCoverage; coverageReasons: string[]; technologies: DetectedTechnology[] }) {
  return (
    <>
      <p className="font-mono text-[0.68rem] tracking-[0.06em] text-bordeaux/60">WHAT THE SCANNER ACTUALLY REACHED</p>
      <div className="mt-step-3 grid gap-step-3 md:grid-cols-3">
        <CoverageMetric label="DOCUMENTS" scanned={coverage.documents.scanned} discovered={coverage.documents.discovered} />
        <CoverageMetric label="JAVASCRIPT" scanned={coverage.scripts.scanned} discovered={coverage.scripts.discovered} />
        <CoverageMetric label="DISCOVERY FILES" scanned={coverage.metadata.scanned} discovered={coverage.metadata.discovered} />
      </div>
      <div className="mt-step-4 grid gap-step-4 lg:grid-cols-2">
        <div>
          <h3 className="text-xl">Technology signals</h3>
          {technologies.length ? (
            <ul className="mt-step-2 flex flex-wrap gap-step-1">
              {technologies.map((technology) => <li key={technology.name} className="rounded-full border border-greige/70 px-step-2 py-step-1 font-mono text-xs">{technology.name} · {technology.confidence}</li>)}
            </ul>
          ) : <p className="mt-step-2 text-bordeaux/70">No supported stack signal was confirmed in the sampled files.</p>}
        </div>
        <div>
          <h3 className="text-xl">Why coverage stopped here</h3>
          <ul className="mt-step-2 space-y-step-2 text-sm leading-relaxed text-bordeaux/75">
            {coverageReasons.map((reason) => <li key={reason} className="border-l border-greige/70 pl-step-2">{reason}</li>)}
          </ul>
        </div>
      </div>
    </>
  )
}

function SourceEvidence({ needsSourceReview, observedChecks }: { needsSourceReview: ProductionProofCheck[]; observedChecks: ProductionProofCheck[] }) {
  return (
    <>
      <div className="grid gap-step-3 lg:grid-cols-[minmax(0,.75fr)_minmax(0,1.25fr)]">
        <div>
          <p className="font-mono text-[0.68rem] tracking-[0.06em] text-bordeaux/60">THE PROOF GAP</p>
          <h3 className="mt-step-2 text-[clamp(1.8rem,3vw,2.6rem)]">Public files cannot answer private-control questions.</h3>
          <p className="measure mt-step-2 leading-relaxed text-bordeaux/75">These are not confirmed failures. They are the decisions a source-level review would need to prove.</p>
        </div>
        <div className="divide-y divide-greige/60 border-y border-greige/60">
          {(needsSourceReview.length ? needsSourceReview : fallbackSourceChecks).map((check) => (
            <details key={check.id} className="group py-step-2">
              <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-step-2 font-medium">
                <span>{check.title}</span>
                <span aria-hidden className="font-mono text-xl font-light text-cherry transition-transform group-open:rotate-45 motion-reduce:transition-none">+</span>
              </summary>
              <p className="measure pb-step-2 text-sm leading-relaxed text-bordeaux/70">{check.summary}</p>
            </details>
          ))}
        </div>
      </div>
      {observedChecks.length ? (
        <p className="mt-step-4 border-t border-greige/60 pt-step-2 text-sm text-bordeaux/65">The scan also recorded {observedChecks.length} public-evidence {observedChecks.length === 1 ? 'check' : 'checks'}. Those observations remain bounded to the files reached.</p>
      ) : null}
    </>
  )
}

function HandoffEvidence({ builderPrompt, copied, onCopy }: { builderPrompt?: { label: string; prompt: string }; copied: boolean; onCopy: () => void }) {
  return (
    <div className="grid gap-step-4 lg:grid-cols-[minmax(0,.7fr)_minmax(0,1.3fr)]">
      <div>
        <p className="font-mono text-[0.68rem] tracking-[0.06em] text-bordeaux/60">TURN SIGNALS INTO A REVIEW</p>
        <h3 className="mt-step-2 text-[clamp(1.8rem,3vw,2.6rem)]">Give your engineer the evidence and the boundary.</h3>
        <ol className="mt-step-3 space-y-step-2 text-sm leading-relaxed text-bordeaux/75">
          <li><span className="font-mono text-cherry">01</span> Share this report link.</li>
          <li><span className="font-mono text-cherry">02</span> Start with the recommended action, not the risk score.</li>
          <li><span className="font-mono text-cherry">03</span> Verify private authorization, payment, and secret-handling controls in source.</li>
        </ol>
      </div>
      <div className="rounded-xl border border-greige/70 bg-oat/40 p-step-3">
        {builderPrompt ? (
          <>
            <div className="flex flex-wrap items-center justify-between gap-step-2">
              <p className="font-mono text-[0.68rem] tracking-[0.06em] text-bordeaux/60">{builderPrompt.label.toUpperCase()}</p>
              <button type="button" onClick={onCopy} className="min-h-11 rounded-full bg-cherry px-step-3 font-mono text-[0.68rem] text-vanilla transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cherry">
                {copied ? 'HANDOFF COPIED' : 'COPY HANDOFF'}
              </button>
            </div>
            <pre className="production-check-wrap mt-step-2 max-h-72 overflow-auto whitespace-pre-wrap font-mono text-sm leading-relaxed text-bordeaux/80">{builderPrompt.prompt}</pre>
          </>
        ) : (
          <>
            <p className="font-mono text-[0.68rem] tracking-[0.06em] text-bordeaux/60">REVIEW BRIEF</p>
            <p className="mt-step-2 leading-relaxed text-bordeaux/80">Bring the report URL, repository access, deployment configuration, authentication model, payment flow, and database authorization policies to a source-level review.</p>
          </>
        )}
      </div>
    </div>
  )
}

function ChevronIcon() {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180 motion-reduce:transition-none" fill="none">
      <path d="m4 6 4 4 4-4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function LensButton({ active, onClick, controls, children }: { active: boolean; onClick: () => void; controls: string; children: ReactNode }) {
  return (
    <button type="button" role="tab" aria-selected={active} aria-controls={controls} onClick={onClick} className={`min-h-12 shrink-0 border-b-2 px-step-2 font-mono text-[0.68rem] tracking-[0.04em] transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-cherry ${active ? 'border-cherry text-bordeaux' : 'border-transparent text-bordeaux/55 hover:text-bordeaux'}`}>
      {children}
    </button>
  )
}

function CoverageMetric({ label, scanned, discovered }: { label: string; scanned: number; discovered: number }) {
  const ratio = discovered === 0 ? 0 : Math.min(100, Math.round((scanned / discovered) * 100))
  return (
    <div className="border-t border-greige/60 pt-step-2">
      <div className="flex items-end justify-between gap-step-2">
        <p className="font-mono text-[0.68rem] text-bordeaux/55">{label}</p>
        <p className="font-display text-2xl tabular-nums">{scanned}<span className="text-base text-bordeaux/45">/{discovered}</span></p>
      </div>
      <div className="mt-step-1 h-1 overflow-hidden rounded-full bg-greige/35"><div className="h-full rounded-full bg-cherry" style={{ width: `${ratio}%` }} /></div>
    </div>
  )
}

const fallbackSourceChecks: ProductionProofCheck[] = [
  { id: 'authorization', title: 'Authentication and authorization', status: 'needs_code_review', summary: 'A passive scan cannot prove that protected operations enforce identity, roles, tenant boundaries, or database policies.' },
  { id: 'payments', title: 'Payment and webhook authorization', status: 'needs_code_review', summary: 'Public files cannot prove that prices, customers, webhook signatures, and payment state are validated on the server.' },
  { id: 'secrets', title: 'Server-side secret handling', status: 'needs_code_review', summary: 'Not observing a secret in sampled browser files does not prove that deployment secrets are stored and used safely.' },
  { id: 'dependencies', title: 'Dependencies and build pipeline', status: 'needs_code_review', summary: 'Public bundles do not provide a reliable dependency inventory or production build-pipeline assessment.' },
]
