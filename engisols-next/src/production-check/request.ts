import { ScannerError } from '../scanner/errors'
import { DEFAULT_SCAN_LIMITS } from '../scanner/limits'
import { verifyAttributionToken } from './attribution-token.server'
import type { ProductionCheckAttribution } from './types'

type AttributionTokenVerifier = (
  token: string,
) => ProductionCheckAttribution | null

export async function readLimitedJson(request: Request): Promise<unknown> {
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
  if (!reader) throw new ScannerError('invalid_request')

  const chunks: Uint8Array[] = []
  let receivedBytes = 0
  const deadlineAt = Date.now() + DEFAULT_SCAN_LIMITS.requestBodyTimeoutMs
  while (true) {
    const { value, done } = await readBeforeDeadline(reader, deadlineAt)
    if (done) break
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
  try {
    return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(body))
  } catch {
    throw new ScannerError('invalid_request')
  }
}

export async function readUrlInput(request: Request): Promise<string> {
  return (await readScanCreationInput(request)).url
}

export async function readScanCreationInput(
  request: Request,
  verifyToken: AttributionTokenVerifier = verifyAttributionToken,
): Promise<{ url: string; attribution: ProductionCheckAttribution }> {
  const parsed = await readLimitedJson(request)
  if (
    !parsed ||
    typeof parsed !== 'object' ||
    Array.isArray(parsed) ||
    Object.keys(parsed).some((key) => key !== 'url' && key !== 'attributionToken') ||
    !('url' in parsed) ||
    typeof parsed.url !== 'string' ||
    parsed.url.length === 0
  ) {
    throw new ScannerError('invalid_request')
  }
  if (!('attributionToken' in parsed)) return { url: parsed.url, attribution: {} }
  if (typeof parsed.attributionToken !== 'string' || !parsed.attributionToken) {
    throw new ScannerError('invalid_request')
  }
  const attribution = verifyToken(parsed.attributionToken)
  if (!attribution) throw new ScannerError('invalid_request')
  return { url: parsed.url, attribution }
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
    if (error instanceof ScannerError) throw error
    throw new ScannerError('invalid_request')
  } finally {
    if (timeout) clearTimeout(timeout)
  }
}

function cancelReader(reader: ReadableStreamDefaultReader<Uint8Array>): void {
  void reader.cancel().catch(() => undefined)
}
