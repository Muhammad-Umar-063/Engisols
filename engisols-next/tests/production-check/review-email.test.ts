import assert from 'node:assert/strict'
import test from 'node:test'

import {
  ReviewEmailDeliveryError,
  sendReviewEmailWithResend,
  type ReviewEmailMessage,
} from '../../src/production-check/review-email'

const message: ReviewEmailMessage = {
  replyTo: 'ada@example.com',
  subject: 'Engineering review request — app.example.com',
  text: 'A bounded engineering review request.',
  idempotencyKey: 'production-check/rpt_example/fingerprint',
}

test('sends the review through the Resend API with reply-to and idempotency', async () => {
  let capturedUrl = ''
  let capturedInit: RequestInit | undefined
  const fetcher: typeof fetch = async (input, init) => {
    capturedUrl = String(input)
    capturedInit = init
    return Response.json({ id: 'email_123' })
  }

  await sendReviewEmailWithResend(
    message,
    { apiKey: 're_private_test_value', from: 'Engisols <reviews@updates.engisols.com>', to: 'growth@engisols.com' },
    fetcher,
  )

  assert.equal(capturedUrl, 'https://api.resend.com/emails')
  const headers = new Headers(capturedInit?.headers)
  assert.equal(headers.get('authorization'), 'Bearer re_private_test_value')
  assert.equal(headers.get('idempotency-key'), message.idempotencyKey)
  assert.equal(headers.get('user-agent'), 'engisols-production-check/1.0')
  const body = JSON.parse(String(capturedInit?.body)) as Record<string, unknown>
  assert.equal(body.reply_to, 'ada@example.com')
  assert.deepEqual(body.to, ['growth@engisols.com'])
  assert.equal(body.text, message.text)
})

test('does not expose provider response details when delivery fails', async () => {
  const fetcher: typeof fetch = async () => new Response('private provider detail', { status: 422 })
  await assert.rejects(
    sendReviewEmailWithResend(
      message,
      { apiKey: 're_private_test_value', from: 'Engisols <reviews@updates.engisols.com>', to: 'growth@engisols.com' },
      fetcher,
    ),
    (error: unknown) => error instanceof ReviewEmailDeliveryError && !error.message.includes('private provider detail'),
  )
})
