import assert from 'node:assert/strict'
import test from 'node:test'

import { ScannerError } from '../../src/scanner/errors'
import {
  createDnsPinCache,
  isPublicIpAddress,
  validatePublicUrl,
} from '../../src/scanner/url-policy'

const publicResolver = async () => [{ address: '93.184.216.34', family: 4 as const }]

test('normalizes and approves a public HTTPS destination', async () => {
  const approved = await validatePublicUrl(
    'https://Example.com/path?campaign=1#client-state',
    publicResolver,
    createDnsPinCache(),
    Date.now() + 1_000,
  )

  assert.equal(approved.url.href, 'https://example.com/path?campaign=1')
  assert.equal(approved.address, '93.184.216.34')
  assert.equal(approved.family, 4)
})

test('blocks local names, alternate loopback spellings, ports, and userinfo', async () => {
  const blocked = [
    'http://localhost',
    'http://service.localhost',
    'http://127.1',
    'http://0x7f000001',
    'http://2130706433',
    'http://[::1]',
    'http://[::ffff:127.0.0.1]',
    'https://example.com:8443',
    'https://user:password@example.com',
    'ftp://example.com/file',
  ]

  for (const target of blocked) {
    await assert.rejects(
      validatePublicUrl(
        target,
        publicResolver,
        createDnsPinCache(),
        Date.now() + 1_000,
      ),
      (error: unknown) =>
        error instanceof ScannerError && error.code === 'target_blocked',
      target,
    )
  }
})

test('rejects a hostname when any DNS answer is non-public', async () => {
  const resolver = async () => [
    { address: '93.184.216.34', family: 4 as const },
    { address: '10.0.0.8', family: 4 as const },
  ]

  await assert.rejects(
    validatePublicUrl(
      'https://example.com',
      resolver,
      createDnsPinCache(),
      Date.now() + 1_000,
    ),
    (error: unknown) =>
      error instanceof ScannerError && error.code === 'target_blocked',
  )
})

test('fails closed on empty or slow DNS resolution', async () => {
  await assert.rejects(
    validatePublicUrl(
      'https://example.com',
      async () => [],
      createDnsPinCache(),
      Date.now() + 1_000,
    ),
    (error: unknown) =>
      error instanceof ScannerError && error.code === 'target_blocked',
  )

  await assert.rejects(
    validatePublicUrl(
      'https://example.com',
      () => new Promise(() => undefined),
      createDnsPinCache(),
      Date.now() + 10,
    ),
    (error: unknown) =>
      error instanceof ScannerError && error.code === 'target_unavailable',
  )
})

test('reuses the first approved DNS pin for the rest of a scan', async () => {
  let calls = 0
  const resolver = async () => {
    calls += 1
    return calls === 1
      ? [{ address: '93.184.216.34', family: 4 as const }]
      : [{ address: '127.0.0.1', family: 4 as const }]
  }
  const cache = createDnsPinCache()

  const first = await validatePublicUrl(
    'https://example.com',
    resolver,
    cache,
    Date.now() + 1_000,
  )
  const second = await validatePublicUrl(
    'https://example.com/next',
    resolver,
    cache,
    Date.now() + 1_000,
  )

  assert.equal(first.address, '93.184.216.34')
  assert.equal(second.address, '93.184.216.34')
  assert.equal(calls, 1)
})

test('blocks representative IANA special-purpose ranges', () => {
  const blocked = [
    '0.0.0.0',
    '10.0.0.1',
    '100.64.0.1',
    '169.254.169.254',
    '172.16.0.1',
    '192.0.2.1',
    '192.168.1.1',
    '198.18.0.1',
    '198.51.100.1',
    '203.0.113.1',
    '224.0.0.1',
    '240.0.0.1',
    '::',
    '::1',
    '::ffff:10.0.0.1',
    '64:ff9b::1',
    '100::1',
    '2001:db8::1',
    'fc00::1',
    'fe80::1',
    'ff00::1',
    'fec0::1',
    '::192.0.2.1',
  ]

  for (const address of blocked) {
    assert.equal(isPublicIpAddress(address), false, address)
  }

  assert.equal(isPublicIpAddress('8.8.8.8'), true)
  assert.equal(isPublicIpAddress('2606:4700:4700::1111'), true)
})
