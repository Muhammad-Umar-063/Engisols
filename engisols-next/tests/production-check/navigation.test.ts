import assert from 'node:assert/strict'
import test from 'node:test'

import { destinationForScan } from '../../src/production-check/navigation'
import { productionScanPath } from '../../src/production-check/paths'

test('completed and partial scans transition to their shareable report', () => {
  const publicId = 'rpt_DemoPartialReport0000001'
  assert.equal(
    destinationForScan({ publicId, status: 'completed' }),
    `/production-check/report/${publicId}`,
  )
  assert.equal(
    destinationForScan({ publicId, status: 'partial' }),
    `/production-check/report/${publicId}`,
  )
})

test('running and failed scans remain on the live scan screen', () => {
  const publicId = 'rpt_DemoFailureReport0000001'
  assert.equal(destinationForScan({ publicId, status: 'running' }), null)
  assert.equal(destinationForScan({ publicId, status: 'failed' }), null)
})

test('live scan state remains on the production-check route', () => {
  const publicId = 'rpt_DemoFailureReport0000001'
  assert.equal(productionScanPath(publicId), `/production-check?scanId=${publicId}`)
})
