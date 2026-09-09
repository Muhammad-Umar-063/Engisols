import { after } from 'next/server'

import { readUrlInput } from '../../../src/production-check/request'
import { createScanRecord, runScanRecord, type ScanFunction } from '../../../src/production-check/service'
import { getScanStore, ScanStoreConfigurationError } from '../../../src/production-check/store'
import type { ScanStore } from '../../../src/production-check/types'
import { DEFAULT_SCAN_LIMITS, ScannerError, toPublicScanError } from '../../../src/scanner'

export const runtime = 'nodejs'
export const maxDuration = 20

interface HandlerDependencies {
  store?: ScanStore
  schedule?: (task: () => Promise<void>) => void
  scan?: ScanFunction
}

export function createScansPostHandler({
  store,
  schedule = (task) => after(task),
  scan,
}: HandlerDependencies = {}) {
  let activeScans = 0
  return async function POST(request: Request): Promise<Response> {
    let slotReserved = false
    let handedOff = false
    try {
      if (activeScans >= DEFAULT_SCAN_LIMITS.maxConcurrentScans) {
        throw new ScannerError('scan_capacity_reached')
      }
      activeScans += 1
      slotReserved = true
      const target = await readUrlInput(request)
      const activeStore = store ?? getScanStore()
      const record = await createScanRecord(target, activeStore)
      schedule(async () => {
        try {
          await runScanRecord(record.publicId, target, activeStore, scan)
        } finally {
          activeScans -= 1
        }
      })
      handedOff = true
      return Response.json(
        {
          ok: true,
          scanId: record.publicId,
        },
        { status: 202, headers: { 'Cache-Control': 'no-store' } },
      )
    } catch (error) {
      if (slotReserved && !handedOff) activeScans -= 1
      if (error instanceof ScanStoreConfigurationError) {
        return Response.json(
          { ok: false, error: { code: 'persistence_unavailable', message: 'Scans are temporarily unavailable. Please try again shortly.' } },
          { status: 503, headers: { 'Cache-Control': 'no-store' } },
        )
      }
      const body = toPublicScanError(error)
      return Response.json(body, {
        status:
          body.error.code === 'invalid_request' || body.error.code === 'target_blocked'
            ? 400
            : body.error.code === 'scan_capacity_reached'
              ? 503
              : 422,
        headers: { 'Cache-Control': 'no-store' },
      })
    }
  }
}

export const POST = createScansPostHandler()
