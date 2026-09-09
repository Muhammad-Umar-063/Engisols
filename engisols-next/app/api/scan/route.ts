import {
  DEFAULT_SCAN_LIMITS,
  ScannerError,
  scanPublicUrl,
  toPublicScanError,
  type ScanResult,
} from '../../../src/scanner'
import { readUrlInput } from '../../../src/production-check/request'

export const runtime = 'nodejs'
export const maxDuration = 15

type ScanFunction = (url: string) => Promise<ScanResult>

const statusByCode = {
  invalid_request: 400,
  target_blocked: 400,
  target_unavailable: 422,
  scan_capacity_reached: 503,
} as const

export function createScanPostHandler(
  scan: ScanFunction = scanPublicUrl,
): (request: Request) => Promise<Response> {
  let activeScans = 0

  return async function POST(request: Request): Promise<Response> {
    if (activeScans >= DEFAULT_SCAN_LIMITS.maxConcurrentScans) {
      return errorResponse(new ScannerError('scan_capacity_reached'))
    }

    activeScans += 1
    try {
      const url = await readUrlInput(request)
      const result = await scan(url)
      return jsonResponse({ ok: true, result }, 200)
    } catch (error) {
      return errorResponse(error)
    } finally {
      activeScans -= 1
    }
  }
}

export const POST = createScanPostHandler()

function errorResponse(error: unknown): Response {
  const body = toPublicScanError(error)
  return jsonResponse(body, statusByCode[body.error.code])
}

function jsonResponse(body: unknown, status: number): Response {
  return Response.json(body, {
    status,
    headers: {
      'Cache-Control': 'no-store',
    },
  })
}
