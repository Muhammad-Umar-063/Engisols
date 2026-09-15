import assert from 'node:assert/strict'
import test from 'node:test'

import {
  auditInquirySubject,
  parseAuditInquirySubmission,
  validateAuditInquiry,
} from '../../src/campaign/audit-inquiry'

const valid = {
  name: 'Ada Founder',
  email: 'ada@example.com',
  app: 'https://app.example.com',
  worry: 'I need confidence in authentication and payments.',
}
const attributionToken = 'signed-attribution-token'

test('validates and normalizes a qualified app audit inquiry', () => {
  assert.deepEqual(validateAuditInquiry(valid), {})
  assert.deepEqual(
    parseAuditInquirySubmission({ ...valid, website: '', attributionToken }),
    { ...valid, website: '', attributionToken },
  )
  assert.equal(auditInquirySubject(valid.app), 'AI app audit request — app.example.com')
})

test('rejects missing, malformed, oversized, and unexpected inquiry values', () => {
  assert.deepEqual(Object.keys(validateAuditInquiry({ name: '', email: 'bad', app: '', worry: '' })).sort(), ['app', 'email', 'name', 'worry'])
  assert.equal(parseAuditInquirySubmission({ ...valid, attributionToken, privileged: true }), null)
  assert.equal(parseAuditInquirySubmission({ ...valid, attributionToken, email: 'not-an-email' }), null)
  assert.equal(parseAuditInquirySubmission({ ...valid, attributionToken, worry: 'x'.repeat(1_001) }), null)
  assert.equal(parseAuditInquirySubmission({ ...valid }), null)
})
