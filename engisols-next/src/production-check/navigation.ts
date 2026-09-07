import type { PersistedScan } from './types'
import { productionReportPath } from './paths'

export function destinationForScan(scan: Pick<PersistedScan, 'publicId' | 'status'>): string | null {
  return scan.status === 'completed' || scan.status === 'partial'
    ? productionReportPath(scan.publicId)
    : null
}
