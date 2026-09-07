import assert from 'node:assert/strict'
import test from 'node:test'

import {
  DEFAULT_SCAN_LIMITS,
  resolveScanLimits,
} from '../../src/scanner/limits'
import { ScannerError, toPublicScanError } from '../../src/scanner/errors'

test('default limits preserve the production safety budget', () => {
  assert.deepEqual(DEFAULT_SCAN_LIMITS, {
    requestBodyTimeoutMs: 1_000,
    requestTimeoutMs: 4_000,
    totalTimeoutMs: 12_000,
    maxRedirects: 3,
    maxHtmlBytes: 1_048_576,
    maxMetadataBytes: 262_144,
    maxJavaScriptBytes: 1_572_864,
    maxTotalBytes: 8_388_608,
    maxHeaderBytes: 65_536,
    maxDocuments: 3,
    maxMetadataDocuments: 2,
    maxAdditionalRoutes: 2,
    maxJavaScriptAssets: 16,
    maxDiscoveredJavaScriptAssets: 256,
    maxJavaScriptDepth: 2,
    maxFindings: 100,
    maxConcurrentScans: 4,
    maxRequestBodyBytes: 4_096,
  })
})

test('custom limits may tighten but never expand a hard ceiling', () => {
  const limits = resolveScanLimits({
    maxJavaScriptAssets: 4,
    totalTimeoutMs: 30_000,
  })

  assert.equal(limits.maxJavaScriptAssets, 4)
  assert.equal(limits.totalTimeoutMs, DEFAULT_SCAN_LIMITS.totalTimeoutMs)
})

test('public errors never serialize internal causes or network details', () => {
  const error = new ScannerError(
    'target_unavailable',
    'connect ECONNREFUSED 169.254.169.254?token=raw-secret',
  )

  assert.deepEqual(toPublicScanError(error), {
    ok: false,
    error: {
      schemaVersion: 'scanner-v1',
      code: 'target_unavailable',
      message: 'The public page could not be scanned.',
    },
  })
})
