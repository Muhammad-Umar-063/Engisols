import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'

import { LiveScan } from '@/components/production-check/LiveScan'
import { ProductionCheckFrame } from '@/components/production-check/ProductionCheckFrame'
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
      <ProductionCheckFrame
        eyebrow="ENGISOLS / LIVE CHECK"
        title="Inspecting your public application"
        lead="Progress below comes directly from Scanner v1.1. Optional context does not delay the scan."
      >
        <LiveScan initial={scan} />
      </ProductionCheckFrame>
    )
  }

  return (
    <ProductionCheckFrame
      eyebrow="PRODUCTION READINESS CHECK"
      title={<>See what your public app reveals—and what it doesn&apos;t.</>}
      lead="We inspect the public HTML, browser bundles, security headers, and architecture signals. Expected frontend configuration stays expected; uncertain controls are marked for review."
    >
      <StartScanForm />
      <div className="mt-step-5 grid max-w-4xl gap-step-3 border-t border-bordeaux/20 pt-step-4 sm:grid-cols-3">
        {[
          ['EXPECTED', 'Public client configuration that is normal by design.'],
          ['REVIEW', 'A signal that needs source-code or policy verification.'],
          ['FIX NOW', 'High-confidence privileged material exposed publicly.'],
        ].map(([label, copy]) => (
          <div key={label}>
            <p className="font-mono text-xs text-current/60">{label}</p>
            <p className="mt-step-1 text-sm text-current/75">{copy}</p>
          </div>
        ))}
      </div>
    </ProductionCheckFrame>
  )
}
