'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

import type { FounderFinding, FounderLabel } from '@/src/production-check/types'
import { trackProductionCheck } from '@/src/production-check/analytics'

import { TrackedDisclosure } from './TrackedDisclosure'

type FindingFilter = 'ALL' | FounderLabel

const filters: FindingFilter[] = ['ALL', 'FIX NOW', 'REVIEW', 'EXPECTED']

export function FindingExplorer({ findings }: { findings: FounderFinding[] }) {
  const [filter, setFilter] = useState<FindingFilter>('ALL')
  const [selectedId, setSelectedId] = useState(findings[0]?.id ?? '')
  const [mobileOpenId, setMobileOpenId] = useState<string | null>(findings[0]?.id ?? null)
  const mobileScrollTarget = useRef<string | null>(null)
  const counts = useMemo(() => countByLabel(findings), [findings])
  const visible = filter === 'ALL' ? findings : findings.filter((finding) => finding.label === filter)
  const selected = visible.find((finding) => finding.id === selectedId) ?? visible[0]

  function chooseFilter(nextFilter: FindingFilter) {
    const nextVisible = nextFilter === 'ALL' ? findings : findings.filter((finding) => finding.label === nextFilter)
    setFilter(nextFilter)
    if (!nextVisible.some((finding) => finding.id === selectedId)) setSelectedId(nextVisible[0]?.id ?? '')
    setMobileOpenId(nextVisible[0]?.id ?? null)
    trackProductionCheck('finding_filter_selected', { filter: nextFilter })
  }

  useEffect(() => {
    const targetId = mobileScrollTarget.current
    if (!targetId || !window.matchMedia('(max-width: 1023px)').matches) return
    mobileScrollTarget.current = null
    const target = document.getElementById(targetId)
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    target?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' })
  }, [selectedId])

  function chooseFinding(finding: FounderFinding, mobile = false) {
    if (mobile) {
      if (mobileOpenId === finding.id) {
        setMobileOpenId(null)
        trackProductionCheck('finding_selected', { findingId: finding.id, label: finding.label, expanded: false })
        return
      }
      mobileScrollTarget.current = `mobile-finding-${finding.id}`
      setMobileOpenId(finding.id)
    }
    setSelectedId(finding.id)
    trackProductionCheck('finding_selected', { findingId: finding.id, label: finding.label, expanded: true })
  }

  if (!selected) return null

  return (
    <div className="mt-step-4 overflow-hidden rounded-2xl border border-greige/70 bg-vanilla">
      <div className="border-b border-greige/60 px-step-2 py-step-2 sm:px-step-3">
        <div className="flex flex-wrap gap-step-1" aria-label="Filter findings">
          {filters.map((item) => {
            const count = item === 'ALL' ? findings.length : counts[item]
            if (item !== 'ALL' && count === 0) return null
            const active = filter === item
            return (
              <button
                key={item}
                type="button"
                aria-pressed={active}
                onClick={() => chooseFilter(item)}
                className={`min-h-11 rounded-full border px-step-2 font-mono text-[0.68rem] tracking-[0.04em] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cherry ${active ? 'border-cherry bg-vanilla text-bordeaux' : 'border-greige/70 text-bordeaux hover:border-bordeaux hover:bg-oat/40'}`}
              >
                {item} <span className="text-bordeaux/55">{count}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="divide-y divide-greige/60 bg-oat/45 lg:hidden" aria-label="Findings">
        {visible.map((finding, index) => {
          const active = finding.id === mobileOpenId
          const detailId = `mobile-finding-detail-${finding.id}`
          return (
            <div id={`mobile-finding-${finding.id}`} key={finding.id} className="scroll-mt-24 bg-oat/45">
              <FindingChoice
                finding={finding}
                index={index}
                active={active}
                controls={detailId}
                onClick={() => chooseFinding(finding, true)}
                mobile
              />
              {active ? <FindingDetail finding={finding} id={detailId} compact /> : null}
            </div>
          )
        })}
      </div>

      <div className="hidden lg:grid lg:grid-cols-[minmax(17rem,.72fr)_minmax(0,1.6fr)]">
        <div className="max-h-[46rem] overflow-y-auto border-r border-greige/60 bg-oat/45 p-step-1" aria-label="Findings">
          {visible.map((finding, index) => {
            const active = finding.id === selected.id
            return (
              <FindingChoice
                key={finding.id}
                finding={finding}
                index={index}
                active={active}
                controls="selected-finding"
                onClick={() => chooseFinding(finding)}
              />
            )
          })}
        </div>
        <FindingDetail key={selected.id} finding={selected} id="selected-finding" />
      </div>
    </div>
  )
}

function FindingChoice({ finding, index, active, controls, onClick, mobile = false }: { finding: FounderFinding; index: number; active: boolean; controls: string; onClick: () => void; mobile?: boolean }) {
  return (
    <button
      type="button"
      aria-expanded={mobile ? active : undefined}
      aria-pressed={mobile ? undefined : active}
      aria-controls={controls}
      onClick={onClick}
      className={`relative w-full border p-step-2 text-left transition-colors focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-cherry ${mobile ? 'min-h-36 border-transparent bg-transparent' : 'rounded-xl'} ${active ? 'border-cherry bg-vanilla' : 'border-transparent hover:border-greige/70 hover:bg-vanilla/65'}`}
    >
      <span className="flex items-center justify-between gap-step-2">
        <FindingLabel label={finding.label} />
        <span className={`font-mono text-[0.65rem] ${active ? 'text-bordeaux' : 'text-bordeaux/50'}`}>{String(index + 1).padStart(2, '0')}</span>
      </span>
      <span className="mt-step-1 block pr-step-2 text-base font-medium leading-snug text-bordeaux">{finding.title}</span>
      <span className="mt-step-1 flex items-center justify-between gap-step-2 font-mono text-[0.62rem] text-bordeaux/55">
        {finding.label === 'EXPECTED' ? 'NORMAL PUBLIC CONFIG' : `${finding.riskPoints} RISK POINTS`}
        <ArrowIcon active={active} mobile={mobile} />
      </span>
    </button>
  )
}

function FindingDetail({ finding, id, compact = false }: { finding: FounderFinding; id: string; compact?: boolean }) {
  return (
    <article id={id} key={finding.id} className={`lp-in min-w-0 bg-vanilla ${compact ? 'border-t border-greige/60 px-step-2 pb-step-4 pt-step-3' : 'p-step-4'}`} aria-live="polite" aria-label={`Details for ${finding.title}`}>
      <div className="flex flex-wrap items-center gap-step-2">
        <FindingLabel label={finding.label} />
        <span className="production-check-wrap font-mono text-[0.65rem] text-bordeaux/55">RULE {finding.ruleId}</span>
      </div>
      <h3 className={`mt-step-2 max-w-[30ch] leading-[1.04] ${compact ? 'text-[clamp(1.65rem,8vw,2.35rem)]' : 'text-[clamp(1.8rem,3.5vw,3rem)]'}`}>{finding.title}</h3>

      <div className="mt-step-3 border-y border-greige/60 bg-oat/45 p-step-3">
        <div className="flex items-center gap-step-1">
          <span aria-hidden className="h-1 w-step-3 rounded-full bg-cherry" />
          <p className="font-mono text-[0.68rem] tracking-[0.06em] text-bordeaux/60">WHAT THE SCAN OBSERVED</p>
        </div>
        <p className="measure mt-step-2 text-base leading-relaxed text-bordeaux/90 sm:text-lg">{finding.whatWeFound}</p>
      </div>

      <div className="mt-step-3 grid gap-step-3 md:grid-cols-2">
        {finding.whyItMatters.trim() !== finding.whatWeFound.trim() ? <Explanation title={finding.label === 'EXPECTED' ? 'Why this is expected' : 'Why this matters'} body={finding.whyItMatters} /> : null}
        {finding.whatWeCannotVerify ? <Explanation title="What remains unproven" body={finding.whatWeCannotVerify} /> : null}
      </div>

      <div className="mt-step-3 rounded-xl border border-cherry/35 bg-vanilla p-step-3">
        <p className="font-mono text-[0.68rem] tracking-[0.06em] text-bordeaux/60">{finding.label === 'EXPECTED' ? 'SAFE HANDLING' : 'RECOMMENDED NEXT MOVE'}</p>
        <p className="measure mt-step-2 text-lg font-medium leading-relaxed text-bordeaux">{finding.recommendedAction}</p>
      </div>

      <div className="mt-step-3">
        <TrackedDisclosure findingId={finding.id}>
          <dl className="production-check-wrap grid gap-step-2 py-step-2 font-mono text-xs sm:grid-cols-2">
            <TechnicalDatum label="CATEGORY" value={finding.technical.category} />
            <TechnicalDatum label="SOURCE" value={finding.technical.sourceKind} />
            <TechnicalDatum label="LOCATION" value={finding.technical.location} />
            <TechnicalDatum label="SANITIZED EVIDENCE" value={finding.technical.evidence} />
          </dl>
        </TrackedDisclosure>
      </div>
    </article>
  )
}

function countByLabel(findings: FounderFinding[]): Record<FounderLabel, number> {
  return findings.reduce<Record<FounderLabel, number>>((counts, finding) => {
    counts[finding.label] += 1
    return counts
  }, { 'FIX NOW': 0, REVIEW: 0, EXPECTED: 0 })
}

function FindingLabel({ label }: { label: FounderLabel }) {
  const style = label === 'FIX NOW'
    ? 'bg-cherry text-vanilla'
    : label === 'REVIEW'
      ? 'border border-bordeaux/30 bg-vanilla text-bordeaux'
      : 'border border-greige/70 text-bordeaux/65'
  return <span className={`rounded-full px-step-2 py-1 font-mono text-[0.62rem] font-medium tracking-[0.06em] ${style}`}>{label}</span>
}

function Explanation({ title, body }: { title: string; body: string }) {
  return <div><p className="font-mono text-[0.68rem] tracking-[0.06em] text-bordeaux/60">{title.toUpperCase()}</p><p className="measure mt-step-1 leading-relaxed text-bordeaux/85">{body}</p></div>
}

function TechnicalDatum({ label, value }: { label: string; value: string }) {
  return <div className="min-w-0 border-t border-greige/50 pt-step-1"><dt className="text-bordeaux/50">{label}</dt><dd className="mt-1 break-words text-bordeaux/85">{value}</dd></div>
}

function ArrowIcon({ active, mobile = false }: { active: boolean; mobile?: boolean }) {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className={`h-4 w-4 transition-transform motion-reduce:transition-none ${mobile && active ? 'rotate-180 text-cherry' : active ? 'translate-x-0 text-cherry' : mobile ? 'text-bordeaux/40' : '-translate-x-1 text-bordeaux/40'}`} fill="none">
      {mobile ? <path d="m4 6 4 4 4-4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" /> : <path d="M3 8h9M8.5 4.5 12 8l-3.5 3.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />}
    </svg>
  )
}
