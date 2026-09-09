import assert from 'node:assert/strict'
import test from 'node:test'

import { containsCredentialLikeValue } from '../../src/production-check/security'

test('detects common high-confidence credential formats', () => {
  const credentials = [
    `github_pat_${'A1b2C3d4'.repeat(6)}`,
    `ghp_${'A1b2C3d4'.repeat(5)}`,
    `xoxb-${'A1b2C3d4'.repeat(5)}`,
    `AIza${'A1b2C3d4_'.repeat(4).slice(0, 35)}`,
    `DATABASE_SECRET=${'A1b2C3d4E5f6G7h8I9j0'}`,
    { DEPLOY_TOKEN: '9fG2kL8qP4mN7vC3xR6zW1sT' },
  ]

  for (const credential of credentials) {
    assert.equal(containsCredentialLikeValue(credential), true)
  }
})

test('does not flag placeholders or ordinary campaign names', () => {
  const safeValues = [
    'founder-launch-2026',
    'paid-social',
    'API_TOKEN=your-token-here',
    { DATABASE_SECRET: 'replace-me-secret' },
    { campaign: 'production-readiness-check' },
  ]

  for (const value of safeValues) {
    assert.equal(containsCredentialLikeValue(value), false)
  }
})
