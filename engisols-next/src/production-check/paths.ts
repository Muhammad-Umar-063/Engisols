export const productionLandingPath = '/production-check'

export function productionScanPath(publicId: string): string {
  return `${productionLandingPath}?scanId=${encodeURIComponent(publicId)}`
}

export function replaceProductionScanHistory(
  history: Pick<History, 'replaceState'>,
  publicId: string,
): void {
  history.replaceState(null, '', productionScanPath(publicId))
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

export function productionOfferPath(offerId: string): string {
  return `${productionLandingPath}/offer/${encodeURIComponent(offerId)}`
}

export function productionOfferDecisionPath(offerId: string): string {
  return `/api/production-check/offers/${encodeURIComponent(offerId)}/decision`
}

export function productionOperatorAccessPath(scopeReviewId: string, token: string): string {
  return `/internal/production-check/review/${encodeURIComponent(scopeReviewId)}/access?token=${encodeURIComponent(token)}`
}

export function productionRestartPath(currentHref: string): string {
  const currentUrl = new URL(currentHref)
  currentUrl.searchParams.delete('scanId')
  return `${productionLandingPath}${currentUrl.search}${currentUrl.hash}`
}
