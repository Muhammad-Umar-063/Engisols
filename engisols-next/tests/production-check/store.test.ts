import assert from 'node:assert/strict'
import test from 'node:test'

import { MemoryScanStore } from '../../src/production-check/store'
import type { PersistedScan } from '../../src/production-check/types'

function queuedScan(): PersistedScan {
  return {
    publicId: 'rpt_abcdefghijklmnopqrstuvwx',
    status: 'queued',
    requestedUrl: 'https://app.example/',
    progress: {
      phase: 'validating',
      progress: 0,
      message: 'Waiting to start',
      events: [],
    },
    answers: {},
    createdAt: '2026-09-07T10:00:00.000Z',
    expiresAt: '2026-09-14T10:00:00.000Z',
  }
}

test('persists qualification answers independently from progress updates', async () => {
  const store = new MemoryScanStore(() => new Date('2026-09-07T11:00:00.000Z'))
  const scan = queuedScan()
  await store.create(scan)
  await Promise.all([
    store.updateProgress(scan.publicId, {
      phase: 'fetching', progress: 12, message: 'Reaching the app', events: [],
    }),
    store.updateAnswers(scan.publicId, { builder: 'lovable', launchStage: 'taking_payments' }),
  ])

  const persisted = await store.get(scan.publicId)
  assert.equal(persisted?.progress.phase, 'fetching')
  assert.deepEqual(persisted?.answers, { builder: 'lovable', launchStage: 'taking_payments' })
})

test('expired report records are not returned', async () => {
  const store = new MemoryScanStore(() => new Date('2026-09-15T10:00:00.000Z'))
  await store.create(queuedScan())
  assert.equal(
    await store.updateAnswers('rpt_abcdefghijklmnopqrstuvwx', { builder: 'cursor' }),
    false,
  )
  assert.equal(await store.get('rpt_abcdefghijklmnopqrstuvwx'), null)
})

test('answer updates report whether the record still exists', async () => {
  const store = new MemoryScanStore(() => new Date('2026-09-07T11:00:00.000Z'))
  const scan = queuedScan()
  await store.create(scan)
  assert.equal(await store.updateAnswers(scan.publicId, { builder: 'cursor' }), true)
  assert.equal(
    await store.updateAnswers('rpt_missingrecordxxxxxxxxx', { builder: 'cursor' }),
    false,
  )
})
