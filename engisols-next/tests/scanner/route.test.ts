import assert from 'node:assert/strict'
import test from 'node:test'

import { createScanPostHandler } from '../../app/api/scan/route'
import { ScannerError } from '../../src/scanner/errors'
import type { ScanResult } from '../../src/scanner/types'

const fixtureResult: ScanResult = {
  schemaVersion: 'scanner-v1',
  status: 'completed',
  target: {
    requestedUrl: 'https://app.example/',
    finalUrl: 'https://app.example/',
    httpStatus: 200,
  },
  score: {
    modelVersion: 'scanner-v1',
    scope: 'observed_public_surface',
    risk: 0,
    readiness: 100,
    band: 'low',
    categoryDeductions: {
      security_headers: 0,
      credentials: 0,
      data_access: 0,
      admin_surface: 0,
      webhooks: 0,
      architecture: 0,
    },
  },
  assessment: {
    modelVersion: 'scanner-v1.1',
    exposure: { risk: 0, band: 'low', actuallyBad: 0 },
    coverage: {
      confidence: 'strong',
      score: 100,
      reasons: [
        'All discovered resources within the bounded public scan were processed.',
      ],
    },
    productionProof: {
      scope: 'public_surface_only',
      total: 10,
      observedPublicEvidence: 3,
      needsCodeReview: 7,
      publicExposures: 0,
      checks: [],
    },
    recommendation: 'code_review',
    headline:
      'No critical public exposure was observed; production controls still require code-level verification.',
    groups: [],
  },
  summary: { total: 0, byDesign: 0, needsProof: 0, actuallyBad: 0 },
  findings: [],
  checks: [],
  coverage: {
    scope: 'bounded_public_surface',
    completeness: 'partial',
    documents: { discovered: 1, attempted: 1, scanned: 1 },
    metadata: { discovered: 0, attempted: 0, scanned: 0 },
    scripts: { discovered: 0, attempted: 0, scanned: 0 },
    findings: {
      observedAtLeast: 0,
      returned: 0,
      truncated: false,
      omittedByCategory: [],
    },
    bytesScanned: 1,
    redirectsFollowed: 0,
    skipped: [],
    limitsReached: [],
  },
  limitations: [],
  durationMs: 1,
}

function request(body: string): Request {
  return new Request('https://engisols.com/api/scan', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body,
  })
}

test('returns a no-store typed result for valid input', async () => {
  const handler = createScanPostHandler(async (url) => {
    assert.equal(url, 'https://app.example')
    return fixtureResult
  })
  const response = await handler(request('{"url":"https://app.example"}'))

  assert.equal(response.status, 200)
  assert.equal(response.headers.get('cache-control'), 'no-store')
  assert.deepEqual(await response.json(), { ok: true, result: fixtureResult })
})

test('rejects malformed, oversized, and non-exact request bodies', async () => {
  const handler = createScanPostHandler(async () => fixtureResult)
  const inputs = [
    '{',
    '{}',
    '{"url":42}',
    '{"url":"https://app.example","extra":true}',
    JSON.stringify({ url: `https://app.example/${'a'.repeat(4_100)}` }),
  ]

  for (const input of inputs) {
    const response = await handler(request(input))
    assert.equal(response.status, 400, input.slice(0, 40))
    assert.deepEqual(await response.json(), {
      ok: false,
      error: {
        schemaVersion: 'scanner-v1',
        code: 'invalid_request',
        message: 'Provide one valid public HTTP or HTTPS URL.',
      },
    })
  }
})

test('maps scanner failures without exposing internal details', async () => {
  const handler = createScanPostHandler(async () => {
    throw new ScannerError(
      'target_blocked',
      'private address 169.254.169.254?token=secret',
    )
  })
  const response = await handler(request('{"url":"https://app.example"}'))
  const body = await response.text()

  assert.equal(response.status, 400)
  assert.equal(body.includes('169.254.169.254'), false)
  assert.equal(body.includes('secret'), false)
})

test('caps concurrent scans per handler instance', async () => {
  let release: (() => void) | undefined
  const gate = new Promise<void>((resolve) => {
    release = resolve
  })
  const handler = createScanPostHandler(async () => {
    await gate
    return fixtureResult
  })
  const body = '{"url":"https://app.example"}'
  const active = Array.from({ length: 4 }, () => handler(request(body)))
  await new Promise((resolve) => setTimeout(resolve, 0))

  const saturated = await handler(request(body))
  assert.equal(saturated.status, 503)

  release?.()
  const responses = await Promise.all(active)
  assert.equal(responses.every(({ status }) => status === 200), true)
})

test('releases a scan slot after a stalled request body times out', async () => {
  const handler = createScanPostHandler(async () => fixtureResult)
  const stalled = new Request('https://engisols.com/api/scan', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: new ReadableStream<Uint8Array>({
      start() {},
    }),
    duplex: 'half',
  } as RequestInit & { duplex: 'half' })

  const response = await handler(stalled)
  assert.equal(response.status, 400)

  const recovered = await handler(request('{"url":"https://app.example"}'))
  assert.equal(recovered.status, 200)
})

test('maps a rejected request body stream to invalid input', async () => {
  let scanCalled = false
  const handler = createScanPostHandler(async () => {
    scanCalled = true
    return fixtureResult
  })
  const rejected = new Request('https://engisols.com/api/scan', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: new ReadableStream<Uint8Array>({
      start(controller) {
        controller.error(new Error('client stream failed'))
      },
    }),
    duplex: 'half',
  } as RequestInit & { duplex: 'half' })

  const response = await handler(rejected)

  assert.equal(response.status, 400)
  assert.equal(scanCalled, false)
  assert.deepEqual(await response.json(), {
    ok: false,
    error: {
      schemaVersion: 'scanner-v1',
      code: 'invalid_request',
      message: 'Provide one valid public HTTP or HTTPS URL.',
    },
  })
})
