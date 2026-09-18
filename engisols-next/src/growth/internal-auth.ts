import { timingSafeEqual } from 'node:crypto'

export type CredentialVersion = 'current' | 'previous'

export interface RotatingCredential {
  readonly current?: string | undefined
  readonly previous?: string | undefined
}

export function authorizeRotatingBearer(
  request: Request,
  credential: RotatingCredential,
): CredentialVersion | null {
  const header = request.headers.get('authorization')
  if (!header?.startsWith('Bearer ')) return null
  const supplied = header.slice('Bearer '.length)
  if (!supplied || supplied.includes(' ')) return null
  if (credential.current && constantTimeTextEqual(supplied, credential.current)) return 'current'
  if (credential.previous && constantTimeTextEqual(supplied, credential.previous)) return 'previous'
  return null
}

export function assertRotatingCredential(credential: RotatingCredential, label: string): void {
  if (!credential.current || Buffer.byteLength(credential.current, 'utf8') < 32) {
    throw new Error(`${label} current credential must contain at least 32 bytes`)
  }
  if (credential.previous && Buffer.byteLength(credential.previous, 'utf8') < 32) {
    throw new Error(`${label} previous credential must contain at least 32 bytes`)
  }
  if (credential.previous && constantTimeTextEqual(credential.current, credential.previous)) {
    throw new Error(`${label} current and previous credentials must differ`)
  }
}

function constantTimeTextEqual(left: string, right: string): boolean {
  const leftBytes = Buffer.from(left, 'utf8')
  const rightBytes = Buffer.from(right, 'utf8')
  if (leftBytes.length !== rightBytes.length) return false
  return timingSafeEqual(leftBytes, rightBytes)
}
