import assert from 'node:assert/strict'
import test from 'node:test'

import {
  createAuditInquiryLead,
  UnsafeAuditInquiryContentError,
} from '../../src/campaign/audit-inquiry-lead'

const submission = {
  name: 'Ada Founder',
  email: 'ada@example.com',
  app: 'https://app.example.com',
  worry: 'Review authentication and payment reliability.',
  website: '',
  attributionToken: 'signed-token',
}

test('creates stable retained campaign leads with one Meta conversion ID', () => {
  const now = () => new Date('2026-09-15T00:00:00.000Z')
  const context = {
    consent: 'granted' as const,
    identifiers: { fbp: 'fb.1.1725969600000.browser123' },
  }
  const first = createAuditInquiryLead(submission, { source: 'meta' }, context, 'https://engisols.com/ai-app-audit', now)
  const retry = createAuditInquiryLead({ ...submission }, { source: 'meta' }, context, 'https://engisols.com/ai-app-audit', now)

  assert.equal(first.id, retry.id)
  assert.match(first.id, /^audit_lead_[A-Za-z0-9_-]{24}$/)
  assert.match(first.metaTracking.lead.eventId, /^lead_[A-Za-z0-9_-]{32}$/)
  assert.equal(first.expiresAt, '2027-09-15T00:00:00.000Z')
  assert.deepEqual(first.attribution, { source: 'meta' })
})

test('rejects credential-like inquiry details before they can be persisted', () => {
  assert.throws(
    () => createAuditInquiryLead(
      { ...submission, worry: `Deploy with ${'sk_live_' + 'A'.repeat(24)}` },
      {},
      { consent: 'granted', identifiers: {} },
      'https://engisols.com/ai-app-audit',
    ),
    UnsafeAuditInquiryContentError,
  )
})
