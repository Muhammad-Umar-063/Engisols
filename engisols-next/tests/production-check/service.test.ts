import assert from 'node:assert/strict'
import test from 'node:test'

import { MemoryScanStore } from '../../src/production-check/store'
import { createScanRecord, runScanRecord } from '../../src/production-check/service'
import { SCAN_RECORD_LIFETIME_MS } from '../../src/production-check/config'
import type { ScanDependencies } from '../../src/scanner/scan'
import type { ScanResult } from '../../src/scanner/types'
import { scanResult } from './fixtures'

test('runs once, persists real progress, and completes with a sanitized report', async () => {
  const store = new MemoryScanStore()
  const created = await createScanRecord('https://app.example/path?token=private', store)
  let calls = 0
  const result = scanResult()
  const scan = async (
    _url: string,
    dependencies: ScanDependencies = {},
  ): Promise<ScanResult> => {
    calls += 1
    dependencies.onProgress?.({
      type: 'phase',
      phase: 'fetching',
      progress: 10,
      message: 'Reaching the public application',
      timestamp: new Date().toISOString(),
    })
    return result
  }

  await runScanRecord(created.publicId, 'https://app.example/path?token=private', store, scan)

  const stored = await store.get(created.publicId)
  assert.equal(calls, 1)
  assert.equal(stored?.status, 'completed')
  assert.equal(stored?.requestedUrl, 'https://app.example/path')
  assert.equal(stored?.progress.progress, 10)
  assert.deepEqual(stored?.result, result)
})

test('creates scan records with a 90-day expiry and persisted attribution', async () => {
  const now = new Date('2026-09-09T10:00:00.000Z')
  const store = new MemoryScanStore(() => now)
  const created = await createScanRecord(
    'https://app.example/',
    store,
    () => now,
    { source: 'meta', campaign: 'founder-launch' },
  )
  assert.equal(SCAN_RECORD_LIFETIME_MS, 90 * 24 * 60 * 60 * 1_000)
  assert.equal(created.expiresAt, '2026-12-08T10:00:00.000Z')
  assert.deepEqual((await store.get(created.publicId))?.attribution, {
    source: 'meta', campaign: 'founder-launch',
  })
})

test('rejects credential-like attribution before scan persistence', async () => {
  const store = new MemoryScanStore()
  await assert.rejects(
    createScanRecord(
      'https://app.example/',
      store,
      () => new Date('2026-09-09T10:00:00.000Z'),
      { campaign: 'DEPLOY_TOKEN=A7mQ2vL9xR4pT8kN3dW6sZ1c' },
    ),
    /invalid_request/,
  )
})

test('turns scanner failures into founder-safe persisted errors', async () => {
  const store = new MemoryScanStore()
  const created = await createScanRecord('https://app.example/', store)
  await runScanRecord(created.publicId, 'https://app.example/', store, async () => {
    throw new Error(`connect ECONNREFUSED 10.0.0.4 with token ${'X'.repeat(40)}`)
  })
  const stored = await store.get(created.publicId)
  assert.equal(stored?.status, 'failed')
  assert.equal(stored?.error?.code, 'target_unavailable')
  assert.doesNotMatch(stored?.error?.message ?? '', /ECONNREFUSED|10\.0\.0\.4|XXXX/)
})

test('coalesces rapid progress events while preserving the latest snapshot', async () => {
  class DelayedStore extends MemoryScanStore {
    progressWrites = 0

    override async updateProgress(
      publicId: string,
      progress: Parameters<MemoryScanStore['updateProgress']>[1],
    ): Promise<void> {
      this.progressWrites += 1
      await new Promise((resolve) => setTimeout(resolve, 5))
      await super.updateProgress(publicId, progress)
    }
  }

  const store = new DelayedStore()
  const created = await createScanRecord('https://app.example/', store)
  await runScanRecord(created.publicId, 'https://app.example/', store, async (_url, dependencies) => {
    for (let progress = 1; progress <= 50; progress += 1) {
      dependencies?.onProgress?.({
        type: 'observation',
        phase: 'analyzing_assets',
        progress,
        message: `Bundle ${progress} inspected`,
        timestamp: `2026-09-07T10:00:${String(progress).padStart(2, '0')}.000Z`,
      })
    }
    return scanResult()
  })

  const stored = await store.get(created.publicId)
  assert.equal(stored?.progress.progress, 50)
  assert.equal(stored?.progress.message, 'Bundle 50 inspected')
  assert.ok(store.progressWrites < 10)
})
