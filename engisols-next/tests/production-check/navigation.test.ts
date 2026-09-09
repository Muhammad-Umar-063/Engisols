import assert from 'node:assert/strict'
import test from 'node:test'

import {
  productionLandingPath,
  productionReportPath,
  replaceProductionScanHistory,
  productionRestartPath,
  productionScanPath,
} from '../../src/production-check/paths'

test('the ordinary funnel keeps a clean landing route', () => {
  assert.equal(productionLandingPath, '/production-check')
})

test('live scan state remains on the production-check route', () => {
  const publicId = 'rpt_DemoFailureReport0000001'
  assert.equal(productionScanPath(publicId), `/production-check?scanId=${publicId}`)
})

test('a created scan replaces the current history entry for refresh recovery', () => {
  const calls: unknown[][] = []
  replaceProductionScanHistory({
    replaceState: (...args: unknown[]) => { calls.push(args) },
  }, 'rpt_DemoFailureReport0000001')
  assert.deepEqual(calls, [[null, '', '/production-check?scanId=rpt_DemoFailureReport0000001']])
})

test('completed scans retain a stable shareable report permalink', () => {
  const publicId = 'rpt_DemoPartialReport0000001'
  assert.equal(productionReportPath(publicId), `/production-check/report/${publicId}`)
})

test('retry clears stale scan state without dropping unrelated location state', () => {
  assert.equal(
    productionRestartPath('http://localhost:3000/production-check?scanId=rpt_failed&campaign=meta#tool'),
    '/production-check?campaign=meta#tool',
  )
})
