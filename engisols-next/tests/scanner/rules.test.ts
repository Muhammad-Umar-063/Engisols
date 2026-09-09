import assert from 'node:assert/strict'
import test from 'node:test'

import { evaluateRules } from '../../src/scanner/rules'
import {
  contextualOpenAiSecret,
  dangerousSecrets,
  openAiSecretKey,
  privateKey,
  slackWebhook,
  stripeSecretKey,
  supabaseSecretKey,
  supabaseServiceRoleJwt,
} from './fixtures/dangerous-secrets'
import {
  legitimatePublicConfig,
  stripePublishableKey,
  supabaseAnonJwt,
  supabasePublishableKey,
} from './fixtures/legitimate-public-config'

const fingerprintKey = Buffer.alloc(32, 7)

function evaluate(
  content: string,
  headers: Record<string, string | undefined> = {
    'content-security-policy': "default-src 'self'; frame-ancestors 'self'",
    'x-content-type-options': 'nosniff',
    'referrer-policy': 'strict-origin-when-cross-origin',
    'permissions-policy': 'camera=()',
    'strict-transport-security': 'max-age=31536000',
  },
  url = 'https://app.example/',
) {
  return evaluateRules({
    sources: [{ kind: 'javascript', url, content }],
    headers,
    finalUrl: new URL(url),
    fingerprintKey,
    maxFindings: 100,
  }).findings
}

test('legitimate Supabase and Stripe client configuration is by design', () => {
  const findings = evaluate(legitimatePublicConfig)
  const publicRules = new Set(
    findings
      .filter(({ classification }) => classification === 'by_design')
      .map(({ ruleId }) => ruleId),
  )

  assert.deepEqual(publicRules, new Set([
    'architecture.browser_supabase',
    'stripe.publishable_key',
    'supabase.publishable_key',
  ]))
  assert.equal(
    findings.some(({ classification }) => classification === 'actually_bad'),
    false,
  )
})

test('server-side credentials and capability webhooks are actually bad', () => {
  const findings = evaluate(dangerousSecrets)
  const dangerousRules = new Set(
    findings
      .filter(({ classification }) => classification === 'actually_bad')
      .map(({ ruleId }) => ruleId),
  )

  assert.deepEqual(dangerousRules, new Set([
    'credential.private_key',
    'openai.server_secret',
    'stripe.secret_key',
    'supabase.secret_key',
    'webhook.credential_bearing',
  ]))
})

test('detects a high-entropy quoted value in explicit OpenAI key context', () => {
  const findings = evaluate(`
    const OPENAI_API_KEY = '${contextualOpenAiSecret}'
  `)
  const openAiFinding = findings.find(
    ({ ruleId }) => ruleId === 'openai.server_secret',
  )

  assert.equal(openAiFinding?.classification, 'actually_bad')
  assert.equal(
    JSON.stringify(openAiFinding).includes(contextualOpenAiSecret),
    false,
  )
})

test('raw credential fixtures never appear in serialized findings', () => {
  const serialized = JSON.stringify(evaluate(dangerousSecrets))
  for (const secret of [
    openAiSecretKey,
    privateKey,
    slackWebhook,
    stripeSecretKey,
    supabaseSecretKey,
    supabaseServiceRoleJwt,
  ]) {
    assert.equal(serialized.includes(secret), false, secret.slice(0, 12))
  }
})

test('ignores generic tokens, placeholders, and variable references', () => {
  const findings = evaluate(`
    const OPENAI_API_KEY = 'your_key_here'
    const openaiApiKey = 'sk-'
    const config = { OPENAI_SECRET_KEY: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx' }
    const unrelatedToken = '${contextualOpenAiSecret}'
    const jwt = 'eyJub3QiOiJzdXBhYmFzZSJ9.eyJyb2xlIjoiYWRtaW4ifQ.signature12345'
    const marker = '-----BEGIN PRIVATE KEY-----'
    client.from(tableName)
    const words = 'administrator documentation'
  `)

  assert.equal(findings.some(({ category }) => category === 'credentials'), false)
  assert.equal(findings.some(({ category }) => category === 'data_access'), false)
  assert.equal(findings.some(({ category }) => category === 'admin_surface'), false)
})

test('handles repeated incomplete private-key markers within the rule deadline', {
  timeout: 1_000,
}, () => {
  const findings = evaluate('-----BEGIN PRIVATE KEY-----'.repeat(10_000))

  assert.equal(
    findings.some(({ ruleId }) => ruleId === 'credential.private_key'),
    false,
  )
})

test('does not classify marker-shaped base64 prose as a private key', () => {
  const findings = evaluate(`-----BEGIN PRIVATE KEY-----
VGhpcyBpcyBub3QgYSByZWFsIHByaXZhdGUga2V5LCBldmVuIHRob3VnaCBpdCBsb29rcyBsaWtlIG9uZS4=
-----END PRIVATE KEY-----`)

  assert.equal(
    findings.some(({ ruleId }) => ruleId === 'credential.private_key'),
    false,
  )
})

test('table references require Supabase context and never claim broken RLS', () => {
  const withoutContext = evaluate(`client.from('payments')`)
  assert.equal(
    withoutContext.some(({ ruleId }) => ruleId.includes('table')),
    false,
  )

  const withContext = evaluate(`
    const url = 'https://fixture.supabase.co'
    const key = '${supabasePublishableKey}'
    const client = createClient(url, key)
    client.from('payments')
    client.from('catalog')
  `)
  const tableFindings = withContext.filter(({ category }) => category === 'data_access')
  assert.deepEqual(
    new Set(tableFindings.map(({ ruleId }) => ruleId)),
    new Set(['supabase.sensitive_table', 'supabase.table_reference']),
  )
  assert.equal(
    tableFindings.every(({ summary }) =>
      summary.toLowerCase().includes('rls was not tested'),
    ),
    true,
  )
})

test('does not infer Supabase from an unrelated createClient and generic JWT', () => {
  const findings = evaluate(`
    import { createClient } from 'some-other-sdk'
    const token = 'eyJub3QiOiJzdXBhYmFzZSJ9.eyJyb2xlIjoiYWRtaW4ifQ.signature12345'
    createClient(token).from('payments')
  `)

  assert.equal(
    findings.some(({ category }) =>
      category === 'data_access' || category === 'architecture'),
    false,
  )
})

test('deduplicates the same secret repeated across assets', () => {
  const findings = evaluateRules({
    sources: [
      {
        kind: 'html',
        url: 'https://app.example/',
        content: stripeSecretKey,
      },
      {
        kind: 'javascript',
        url: 'https://app.example/app.js',
        content: stripeSecretKey,
      },
    ],
    headers: {},
    finalUrl: new URL('https://app.example/'),
    fingerprintKey,
    maxFindings: 100,
  }).findings

  assert.equal(
    findings.filter(({ ruleId }) => ruleId === 'stripe.secret_key').length,
    1,
  )
})

test('report-only CSP is not enforcing and HTTP does not require HSTS', () => {
  const findings = evaluate(
    '',
    {
      'content-security-policy-report-only': "default-src 'self'",
      'x-frame-options': 'SAMEORIGIN',
      'x-content-type-options': 'nosniff',
      'referrer-policy': 'no-referrer',
      'permissions-policy': 'camera=()',
    },
    'http://app.example/',
  )

  assert.equal(findings.some(({ ruleId }) => ruleId === 'header.csp_missing'), true)
  assert.equal(findings.some(({ ruleId }) => ruleId === 'header.hsts_missing'), false)
})

test('classifies administrative routes and generic webhooks as needs proof', () => {
  const findings = evaluate(`
    const adminRoute = '/admin/users'
    const webhook = 'https://automation.example/webhooks/build-complete'
  `)

  assert.deepEqual(
    new Set(
      findings
        .filter(({ classification }) => classification === 'needs_proof')
        .map(({ ruleId }) => ruleId),
    ),
    new Set(['route.admin_surface', 'webhook.generic_hardcoded']),
  )
})

test('reports every missing HTTPS security header as needs proof', () => {
  const findings = evaluate('', {}, 'https://app.example/')
  const headerFindings = findings.filter(
    ({ category }) => category === 'security_headers',
  )

  assert.deepEqual(
    new Set(headerFindings.map(({ ruleId }) => ruleId)),
    new Set([
      'header.csp_missing',
      'header.frame_protection_missing',
      'header.hsts_missing',
      'header.nosniff_missing',
      'header.permissions_policy_missing',
      'header.referrer_policy_missing',
    ]),
  )
  assert.equal(
    headerFindings.every(({ classification }) => classification === 'needs_proof'),
    true,
  )
})

test('fixture keys are structurally distinct', () => {
  assert.notEqual(supabaseAnonJwt, supabaseServiceRoleJwt)
  assert.notEqual(stripePublishableKey, stripeSecretKey)
})
