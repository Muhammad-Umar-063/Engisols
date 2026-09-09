import assert from 'node:assert/strict'
import test from 'node:test'

import {
  createLeadId,
  createLeadIdForSubmission,
  createProductionCheckLead,
} from '../../src/production-check/lead'
import type { ReviewRequestSubmission } from '../../src/production-check/review-intake'
import type { PersistedScan } from '../../src/production-check/types'
import { scanResult } from './fixtures'

test('creates high-entropy non-sequential lead ids', () => {
  const ids = new Set(Array.from({ length: 100 }, createLeadId))
  assert.equal(ids.size, 100)
  for (const id of ids) assert.match(id, /^lead_[A-Za-z0-9_-]{24}$/)
})

test('derives a stable high-entropy id from normalized submission identity', () => {
  const submission: ReviewRequestSubmission = {
    reportId: 'rpt_abcdefghijklmnopqrstuvwx',
    name: 'Ada  Founder',
    email: 'Ada@Example.com',
    help: 'verify',
    timeline: 'month',
    context: 'Preparing a release.\r\nSoon.',
    website: '',
  }
  const normalized: ReviewRequestSubmission = {
    ...submission,
    name: ' Ada Founder ',
    email: 'ada@example.com',
    context: 'Preparing a release.\nSoon.',
  }

  const first = createLeadIdForSubmission(submission.reportId, submission)
  assert.equal(first, createLeadIdForSubmission(normalized.reportId, normalized))
  assert.notEqual(first, createLeadIdForSubmission(submission.reportId, {
    ...submission,
    timeline: 'now',
  }))
  assert.match(first, /^lead_[A-Za-z0-9_-]{24}$/)
})

test('builds a one-year lead from sanitized server-side scan context only', () => {
  const result = scanResult()
  result.target.finalUrl = `https://app.example/dashboard?token=${'private-query-value'}#section`
  const scan: PersistedScan = {
    publicId: 'rpt_abcdefghijklmnopqrstuvwx',
    status: 'completed',
    requestedUrl: 'https://app.example/',
    progress: { phase: 'complete', progress: 100, message: 'Complete', events: [] },
    answers: { builder: 'cursor', launchStage: 'preparing_to_launch' },
    attribution: { source: 'meta', campaign: 'launch' },
    result,
    createdAt: '2026-09-09T10:00:00.000Z',
    expiresAt: '2026-12-08T10:00:00.000Z',
  }
  const lead = createProductionCheckLead(
    {
      reportId: scan.publicId,
      name: 'Ada Founder',
      email: 'ada@example.com',
      help: 'fix',
      timeline: 'quarter',
      context: 'Preparing a production release.',
      website: '',
    },
    scan,
    () => new Date('2026-09-09T10:00:00.000Z'),
    () => 'lead_abcdefghijklmnopqrstuvwx',
  )

  assert.equal(lead.expiresAt, '2027-09-09T10:00:00.000Z')
  assert.equal(lead.appUrl, 'https://app.example/dashboard')
  assert.deepEqual(lead.attribution, scan.attribution)
  assert.doesNotMatch(JSON.stringify(lead), /findings|evidence|private-query-value/)
})
