'use client'

import { useCallback, useState, type CSSProperties } from 'react'

import { Eyebrow, TickItem } from '@/components/campaign/ui'
import { LiveScan } from '@/components/production-check/LiveScan'
import { ProductionCheckLanding } from '@/components/production-check/ProductionCheckLanding'
import { ProductionCheckHeader } from '@/components/production-check/ProductionCheckHeader'
import { ReportContent } from '@/components/production-check/ReportView'
import { StartScanForm } from '@/components/production-check/StartScanForm'
import { HeroHeadline } from '@/components/sections/HeroHeadline'
import { productionRestartPath, productionStatusPath } from '@/src/production-check/paths'
import type { FounderReport, PersistedScan } from '@/src/production-check/types'

export function ProductionCheckExperience({
  initialScan,
  initialReport,
}: {
  initialScan?: PersistedScan
  initialReport?: FounderReport
}) {
  const [scan, setScan] = useState(initialScan)
  const [report, setReport] = useState(initialReport)

  const completeScan = useCallback((completedScan: PersistedScan, completedReport: FounderReport) => {
    setScan(completedScan)
    setReport(completedReport)
  }, [])

  async function startScan(scanId: string) {
    const response = await fetch(productionStatusPath(scanId), { cache: 'no-store' })
    const body = (await response.json()) as { ok: boolean; scan?: PersistedScan; report?: FounderReport; error?: { message?: string } }
    if (!response.ok || !body.ok || !body.scan) {
      throw new Error(body.error?.message || 'The scan started, but its live status could not be loaded.')
    }
    setScan(body.scan)
    setReport(body.report)
    if (!window.matchMedia('(min-width: 64rem)').matches) {
      requestAnimationFrame(() => {
        document.getElementById('tool')?.scrollIntoView({ block: 'start' })
      })
    }
  }

  function restart() {
    setScan(undefined)
    setReport(undefined)
    if (new URL(window.location.href).searchParams.has('scanId')) {
      window.history.replaceState(null, '', productionRestartPath(window.location.href))
    }
  }

  return (
    <>
      <ProductionCheckHeader variant={scan && report ? 'result' : 'landing'} />
      <section id="tool" data-ground="dark" className="production-check-hero text-vanilla on-dark">
        <div className="shell grid gap-x-step-5 gap-y-step-4 pb-step-6 pt-[calc(var(--spacing-step-5)+4rem)] lg:grid-cols-[minmax(0,1fr)_minmax(26rem,31rem)] lg:pt-[calc(var(--spacing-step-6)+4rem)]">
          <div className={`${scan ? 'hidden lg:block' : ''} lg:col-start-1 lg:row-start-1`}>
            <div className="lp-in" style={{ '--i': 0 } as CSSProperties}>
              <div className="[&>p]:bg-vanilla/12 [&>p]:text-vanilla">
                <Eyebrow>PRODUCTION CHECK FOR AI-BUILT APPS</Eyebrow>
              </div>
            </div>
            <HeroHeadline
              text="YOUR AI APP WORKS. IS IT READY FOR REAL USERS?"
              className="mt-step-3 max-w-[15ch] text-[clamp(2.5rem,5.2vw,4.9rem)]"
            />
          </div>

          <div className="min-w-0 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-center">
            {scan ? (
              <LiveScan key={scan.publicId} initial={scan} initialReport={report} onComplete={completeScan} onRestart={restart} />
            ) : (
              <div className="lp-in" style={{ '--i': 2 } as CSSProperties}>
                <StartScanForm onStarted={startScan} />
              </div>
            )}
          </div>

          <div className="lg:col-start-1 lg:row-start-2">
            <p className="lp-in measure text-lg font-medium text-vanilla" style={{ '--i': 4 } as CSSProperties}>
              Built with Lovable, Bolt, Cursor, v0, Replit, Claude, or another AI coding tool?
            </p>
            <p className="lp-in measure mt-step-2 text-vanilla/80" style={{ '--i': 5 } as CSSProperties}>
              Paste the live URL. We&apos;ll show what is visible, what looks normal, and what still needs code review.
            </p>
            <ul className="mt-step-4 grid gap-step-1 sm:grid-cols-2">
              {['Public pages and browser code checked', 'Public client keys treated as expected', 'No login or code access', 'No penetration testing'].map((item, index) => (
                <TickItem key={item} className="lp-in text-sm text-vanilla/85" style={{ '--i': 6 + index } as CSSProperties}>
                  {item}
                </TickItem>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {scan && report
        ? <ReportContent scan={scan} report={report} showSummary={false} />
        : <ProductionCheckLanding />}
    </>
  )
}
