import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import type { CSSProperties } from 'react'

import { Eyebrow, TickItem } from '@/components/campaign/ui'
import { HeroHeadline } from '@/components/sections/HeroHeadline'
import { LiveScan } from '@/components/production-check/LiveScan'
import { ProductionCheckFooter } from '@/components/production-check/ProductionCheckFooter'
import { ProductionCheckHeader } from '@/components/production-check/ProductionCheckHeader'
import { ProductionCheckLanding } from '@/components/production-check/ProductionCheckLanding'
import { StartScanForm } from '@/components/production-check/StartScanForm'
import { loadScan } from '@/src/production-check/load'
import { destinationForScan } from '@/src/production-check/navigation'
import { isValidPublicScanId } from '@/src/production-check/report'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Production readiness check',
  description: 'A passive public-surface review for AI-built web applications. No GitHub access required.',
  alternates: { canonical: '/production-check' },
}

export default async function ProductionCheckPage({
  searchParams,
}: {
  searchParams: Promise<{ scanId?: string | string[] }>
}) {
  const requestedScanId = (await searchParams).scanId
  if (requestedScanId !== undefined) {
    if (typeof requestedScanId !== 'string' || !isValidPublicScanId(requestedScanId)) notFound()
    const scan = await loadScan(requestedScanId)
    if (!scan) notFound()
    const destination = destinationForScan(scan)
    if (destination) redirect(destination)
    return (
      <>
        <ProductionCheckHeader />
        <section id="tool" data-ground="light" className="bg-vanilla text-bordeaux">
          <div className="shell pb-step-6 pt-[calc(var(--spacing-step-5)+4rem)]">
            <Eyebrow>LIVE PRODUCTION CHECK</Eyebrow>
            <h1 className="mt-step-2 hidden max-w-[22ch] text-[clamp(2rem,4vw,3.5rem)] sm:block">
              {scan.status === 'failed' ? 'This production check could not finish.' : 'Your production check is running.'}
            </h1>
            <p className="measure mt-step-2 hidden text-bordeaux/80 sm:block">
              {scan.status === 'failed'
                ? 'No production conclusions were drawn from an incomplete check.'
                : 'Real Scanner v1.1 progress. No simulated timer and no repository access.'}
            </p>
            <div className="mt-step-3 sm:mt-step-4">
              <LiveScan initial={scan} />
            </div>
          </div>
        </section>
        <ProductionCheckFooter />
      </>
    )
  }

  return (
    <>
      <ProductionCheckHeader />
      <section id="tool" data-ground="light" className="bg-vanilla text-bordeaux">
        <div className="shell grid gap-x-step-5 gap-y-step-4 pb-step-6 pt-[calc(var(--spacing-step-5)+4rem)] lg:grid-cols-[minmax(0,1fr)_minmax(26rem,31rem)] lg:pt-[calc(var(--spacing-step-6)+4rem)]">
          <div className="lg:col-start-1 lg:row-start-1">
            <div className="lp-in" style={{ '--i': 0 } as CSSProperties}>
              <Eyebrow>VIBE CHECK FOR AI-BUILT APPS</Eyebrow>
            </div>
            <HeroHeadline
              text="YOUR AI APP WORKS. IS IT READY FOR REAL USERS?"
              className="mt-step-3 max-w-[15ch] text-[clamp(2.5rem,5.2vw,4.9rem)]"
            />
          </div>

          <div className="lp-in lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-center" style={{ '--i': 2 } as CSSProperties}>
            <StartScanForm />
          </div>

          <div className="lg:col-start-1 lg:row-start-2">
            <p className="lp-in measure text-lg font-medium" style={{ '--i': 4 } as CSSProperties}>
              Built with Lovable, Bolt, Cursor, v0, Replit, Claude, or another AI coding tool?
            </p>
            <p className="lp-in measure mt-step-2 text-bordeaux/80" style={{ '--i': 5 } as CSSProperties}>
              Paste your live URL for a classified production-readiness check of the public-facing parts of your application.
            </p>
            <ul className="mt-step-4 grid gap-step-1 sm:grid-cols-2">
              {['Real browser-bundle analysis', 'Normal public configuration stays EXPECTED', 'No GitHub or login', 'No penetration testing'].map((item, index) => (
                <TickItem key={item} className="lp-in text-sm text-bordeaux/85" style={{ '--i': 6 + index } as CSSProperties}>
                  {item}
                </TickItem>
              ))}
            </ul>
          </div>
        </div>
      </section>
      <ProductionCheckLanding />
      <ProductionCheckFooter />
    </>
  )
}
