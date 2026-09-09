import assert from 'node:assert/strict'
import test from 'node:test'

import {
  signAttributionToken,
  verifyAttributionToken,
} from '../../src/production-check/attribution-token.server'

const secret = 'production-check-attribution-unit-test-secret-0123456789'
const issuedAt = new Date('2026-09-09T10:00:00.000Z')

test('round-trips bounded attribution through a signed token', () => {
  const attribution = {
    source: 'meta',
    medium: 'paid-social',
    campaign: 'founder-launch',
    fbclid: 'click-123',
  }
  const token = signAttributionToken(attribution, { secret, now: issuedAt })

  assert.deepEqual(
    verifyAttributionToken(token, {
      secret,
      now: new Date('2026-09-10T09:59:59.999Z'),
    }),
    attribution,
  )
})

test('rejects tampered and expired attribution tokens', () => {
  const token = signAttributionToken(
    { source: 'meta', campaign: 'founder-launch' },
    { secret, now: issuedAt },
  )
  const [payload, signature] = token.split('.')
  const tamperedPayload = `${payload?.slice(0, -1)}${payload?.endsWith('A') ? 'B' : 'A'}`

  assert.equal(
    verifyAttributionToken(`${tamperedPayload}.${signature}`, { secret, now: issuedAt }),
    null,
  )
  assert.equal(
    verifyAttributionToken(token, {
      secret,
      now: new Date('2026-09-10T10:00:00.001Z'),
    }),
    null,
  )
})

test('does not sign credential-like attribution', () => {
  assert.throws(
    () => signAttributionToken(
      { campaign: 'API_TOKEN=A7mQ2vL9xR4pT8kN3dW6sZ1c' },
      { secret, now: issuedAt },
    ),
    /credential-like value/i,
  )
})
