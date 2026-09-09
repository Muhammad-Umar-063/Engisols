import assert from 'node:assert/strict'
import test from 'node:test'

import {
  attributionFromSearchParams,
  parseAttributionInput,
} from '../../src/production-check/attribution'

test('captures supported campaign attribution from the first landing URL', () => {
  assert.deepEqual(
    attributionFromSearchParams(new URLSearchParams(
      'utm_source=meta&utm_medium=paid-social&utm_campaign=launch&utm_content=founder-proof&utm_term=ai-app&fbclid=click-123',
    )),
    {
      source: 'meta',
      medium: 'paid-social',
      campaign: 'launch',
      content: 'founder-proof',
      term: 'ai-app',
      fbclid: 'click-123',
    },
  )
})

test('bounds attribution and rejects unexpected server fields', () => {
  assert.deepEqual(parseAttributionInput({ source: ' meta ', campaign: '' }), { source: 'meta' })
  assert.equal(parseAttributionInput({ source: 'meta', invented: 'value' }), null)
  assert.equal(parseAttributionInput({ source: 'x'.repeat(201) }), null)
})

test('drops secret-like and oversized values from first-landing attribution', () => {
  assert.deepEqual(
    attributionFromSearchParams(new URLSearchParams({
      utm_source: 'meta',
      utm_medium: `github_pat_${'A1b2'.repeat(12)}`,
      utm_campaign: 'founder-launch-2026',
      utm_content: 'x'.repeat(201),
    })),
    { source: 'meta', campaign: 'founder-launch-2026' },
  )
})
