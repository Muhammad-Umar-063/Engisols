import assert from 'node:assert/strict'
import test from 'node:test'

import { parseAuditInquirySuccess } from '../../src/campaign/audit-inquiry-response'

const leadResponse = {
  ok: true,
  leadId: 'audit_lead_abcdefghijklmnopqrstuvwx',
  notification: 'delayed',
  metaEvents: { primary: 'lead_abcdefghijklmnopqrstuvwxyzABCDEF' },
}

test('accepts only a complete durable-lead response as a tracked conversion', () => {
  assert.deepEqual(parseAuditInquirySuccess(leadResponse), {
    kind: 'lead',
    leadId: leadResponse.leadId,
    notification: 'delayed',
    metaEventId: leadResponse.metaEvents.primary,
  })
  assert.equal(parseAuditInquirySuccess({ ...leadResponse, leadId: undefined }), null)
  assert.equal(parseAuditInquirySuccess({ ...leadResponse, notification: undefined }), null)
  assert.equal(parseAuditInquirySuccess({ ...leadResponse, metaEvents: undefined }), null)
})

test('keeps the exact honeypot acknowledgement generic and non-converting', () => {
  assert.deepEqual(parseAuditInquirySuccess({ ok: true }), { kind: 'generic' })
  assert.equal(parseAuditInquirySuccess({ ok: true, unexpected: true }), null)
})
