import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { ProductionCheckExperience } from '@/components/production-check/ProductionCheckExperience'
import { ProductionCheckFooter } from '@/components/production-check/ProductionCheckFooter'
import { attributionFromSearchParams } from '@/src/production-check/attribution'
import { signAttributionToken } from '@/src/production-check/attribution-token.server'
import { loadScan } from '@/src/production-check/load'
import {
  buildFounderReport,
  isValidPublicScanId,
  redactPersistedScanForPublic,
} from '@/src/production-check/report'
import type { FounderReport, PersistedScan } from '@/src/production-check/types'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Production readiness check',
  description: 'A passive public-surface review for AI-built web applications. No GitHub access required.',
  alternates: { canonical: '/production-check' },
}

export default async function ProductionCheckPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const resolvedSearchParams = await searchParams
  const requestedScanId = resolvedSearchParams.scanId
  const initialAttribution = attributionFromSearchParams({
    get: (key) => {
      const value = resolvedSearchParams[key]
      return typeof value === 'string' ? value : null
    },
  })
  const initialAttributionToken = signAttributionToken(initialAttribution)
  let initialScan: PersistedScan | undefined
  let initialReport: FounderReport | undefined
  if (requestedScanId !== undefined) {
    if (typeof requestedScanId !== 'string' || !isValidPublicScanId(requestedScanId)) notFound()
    const scan = await loadScan(requestedScanId)
    if (!scan) notFound()
    initialScan = redactPersistedScanForPublic(scan)
    if (scan.status === 'completed' || scan.status === 'partial') {
      if (!scan.result) notFound()
      initialReport = buildFounderReport(scan.result, scan.answers.builder)
    }
  }

  return (
    <>
      <ProductionCheckExperience
        initialScan={initialScan}
        initialReport={initialReport}
        initialAttributionToken={initialAttributionToken}
      />
      <ProductionCheckFooter />
    </>
  )
}
