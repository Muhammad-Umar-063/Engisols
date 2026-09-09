import assert from 'node:assert/strict'
import type { IncomingMessage } from 'node:http'
import { Readable } from 'node:stream'
import { brotliCompressSync, deflateSync, gzipSync } from 'node:zlib'
import test from 'node:test'

import { ScannerError } from '../../src/scanner/errors'
import { DEFAULT_SCAN_LIMITS } from '../../src/scanner/limits'
import {
  createPinnedLookup,
  createPinnedRequestOptions,
  consumeIncomingResponse,
  fetchPublicResource,
  ScanResourceLimitError,
  type RequestOnce,
} from '../../src/scanner/public-fetch'

const resolveHost = async () => [
  { address: '93.184.216.34', family: 4 as const },
]

test('the socket lookup returns only the address approved by policy', async () => {
  const lookup = createPinnedLookup('93.184.216.34', 4)
  const result = await new Promise<{ address: string; family: number }>(
    (resolve, reject) => {
      lookup('rebound.example', {}, (error, address, family) => {
        if (error) {
          reject(error)
          return
        }
        resolve({ address: address as string, family: family as number })
      })
    },
  )

  assert.deepEqual(result, { address: '93.184.216.34', family: 4 })
})

test('the pinned lookup supports Node all-address mode without re-resolving', async () => {
  const lookup = createPinnedLookup('2606:4700:4700::1111', 6)
  const result = await new Promise<unknown>((resolve, reject) => {
    lookup('rebound.example', { all: true }, (error, addresses) => {
      if (error) {
        reject(error)
        return
      }
      resolve(addresses)
    })
  })

  assert.deepEqual(result, [
    { address: '2606:4700:4700::1111', family: 6 },
  ])
})

test('production request options preserve TLS identity and install all transport bounds', () => {
  const signal = AbortSignal.timeout(1_000)
  const target = {
    url: new URL('https://app.example/bundle.js?version=1'),
    hostname: 'app.example',
    address: '93.184.216.34',
    family: 4 as const,
  }
  const options = createPinnedRequestOptions({
    target,
    signal,
    maxHeaderBytes: 4_096,
  })

  assert.equal(options.hostname, 'app.example')
  assert.equal(options.servername, 'app.example')
  assert.equal(options.path, '/bundle.js?version=1')
  assert.equal(options.rejectUnauthorized, true)
  assert.equal(options.signal, signal)
  assert.equal(options.maxHeaderSize, 4_096)
  assert.equal(options.agent, false)
  assert.equal(options.headers['Accept-Encoding'], 'identity')
  assert.equal(typeof options.lookup, 'function')
})

function incomingResponse(
  chunks: Buffer[],
  headers: Record<string, string> = {},
  statusCode = 200,
): IncomingMessage {
  return Object.assign(Readable.from(chunks), {
    headers,
    statusCode,
  }) as unknown as IncomingMessage
}

test('production response consumer rejects declared and streamed wire overflow', async () => {
  await assert.rejects(
    consumeIncomingResponse(
      incomingResponse([], { 'content-length': '100' }),
      10,
    ),
    (error: unknown) =>
      error instanceof ScannerError && error.code === 'target_unavailable',
  )

  await assert.rejects(
    consumeIncomingResponse(
      incomingResponse([Buffer.alloc(6), Buffer.alloc(6)]),
      10,
    ),
    (error: unknown) =>
      error instanceof ScannerError && error.code === 'target_unavailable',
  )
})

test('revalidates a relative redirect without sending its fragment', async () => {
  const calls: string[] = []
  const requestOnce: RequestOnce = async ({ target }) => {
    calls.push(target.url.href)
    if (calls.length === 1) {
      return {
        status: 302,
        headers: { location: '/app#client-state' },
        body: Buffer.alloc(0),
        wireBytes: 0,
      }
    }

    return {
      status: 200,
      headers: { 'content-type': 'text/html; charset=utf-8' },
      body: Buffer.from('<main>ok</main>'),
      wireBytes: 15,
    }
  }

  const response = await fetchPublicResource('https://example.com', {
    kind: 'html',
    limits: DEFAULT_SCAN_LIMITS,
    totalDeadlineAt: Date.now() + 2_000,
    budget: { decodedBytes: 0 },
    dnsPins: new Map(),
    resolveHost,
    requestOnce,
  })

  assert.deepEqual(calls, [
    'https://example.com/',
    'https://example.com/app',
  ])
  assert.equal(response.body, '<main>ok</main>')
  assert.equal(response.finalUrl.href, 'https://example.com/app')
  assert.equal(response.redirectsFollowed, 1)
})

test('rejects a fourth redirect', async () => {
  const requestOnce: RequestOnce = async ({ target }) => ({
    status: 302,
    headers: { location: `${target.url.pathname}x` },
    body: Buffer.alloc(0),
    wireBytes: 0,
  })

  await assert.rejects(
    fetchPublicResource('https://example.com', {
      kind: 'html',
      limits: DEFAULT_SCAN_LIMITS,
      totalDeadlineAt: Date.now() + 2_000,
      budget: { decodedBytes: 0 },
      dnsPins: new Map(),
      resolveHost,
      requestOnce,
    }),
    (error: unknown) =>
      error instanceof ScannerError && error.code === 'target_unavailable',
  )
})

test('blocks a redirect to a private address before requesting it', async () => {
  let calls = 0
  const requestOnce: RequestOnce = async () => {
    calls += 1
    return {
      status: 302,
      headers: { location: 'http://169.254.169.254/latest/meta-data' },
      body: Buffer.alloc(0),
      wireBytes: 0,
    }
  }

  await assert.rejects(
    fetchPublicResource('https://example.com', {
      kind: 'html',
      limits: DEFAULT_SCAN_LIMITS,
      totalDeadlineAt: Date.now() + 2_000,
      budget: { decodedBytes: 0 },
      dnsPins: new Map(),
      resolveHost,
      requestOnce,
    }),
    (error: unknown) =>
      error instanceof ScannerError && error.code === 'target_blocked',
  )
  assert.equal(calls, 1)
})

test('bounds decoded gzip content as well as wire bytes', async () => {
  const compressed = gzipSync(Buffer.alloc(2_000, 65))
  const requestOnce: RequestOnce = async () => ({
    status: 200,
    headers: {
      'content-encoding': 'gzip',
      'content-type': 'text/html',
    },
    body: compressed,
    wireBytes: compressed.byteLength,
  })

  await assert.rejects(
    fetchPublicResource('https://example.com', {
      kind: 'html',
      limits: {
        ...DEFAULT_SCAN_LIMITS,
        maxHtmlBytes: 1_000,
        maxTotalBytes: 1_000,
      },
      totalDeadlineAt: Date.now() + 2_000,
      budget: { decodedBytes: 0 },
      dnsPins: new Map(),
      resolveHost,
      requestOnce,
    }),
    (error: unknown) =>
      error instanceof ScannerError && error.code === 'target_unavailable',
  )
})

test('enforces the absolute deadline after decompression', async () => {
  const body = gzipSync(Buffer.from('<main>decoded</main>'))
  const startedAt = Date.now()
  let clockCalls = 0
  const deadlineNow = () => {
    clockCalls += 1
    return clockCalls >= 3 ? startedAt + 20_000 : startedAt
  }
  const budget = { decodedBytes: 0 }
  const requestOnce: RequestOnce = async () => ({
    status: 200,
    headers: {
      'content-encoding': 'gzip',
      'content-type': 'text/html',
    },
    body,
    wireBytes: body.byteLength,
  })

  await assert.rejects(
    fetchPublicResource('https://example.com', {
      kind: 'html',
      limits: DEFAULT_SCAN_LIMITS,
      totalDeadlineAt: startedAt + 10_000,
      budget,
      dnsPins: new Map(),
      resolveHost,
      requestOnce,
      deadlineNow,
    }),
    (error: unknown) =>
      error instanceof ScanResourceLimitError &&
      error.reason === 'total_timeout' &&
      error.code === 'target_unavailable',
  )
  assert.equal(budget.decodedBytes, 0)
})

for (const [encoding, encode] of [
  ['gzip', gzipSync],
  ['deflate', deflateSync],
  ['br', brotliCompressSync],
] as const) {
  test(`decodes a bounded ${encoding} response and updates the scan budget`, async () => {
    const body = Buffer.from('<main>decoded</main>')
    const encoded = encode(body)
    const budget = { decodedBytes: 7 }
    const requestOnce: RequestOnce = async () => ({
      status: 200,
      headers: {
        'content-encoding': encoding,
        'content-type': 'text/html',
      },
      body: encoded,
      wireBytes: encoded.byteLength,
    })

    const result = await fetchPublicResource('https://example.com', {
      kind: 'html',
      limits: DEFAULT_SCAN_LIMITS,
      totalDeadlineAt: Date.now() + 2_000,
      budget,
      dnsPins: new Map(),
      resolveHost,
      requestOnce,
    })

    assert.equal(result.body, body.toString('utf8'))
    assert.equal(result.decodedBytes, body.byteLength)
    assert.equal(budget.decodedBytes, 7 + body.byteLength)
  })
}

test('rejects stacked or unsupported content encodings', async () => {
  const requestOnce: RequestOnce = async () => ({
    status: 200,
    headers: { 'content-encoding': 'gzip, br' },
    body: Buffer.from('nope'),
    wireBytes: 4,
  })

  await assert.rejects(
    fetchPublicResource('https://example.com', {
      kind: 'html',
      limits: DEFAULT_SCAN_LIMITS,
      totalDeadlineAt: Date.now() + 2_000,
      budget: { decodedBytes: 0 },
      dnsPins: new Map(),
      resolveHost,
      requestOnce,
    }),
    (error: unknown) =>
      error instanceof ScannerError && error.code === 'target_unavailable',
  )
})
