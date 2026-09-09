import assert from 'node:assert/strict'
import test from 'node:test'

import {
  auditInquirySubject,
  buildAuditInquiryText,
  parseAuditInquirySubmission,
  validateAuditInquiry,
} from '../../src/campaign/audit-inquiry'

const valid = {
  name: 'Ada Founder',
  email: 'ada@example.com',
  app: 'https://app.example.com',
  worry: 'I need confidence in authentication and payments.',
}

test('validates and normalizes a qualified app audit inquiry', () => {
  assert.deepEqual(validateAuditInquiry(valid), {})
  assert.deepEqual(parseAuditInquirySubmission({ ...valid, website: '' }), { ...valid, website: '' })
  assert.equal(auditInquirySubject(valid.app), 'AI app audit request — app.example.com')
  assert.match(buildAuditInquiryText(valid), /authentication and payments/)
})

test('rejects missing, malformed, oversized, and unexpected inquiry values', () => {
  assert.deepEqual(Object.keys(validateAuditInquiry({ name: '', email: 'bad', app: '', worry: '' })).sort(), ['app', 'email', 'name', 'worry'])
  assert.equal(parseAuditInquirySubmission({ ...valid, privileged: true }), null)
  assert.equal(parseAuditInquirySubmission({ ...valid, email: 'not-an-email' }), null)
  assert.equal(parseAuditInquirySubmission({ ...valid, worry: 'x'.repeat(1_001) }), null)
})

test('normalizes line endings in the email body', () => {
  const text = buildAuditInquiryText({ ...valid, worry: 'First\r\nSecond' })
  assert.match(text, /First\nSecond/)
  assert.doesNotMatch(text, /\r/)
})
