import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'

import { ReportView } from '@/components/production-check/ReportView'
import { loadScan } from '@/src/production-check/load'
import { productionScanPath } from '@/src/production-check/paths'
import { buildFounderReport, isValidPublicScanId } from '@/src/production-check/report'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Production readiness report',
}

export default async function ProductionReportPage({ params }: PageProps<'/production-check/report/[scanId]'>) {
  const { scanId } = await params
  if (!isValidPublicScanId(scanId)) notFound()
  const scan = await loadScan(scanId)
  if (!scan) notFound()
  if (scan.status === 'queued' || scan.status === 'running' || scan.status === 'failed') {
    redirect(productionScanPath(scanId))
  }
  if (!scan.result) notFound()
  return <ReportView scan={scan} report={buildFounderReport(scan.result, scan.answers.builder)} />
}
