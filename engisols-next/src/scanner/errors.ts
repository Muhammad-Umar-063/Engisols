import type { PublicScanError, PublicScanErrorCode } from './types'

const PUBLIC_MESSAGES: Record<PublicScanErrorCode, string> = {
  invalid_request: 'Provide one valid public HTTP or HTTPS URL.',
  target_blocked: 'That destination cannot be scanned.',
  target_unavailable: 'The public page could not be scanned.',
  scan_capacity_reached: 'The scanner is busy. Please try again shortly.',
}

export class ScannerError extends Error {
  readonly code: PublicScanErrorCode

  constructor(code: PublicScanErrorCode, internalMessage?: string) {
    super(internalMessage ?? code)
    this.name = 'ScannerError'
    this.code = code
  }
}

export function toPublicScanError(error: unknown): PublicScanError {
  const code =
    error instanceof ScannerError ? error.code : 'target_unavailable'

  return {
    ok: false,
    error: {
      schemaVersion: 'scanner-v1',
      code,
      message: PUBLIC_MESSAGES[code],
    },
  }
}
