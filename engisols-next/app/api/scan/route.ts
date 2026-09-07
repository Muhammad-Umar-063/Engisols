import {
  DEFAULT_SCAN_LIMITS,
  ScannerError,
  scanPublicUrl,
  toPublicScanError,
  type ScanResult,
} from '../../../src/scanner'

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

async function readUrlInput(request: Request): Promise<string> {
  const contentType = request.headers.get('content-type')?.toLowerCase()
  if (!contentType?.startsWith('application/json')) {
    throw new ScannerError('invalid_request')
  }

  const declaredLength = Number(request.headers.get('content-length'))
  if (
    Number.isFinite(declaredLength) &&
    declaredLength > DEFAULT_SCAN_LIMITS.maxRequestBodyBytes
  ) {
    throw new ScannerError('invalid_request')
  }

  const reader = request.body?.getReader()
  if (!reader) {
    throw new ScannerError('invalid_request')
  }
  const chunks: Uint8Array[] = []
  let receivedBytes = 0
  const bodyDeadlineAt = Date.now() + DEFAULT_SCAN_LIMITS.requestBodyTimeoutMs
  while (true) {
    const { value, done } = await readBeforeDeadline(reader, bodyDeadlineAt)
    if (done) {
      break
    }
    receivedBytes += value.byteLength
    if (receivedBytes > DEFAULT_SCAN_LIMITS.maxRequestBodyBytes) {
      cancelReader(reader)
      throw new ScannerError('invalid_request')
    }
    chunks.push(value)
  }

  const body = new Uint8Array(receivedBytes)
  let offset = 0
  for (const chunk of chunks) {
    body.set(chunk, offset)
    offset += chunk.byteLength
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(body))
  } catch {
    throw new ScannerError('invalid_request')
  }

  if (
    !parsed ||
    typeof parsed !== 'object' ||
    Array.isArray(parsed) ||
    Object.keys(parsed).length !== 1 ||
    !('url' in parsed) ||
    typeof parsed.url !== 'string' ||
    parsed.url.length === 0
  ) {
    throw new ScannerError('invalid_request')
  }

  return parsed.url
}

async function readBeforeDeadline(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  deadlineAt: number,
): Promise<ReadableStreamReadResult<Uint8Array>> {
  const remainingMs = deadlineAt - Date.now()
  if (remainingMs <= 0) {
    cancelReader(reader)
    throw new ScannerError('invalid_request')
  }

  let timeout: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([
      reader.read(),
      new Promise<never>((_resolve, reject) => {
        timeout = setTimeout(() => {
          cancelReader(reader)
          reject(new ScannerError('invalid_request'))
        }, remainingMs)
      }),
    ])
  } catch (error) {
    if (error instanceof ScannerError) {
      throw error
    }
    throw new ScannerError('invalid_request')
  } finally {
    if (timeout) {
      clearTimeout(timeout)
    }
  }
}

function cancelReader(reader: ReadableStreamDefaultReader<Uint8Array>): void {
  void reader.cancel().catch(() => undefined)
}

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
