export function productionScanPath(publicId: string): string {
  return `/production-check?scanId=${encodeURIComponent(publicId)}`
}

export function productionReportPath(publicId: string): string {
  return `/production-check/report/${publicId}`
}

export function productionStatusPath(publicId: string): string {
  return `/api/scans/${publicId}/status`
}

export function productionAnswersPath(publicId: string): string {
  return `/api/scans/${publicId}/answers`
}
