import assert from 'node:assert/strict'
import test from 'node:test'

import {
  AUDIT_INQUIRY_NOTIFICATION_LEASE_MS,
  createAuditInquiryLead,
  markAuditInquiryNotification,
} from '../../src/campaign/audit-inquiry-lead'
import { MemoryAuditInquiryLeadStore, UpstashAuditInquiryLeadStore } from '../../src/campaign/audit-inquiry-store'

function lead() {
  return createAuditInquiryLead(
    {
      name: 'Ada Founder', email: 'ada@example.com', app: 'app.example.com',
      worry: 'Review authentication.', website: '', attributionToken: 'token',
    },
    { source: 'meta' },
    { consent: 'granted', identifiers: {} },
    'https://engisols.com/ai-app-audit',
    () => new Date('2026-09-15T00:00:00.000Z'),
  )
}

test('atomically reuses an in-memory inquiry lead and never downgrades sent delivery', async () => {
  const store = new MemoryAuditInquiryLeadStore()
  const first = await store.createOrGet(lead())
  const retry = await store.createOrGet(lead())
  assert.equal(first.created, true)
  assert.equal(retry.created, false)

  const sent = { ...first.lead, notification: { status: 'sent' as const, attemptedAt: '2026-09-15T00:01:00.000Z' } }
  await store.save(sent)
  await store.save({ ...sent, notification: { status: 'pending' as const } })
  assert.equal((await store.get(sent.id))?.notification.status, 'sent')
})

test('atomically reclaims one stale pending notification without claiming a fresh lease', async () => {
  let current = new Date('2026-09-15T00:00:30.000Z')
  const store = new MemoryAuditInquiryLeadStore(() => current)
  const saved = (await store.createOrGet(lead())).lead

  const freshClaim = await store.claimNotification(
    saved.id,
    current.toISOString(),
    new Date(current.getTime() - AUDIT_INQUIRY_NOTIFICATION_LEASE_MS).toISOString(),
  )
  assert.equal(freshClaim, null)

  current = new Date('2026-09-15T00:01:00.000Z')
  const claimArguments = [
    saved.id,
    current.toISOString(),
    new Date(current.getTime() - AUDIT_INQUIRY_NOTIFICATION_LEASE_MS).toISOString(),
  ] as const
  const claims = await Promise.all([
    store.claimNotification(...claimArguments),
    store.claimNotification(...claimArguments),
  ])
  assert.equal(claims.filter(Boolean).length, 1)
  assert.equal(claims.find(Boolean)?.updatedAt, current.toISOString())
})

test('immediately reclaims failed notifications and never reclaims sent notifications', async () => {
  const store = new MemoryAuditInquiryLeadStore()
  const saved = (await store.createOrGet(lead())).lead
  await store.save(markAuditInquiryNotification(
    saved,
    'failed',
    new Date('2026-09-15T00:00:10.000Z'),
  ))

  const claimed = await store.claimNotification(
    saved.id,
    '2026-09-15T00:00:11.000Z',
    '2026-09-14T23:59:11.000Z',
  )
  assert.equal(claimed?.notification.status, 'pending')

  const sent = markAuditInquiryNotification(
    claimed!,
    'sent',
    new Date('2026-09-15T00:00:12.000Z'),
  )
  await store.save(sent)
  assert.equal(await store.claimNotification(
    saved.id,
    '2026-09-16T00:00:00.000Z',
    '2026-09-15T23:59:00.000Z',
  ), null)
})

test('uses an atomic Upstash create and the campaign lead retention TTL', async () => {
  const originalFetch = globalThis.fetch
  const commands: string[][] = []
  globalThis.fetch = async (_input, init) => {
    const command = JSON.parse(String(init?.body)) as string[]
    commands.push(command)
    return Response.json({ result: [1, JSON.stringify(lead())] })
  }
  try {
    const store = new UpstashAuditInquiryLeadStore(
      'https://redis.example',
      'secret',
      () => new Date('2026-09-15T00:00:00.000Z'),
    )
    await store.createOrGet(lead())
    assert.equal(commands.length, 1)
    assert.equal(commands[0]?.[0], 'EVAL')
    assert.match(commands[0]?.[1] ?? '', /HSET.*EXPIRE/)
    assert.equal(commands[0]?.at(-1), String(365 * 24 * 60 * 60))
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('maps an existing Upstash record to a duplicate lead without replacing it', async () => {
  const originalFetch = globalThis.fetch
  const persisted = {
    ...lead(),
    notification: { status: 'sent' as const, attemptedAt: '2026-09-15T00:01:00.000Z' },
  }
  globalThis.fetch = async () => Response.json({ result: [0, JSON.stringify(persisted)] })
  try {
    const store = new UpstashAuditInquiryLeadStore(
      'https://redis.example',
      'secret',
      () => new Date('2026-09-15T00:02:00.000Z'),
    )
    const result = await store.createOrGet(lead())
    assert.equal(result.created, false)
    assert.deepEqual(result.lead, persisted)
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('uses one atomic Upstash transition for failed or stale-pending claims', async () => {
  const originalFetch = globalThis.fetch
  const commands: string[][] = []
  const claimedAt = '2026-09-15T00:01:00.000Z'
  const staleBefore = '2026-09-15T00:00:00.000Z'
  const claimed = { ...lead(), updatedAt: claimedAt }
  globalThis.fetch = async (_input, init) => {
    commands.push(JSON.parse(String(init?.body)) as string[])
    return Response.json({ result: JSON.stringify(claimed) })
  }
  try {
    const store = new UpstashAuditInquiryLeadStore(
      'https://redis.example',
      'secret',
      () => new Date(claimedAt),
    )
    assert.deepEqual(
      await store.claimNotification(claimed.id, claimedAt, staleBefore),
      claimed,
    )
    assert.equal(commands.length, 1)
    assert.equal(commands[0]?.[0], 'EVAL')
    assert.match(commands[0]?.[1] ?? '', /status == 'failed'/)
    assert.match(commands[0]?.[1] ?? '', /status == 'pending'/)
    assert.match(commands[0]?.[1] ?? '', /updatedAt <= ARGV\[2\]/)
    assert.deepEqual(commands[0]?.slice(-2), [claimedAt, staleBefore])
  } finally {
    globalThis.fetch = originalFetch
  }
})
