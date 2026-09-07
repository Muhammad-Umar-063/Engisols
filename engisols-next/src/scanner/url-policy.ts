import { promises as dns } from 'node:dns'
import { BlockList, isIP } from 'node:net'

import { ScannerError } from './errors'

export interface ResolvedAddress {
  address: string
  family: 4 | 6
}

export type ResolveHost = (hostname: string) => Promise<ResolvedAddress[]>

export type DnsPinCache = Map<string, readonly ResolvedAddress[]>

export interface ApprovedTarget {
  url: URL
  hostname: string
  address: string
  family: 4 | 6
}

const blockedIpv4Addresses = new BlockList()
const blockedIpv6Addresses = new BlockList()
const globallyRoutableIpv6Addresses = new BlockList()

globallyRoutableIpv6Addresses.addSubnet('2000::', 3, 'ipv6')

for (const [network, prefix] of [
  ['0.0.0.0', 8],
  ['10.0.0.0', 8],
  ['100.64.0.0', 10],
  ['127.0.0.0', 8],
  ['169.254.0.0', 16],
  ['172.16.0.0', 12],
  ['192.0.0.0', 24],
  ['192.0.2.0', 24],
  ['192.88.99.0', 24],
  ['192.168.0.0', 16],
  ['198.18.0.0', 15],
  ['198.51.100.0', 24],
  ['203.0.113.0', 24],
  ['224.0.0.0', 4],
  ['240.0.0.0', 4],
] as const) {
  blockedIpv4Addresses.addSubnet(network, prefix, 'ipv4')
}

for (const [network, prefix] of [
  ['::', 128],
  ['::1', 128],
  ['::ffff:0:0', 96],
  ['64:ff9b::', 96],
  ['64:ff9b:1::', 48],
  ['100::', 64],
  ['2001::', 23],
  ['2001:db8::', 32],
  ['2002::', 16],
  ['3fff::', 20],
  ['5f00::', 16],
  ['fc00::', 7],
  ['fe80::', 10],
  ['ff00::', 8],
] as const) {
  blockedIpv6Addresses.addSubnet(network, prefix, 'ipv6')
}

const blockedHostnameSuffixes = [
  '.home',
  '.internal',
  '.invalid',
  '.lan',
  '.local',
  '.localhost',
  '.test',
]

export function createDnsPinCache(): DnsPinCache {
  return new Map()
}

export function isPublicIpAddress(address: string): boolean {
  const family = isIP(address)
  if (family === 4) {
    return !blockedIpv4Addresses.check(address, 'ipv4')
  }
  if (family === 6) {
    return (
      globallyRoutableIpv6Addresses.check(address, 'ipv6') &&
      !blockedIpv6Addresses.check(address, 'ipv6')
    )
  }
  return false
}

export const resolveHostWithDns: ResolveHost = async (hostname) => {
  const results = await dns.lookup(hostname, {
    all: true,
    order: 'verbatim',
  })

  return results.flatMap((result) => {
    if (result.family !== 4 && result.family !== 6) {
      return []
    }
    return [{ address: result.address, family: result.family }]
  })
}

export async function validatePublicUrl(
  input: string | URL,
  resolveHost: ResolveHost,
  pins: DnsPinCache,
  deadlineAt: number,
): Promise<ApprovedTarget> {
  const url = parseTargetUrl(input)
  const hostname = normalizeHostname(url.hostname)

  if (isBlockedHostname(hostname)) {
    throw new ScannerError('target_blocked')
  }

  const literalFamily = isIP(hostname)
  if (literalFamily === 4 || literalFamily === 6) {
    if (!isPublicIpAddress(hostname)) {
      throw new ScannerError('target_blocked')
    }

    return {
      url,
      hostname,
      address: hostname,
      family: literalFamily,
    }
  }

  let addresses = pins.get(hostname)
  if (!addresses) {
    addresses = await resolveBeforeDeadline(hostname, resolveHost, deadlineAt)
    if (
      addresses.length === 0 ||
      addresses.some(({ address }) => !isPublicIpAddress(address))
    ) {
      throw new ScannerError('target_blocked')
    }

    addresses = [...addresses].sort((left, right) =>
      `${left.family}:${left.address}`.localeCompare(
        `${right.family}:${right.address}`,
      ),
    )
    pins.set(hostname, addresses)
  }

  const selected = addresses[0]
  if (!selected) {
    throw new ScannerError('target_blocked')
  }

  return {
    url,
    hostname,
    address: selected.address,
    family: selected.family,
  }
}

function parseTargetUrl(input: string | URL): URL {
  let url: URL
  try {
    url = new URL(input.toString())
  } catch {
    throw new ScannerError('invalid_request')
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new ScannerError('target_blocked')
  }
  if (url.username || url.password || url.port) {
    throw new ScannerError('target_blocked')
  }
  url.hash = ''

  const hostname = normalizeHostname(url.hostname)
  if (!hostname) {
    throw new ScannerError('invalid_request')
  }
  url.hostname = hostname

  return url
}

function normalizeHostname(hostname: string): string {
  const withoutBrackets =
    hostname.startsWith('[') && hostname.endsWith(']')
      ? hostname.slice(1, -1)
      : hostname
  return withoutBrackets.replace(/\.$/, '').toLowerCase()
}

function isBlockedHostname(hostname: string): boolean {
  if (hostname === 'localhost' || hostname === 'metadata.google.internal') {
    return true
  }
  return blockedHostnameSuffixes.some((suffix) => hostname.endsWith(suffix))
}

async function resolveBeforeDeadline(
  hostname: string,
  resolveHost: ResolveHost,
  deadlineAt: number,
): Promise<ResolvedAddress[]> {
  const remainingMs = deadlineAt - Date.now()
  if (remainingMs <= 0) {
    throw new ScannerError('target_unavailable')
  }

  let timeout: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([
      resolveHost(hostname),
      new Promise<never>((_resolve, reject) => {
        timeout = setTimeout(
          () => reject(new ScannerError('target_unavailable')),
          remainingMs,
        )
      }),
    ])
  } catch (error) {
    if (error instanceof ScannerError) {
      throw error
    }
    throw new ScannerError('target_unavailable')
  } finally {
    if (timeout) {
      clearTimeout(timeout)
    }
  }
}
