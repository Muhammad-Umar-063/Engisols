import { isValidPublicScanId } from '../../../../../src/production-check/report'
import { loadScan } from '../../../../../src/production-check/load'
import { ScanStoreConfigurationError } from '../../../../../src/production-check/store'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(
  _request: Request,
  context: RouteContext<'/api/scans/[scanId]/status'>,
): Promise<Response> {
  const { scanId } = await context.params
  if (!isValidPublicScanId(scanId)) return notFound()
  try {
    const scan = await loadScan(scanId)
    if (!scan) return notFound()
    return Response.json({ ok: true, scan }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    if (error instanceof ScanStoreConfigurationError) {
      return Response.json(
        { ok: false, error: { code: 'persistence_unavailable', message: 'Scan status is temporarily unavailable.' } },
        { status: 503, headers: { 'Cache-Control': 'no-store' } },
      )
    }
    return Response.json(
      { ok: false, error: { code: 'status_unavailable', message: 'Scan status is temporarily unavailable.' } },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    )
  }
}

function notFound(): Response {
  return Response.json(
    { ok: false, error: { code: 'not_found', message: 'This scan could not be found or has expired.' } },
    { status: 404, headers: { 'Cache-Control': 'no-store' } },
  )
}
