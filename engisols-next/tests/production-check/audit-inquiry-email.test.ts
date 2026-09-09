import assert from 'node:assert/strict'
import test from 'node:test'

import {
  AuditInquiryEmailDeliveryError,
  sendAuditInquiryEmailWithResend,
  type AuditInquiryEmailMessage,
} from '../../src/campaign/audit-inquiry-email'

const message: AuditInquiryEmailMessage = {
  replyTo: 'ada@example.com',
  subject: 'AI app audit request — app.example.com',
  text: 'A bounded inquiry.',
  idempotencyKey: 'ai-app-audit/fingerprint',
}

test('sends an audit inquiry with campaign attribution and reply-to', async () => {
  let capturedInit: RequestInit | undefined
  const fetcher: typeof fetch = async (_input, init) => {
    capturedInit = init
    return Response.json({ id: 'email_123' })
  }

  await sendAuditInquiryEmailWithResend(
    message,
    { apiKey: 're_private_test_value', from: 'Engisols <hello@updates.engisols.com>', to: 'growth@engisols.com' },
    fetcher,
  )

  const headers = new Headers(capturedInit?.headers)
  const body = JSON.parse(String(capturedInit?.body)) as Record<string, unknown>
  assert.equal(headers.get('user-agent'), 'engisols-ai-app-audit/1.0')
  assert.equal(headers.get('idempotency-key'), message.idempotencyKey)
  assert.equal(body.reply_to, message.replyTo)
  assert.deepEqual(body.tags, [{ name: 'source', value: 'ai-app-audit' }])
})

test('hides provider response details when audit delivery fails', async () => {
  const fetcher: typeof fetch = async () => new Response('private provider detail', { status: 422 })
  await assert.rejects(
    sendAuditInquiryEmailWithResend(
      message,
      { apiKey: 're_private_test_value', from: 'Engisols <hello@updates.engisols.com>', to: 'growth@engisols.com' },
      fetcher,
    ),
    (error: unknown) => error instanceof AuditInquiryEmailDeliveryError && !error.message.includes('private provider detail'),
  )
})
