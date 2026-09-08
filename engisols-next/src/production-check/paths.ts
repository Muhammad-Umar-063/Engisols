export const productionLandingPath = '/production-check'

export function productionScanPath(publicId: string): string {
  return `${productionLandingPath}?scanId=${encodeURIComponent(publicId)}`
}

export function productionReportPath(publicId: string): string {
  return `${productionLandingPath}/report/${publicId}`
}

export function productionStatusPath(publicId: string): string {
  return `/api/scans/${publicId}/status`
}

export function productionAnswersPath(publicId: string): string {
  return `/api/scans/${publicId}/answers`
}

export const productionReviewRequestPath = '/api/production-check/review'

export function productionRestartPath(currentHref: string): string {
  const currentUrl = new URL(currentHref)
  currentUrl.searchParams.delete('scanId')
  return `${productionLandingPath}${currentUrl.search}${currentUrl.hash}`
}
