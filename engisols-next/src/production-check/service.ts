import { ScannerError, scanPublicUrl, toPublicScanError } from '../scanner'
import type { ScanDependencies } from '../scanner/scan'
import type { ScanProgressEvent, ScanResult } from '../scanner/types'
import { SCAN_RECORD_LIFETIME_MS } from './config'
import { createPublicScanId, sanitizeResultForPersistence } from './report'
import { containsCredentialLikeValue } from './security'
import type {
  PersistedScan,
  ScanProgressSnapshot,
  ScanStore,
} from './types'

export type ScanFunction = (
  url: string,
  dependencies?: ScanDependencies,
) => Promise<ScanResult>

const MAX_RECENT_EVENTS = 5

export async function createScanRecord(
  input: string,
  store: ScanStore,
  now: () => Date = () => new Date(),
): Promise<PersistedScan> {
  const requestedUrl = displayUrl(input)
  const createdAt = now()
  const scan: PersistedScan = {
    publicId: createPublicScanId(),
    status: 'queued',
    requestedUrl,
    progress: {
      phase: 'validating',
      progress: 0,
      message: 'Waiting to validate the public URL',
      events: [],
    },
    answers: {},
    createdAt: createdAt.toISOString(),
    expiresAt: new Date(createdAt.getTime() + SCAN_RECORD_LIFETIME_MS).toISOString(),
  }
  await store.create(scan)
  return scan
}

export async function runScanRecord(
  publicId: string,
  input: string,
  store: ScanStore,
  scan: ScanFunction = scanPublicUrl,
): Promise<void> {
  await store.updateStatus(publicId, 'running')
  let snapshot: ScanProgressSnapshot = {
    phase: 'validating',
    progress: 0,
    message: 'Validating the public URL',
    events: [],
  }
  let pendingProgress: ScanProgressSnapshot | undefined
  let progressFlush: Promise<void> | undefined

  const startProgressFlush = (): void => {
    if (progressFlush) return
    progressFlush = (async () => {
      while (pendingProgress) {
        const next = pendingProgress
        pendingProgress = undefined
        await store.updateProgress(publicId, next).catch(() => undefined)
      }
    })().finally(() => {
      progressFlush = undefined
      if (pendingProgress) startProgressFlush()
    })
  }

  const flushProgress = async (): Promise<void> => {
    while (pendingProgress || progressFlush) {
      if (!progressFlush) startProgressFlush()
      await progressFlush
    }
  }

  const onProgress = (event: ScanProgressEvent): void => {
    const safeEvent = sanitizeProgressEvent(event)
    snapshot = {
      phase: safeEvent.phase ?? snapshot.phase,
      progress: safeEvent.progress ?? snapshot.progress,
      message: safeEvent.message,
      events: [...snapshot.events, safeEvent].slice(-MAX_RECENT_EVENTS),
    }
    pendingProgress = structuredClone(snapshot)
    startProgressFlush()
  }

  try {
    const result = await scan(input, { onProgress })
    await flushProgress()
    await store.complete(publicId, sanitizeResultForPersistence(result))
  } catch (error) {
    await flushProgress()
    const publicError = toPublicScanError(error)
    const failureMessage =
      publicError.error.code === 'target_blocked'
        ? 'This address cannot be scanned. Enter a public HTTP or HTTPS website.'
        : publicError.error.code === 'target_unavailable'
          ? "We couldn't reach this app. It may be unavailable, private, or blocking automated requests."
          : 'The scan could not be completed. Try again or enter another public URL.'
    await store.updateProgress(publicId, {
      ...snapshot,
      message: failureMessage,
      events: [
        ...snapshot.events,
        {
          type: 'error' as const,
          phase: snapshot.phase,
          progress: snapshot.progress,
          message: failureMessage,
          timestamp: new Date().toISOString(),
        },
      ].slice(-MAX_RECENT_EVENTS),
    })
    await store.fail(publicId, {
      code:
        publicError.error.code === 'target_blocked'
          ? 'target_blocked'
          : publicError.error.code === 'target_unavailable'
            ? 'target_unavailable'
            : 'scan_failed',
      message: failureMessage,
    })
  }
}

function displayUrl(input: string): string {
  let url: URL
  try {
    url = new URL(input)
  } catch {
    throw new ScannerError('invalid_request')
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new ScannerError('invalid_request')
  }
  url.username = ''
  url.password = ''
  url.search = ''
  url.hash = ''
  return url.href
}

function sanitizeProgressEvent(event: ScanProgressEvent): ScanProgressEvent {
  if (containsCredentialLikeValue(event)) {
    return {
      type: event.type,
      ...(event.phase ? { phase: event.phase } : {}),
      ...(event.progress !== undefined ? { progress: event.progress } : {}),
      message: 'A sensitive server-side credential pattern needs attention.',
      timestamp: event.timestamp,
      ...(event.metadata?.processed !== undefined || event.metadata?.total !== undefined
        ? {
            metadata: {
              ...(event.metadata.processed !== undefined
                ? { processed: event.metadata.processed }
                : {}),
              ...(event.metadata.total !== undefined ? { total: event.metadata.total } : {}),
            },
          }
        : {}),
    }
  }
  return structuredClone(event)
}
