import {
  Agent as HttpAgent,
  request as httpRequest,
  type IncomingMessage,
} from 'node:http'
import { Agent as HttpsAgent, request as httpsRequest } from 'node:https'
import { isIP, type LookupFunction } from 'node:net'
import { promisify } from 'node:util'
import { brotliDecompress, gunzip, inflate } from 'node:zlib'

import { ScannerError } from './errors'
import type { ScanLimits } from './types'
import {
  type ApprovedTarget,
  type DnsPinCache,
  type ResolveHost,
  resolveHostWithDns,
  validatePublicUrl,
} from './url-policy'

export interface ScanByteBudget {
  decodedBytes: number
}

export interface RequestOnceInput {
  target: ApprovedTarget
  signal: AbortSignal
  maxWireBytes: number
  maxHeaderBytes: number
}

type PinnedAgent = HttpAgent | HttpsAgent

export interface RawPublicResponse {
  status: number
  headers: Record<string, string | string[] | undefined>
  body: Buffer
  wireBytes: number
}

export type RequestOnce = (
  input: RequestOnceInput,
) => Promise<RawPublicResponse>

export interface FetchPublicResourceOptions {
  kind: 'html' | 'javascript' | 'metadata'
  limits: Readonly<ScanLimits>
  totalDeadlineAt: number
  absoluteDeadlineAt?: number
  budget: ScanByteBudget
  dnsPins: DnsPinCache
  resolveHost?: ResolveHost
  requestOnce?: RequestOnce
  allowedOrigin?: string
  requestTimeoutMs?: number
  deadlineNow?: () => number
}

export interface PublicResourceResponse {
  status: number
  headers: Record<string, string | string[] | undefined>
  body: string
  finalUrl: URL
  decodedBytes: number
  wireBytes: number
  redirectsFollowed: number
}

const redirectStatuses = new Set([301, 302, 303, 307, 308])
const brotliDecompressAsync = promisify(brotliDecompress)
const gunzipAsync = promisify(gunzip)
const inflateAsync = promisify(inflate)

export type ScanResourceLimitReason = 'total_timeout' | 'max_total_bytes'

export class ScanResourceLimitError extends ScannerError {
  readonly reason: ScanResourceLimitReason

  constructor(reason: ScanResourceLimitReason) {
    super('target_unavailable')
    this.name = 'ScanResourceLimitError'
    this.reason = reason
  }
}

export function createPinnedLookup(
  address: string,
  family: 4 | 6,
): LookupFunction {
  return (_hostname, options, callback) => {
    if (options.all) {
      callback(null, [{ address, family }])
      return
    }
    callback(null, address, family)
  }
}

export function createPinnedRequestOptions(
  input: Pick<RequestOnceInput, 'target' | 'signal' | 'maxHeaderBytes'> & {
    agent?: PinnedAgent
  },
) {
  const { target, signal, maxHeaderBytes } = input
  return {
    protocol: target.url.protocol,
    hostname: target.hostname,
    port: target.url.protocol === 'https:' ? 443 : 80,
    path: `${target.url.pathname}${target.url.search}`,
    method: 'GET',
    headers: {
      Accept: '*/*',
      'Accept-Encoding': 'identity',
      'User-Agent': 'Engisols-Scanner/1.0 (+https://engisols.com)',
    },
    lookup: createPinnedLookup(target.address, target.family),
    servername: isIP(target.hostname) === 0 ? target.hostname : undefined,
    rejectUnauthorized: true,
    signal,
    agent: input.agent ?? false,
    maxHeaderSize: maxHeaderBytes,
  }
}

export const requestOnceWithNode: RequestOnce = (input) =>
  performNodeRequest(input)

export function createNodeRequester(): {
  requestOnce: RequestOnce
  destroy: () => void
} {
  const agents = new Map<string, PinnedAgent>()
  const requestOnce: RequestOnce = (input) => {
    const { target } = input
    const key = [
      target.url.protocol,
      target.hostname,
      target.url.port,
      target.address,
    ].join('|')
    let agent = agents.get(key)
    if (!agent) {
      const options = {
        keepAlive: true,
        maxSockets: 2,
        maxFreeSockets: 1,
        timeout: 5_000,
      }
      agent = target.url.protocol === 'https:'
        ? new HttpsAgent(options)
        : new HttpAgent(options)
      agents.set(key, agent)
    }
    return performNodeRequest(input, agent)
  }

  return {
    requestOnce,
    destroy: () => {
      for (const agent of agents.values()) agent.destroy()
      agents.clear()
    },
  }
}

function performNodeRequest(
  { target, signal, maxWireBytes, maxHeaderBytes }: RequestOnceInput,
  agent?: PinnedAgent,
): Promise<RawPublicResponse> {
  return new Promise((resolve, reject) => {
    const request = target.url.protocol === 'https:' ? httpsRequest : httpRequest
    const requestOptions = createPinnedRequestOptions({
      target,
      signal,
      maxHeaderBytes,
      agent,
    })

    const outgoing = request(requestOptions, (incoming) => {
      void consumeIncomingResponse(incoming, maxWireBytes).then(resolve, reject)
    })

    outgoing.on('error', () => {
      reject(new ScannerError('target_unavailable'))
    })
    outgoing.maxHeadersCount = 100
    outgoing.end()
  })
}

export function consumeIncomingResponse(
  incoming: IncomingMessage,
  maxWireBytes: number,
): Promise<RawPublicResponse> {
  return new Promise((resolve, reject) => {
    const status = incoming.statusCode ?? 0
    if (
      redirectStatuses.has(status) &&
      typeof incoming.headers.location === 'string'
    ) {
      incoming.destroy()
      resolve({
        status,
        headers: incoming.headers,
        body: Buffer.alloc(0),
        wireBytes: 0,
      })
      return
    }
    const declaredLength = Number(incoming.headers['content-length'])
    if (
      Number.isFinite(declaredLength) &&
      declaredLength > maxWireBytes
    ) {
      incoming.destroy()
      reject(new ScannerError('target_unavailable'))
      return
    }

    const chunks: Buffer[] = []
    let wireBytes = 0

    incoming.on('data', (chunk: Buffer | string) => {
      const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
      wireBytes += buffer.byteLength
      if (wireBytes > maxWireBytes) {
        incoming.destroy(new ScannerError('target_unavailable'))
        return
      }
      chunks.push(buffer)
    })
    incoming.on('end', () => {
      resolve({
        status,
        headers: incoming.headers,
        body: Buffer.concat(chunks, wireBytes),
        wireBytes,
      })
    })
    incoming.on('error', () => {
      reject(new ScannerError('target_unavailable'))
    })
  })
}

export async function fetchPublicResource(
  input: string | URL,
  options: FetchPublicResourceOptions,
): Promise<PublicResourceResponse> {
  const resolveHost = options.resolveHost ?? resolveHostWithDns
  const requestOnce = options.requestOnce ?? requestOnceWithNode
  const deadlineNow = options.deadlineNow ?? Date.now
  const absoluteDeadlineAt =
    options.absoluteDeadlineAt ?? options.totalDeadlineAt
  const maxResponseBytes =
    options.kind === 'html'
      ? options.limits.maxHtmlBytes
      : options.kind === 'metadata'
        ? options.limits.maxMetadataBytes
        : options.limits.maxJavaScriptBytes
  let current: URL
  try {
    current = new URL(input.toString())
  } catch {
    throw new ScannerError('invalid_request')
  }
  let redirectsFollowed = 0
  let totalWireBytes = 0

  while (true) {
    const requestTimeoutMs = Math.min(
      options.requestTimeoutMs ?? options.limits.requestTimeoutMs,
      options.limits.requestTimeoutMs,
    )
    const requestDeadlineAt = Math.min(
      options.totalDeadlineAt,
      deadlineNow() + requestTimeoutMs,
    )
    const target = await validatePublicUrl(
      current,
      resolveHost,
      options.dnsPins,
      requestDeadlineAt,
    )
    if (
      options.allowedOrigin &&
      target.url.origin !== options.allowedOrigin
    ) {
      throw new ScannerError('target_blocked')
    }

    const remainingMs = requestDeadlineAt - deadlineNow()
    if (remainingMs <= 0) {
      throw new ScannerError('target_unavailable')
    }
    const signal = AbortSignal.timeout(
      Math.min(requestTimeoutMs, remainingMs),
    )
    const raw = await requestOnce({
      target,
      signal,
      maxWireBytes: maxResponseBytes,
      maxHeaderBytes: options.limits.maxHeaderBytes,
    })
    totalWireBytes += raw.wireBytes

    const location = headerValue(raw.headers, 'location')
    if (redirectStatuses.has(raw.status) && location) {
      if (redirectsFollowed >= options.limits.maxRedirects) {
        throw new ScannerError('target_unavailable')
      }
      try {
        current = new URL(location, target.url)
      } catch {
        throw new ScannerError('target_unavailable')
      }
      redirectsFollowed += 1
      continue
    }

    if (raw.body.byteLength > maxResponseBytes) {
      throw new ScannerError('target_unavailable')
    }
    const decoded = await decodeBody(
      raw.body,
      headerValue(raw.headers, 'content-encoding'),
      maxResponseBytes,
    )
    if (deadlineNow() >= absoluteDeadlineAt) {
      throw new ScanResourceLimitError('total_timeout')
    }
    if (
      options.budget.decodedBytes + decoded.byteLength >
      options.limits.maxTotalBytes
    ) {
      options.budget.decodedBytes = options.limits.maxTotalBytes
      throw new ScanResourceLimitError('max_total_bytes')
    }
    options.budget.decodedBytes += decoded.byteLength

    return {
      status: raw.status,
      headers: raw.headers,
      body: decoded.toString('utf8'),
      finalUrl: target.url,
      decodedBytes: decoded.byteLength,
      wireBytes: totalWireBytes,
      redirectsFollowed,
    }
  }
}

async function decodeBody(
  body: Buffer,
  contentEncoding: string | undefined,
  maxOutputLength: number,
): Promise<Buffer> {
  const encoding = contentEncoding?.trim().toLowerCase()
  try {
    if (!encoding || encoding === 'identity') {
      return body
    }
    if (encoding.includes(',')) {
      throw new ScannerError('target_unavailable')
    }
    if (encoding === 'gzip' || encoding === 'x-gzip') {
      return await gunzipAsync(body, { maxOutputLength })
    }
    if (encoding === 'deflate') {
      return await inflateAsync(body, { maxOutputLength })
    }
    if (encoding === 'br') {
      return await brotliDecompressAsync(body, { maxOutputLength })
    }
  } catch (error) {
    if (error instanceof ScannerError) {
      throw error
    }
    throw new ScannerError('target_unavailable')
  }
  throw new ScannerError('target_unavailable')
}

export function headerValue(
  headers: Record<string, string | string[] | undefined>,
  name: string,
): string | undefined {
  const value = headers[name.toLowerCase()]
  return Array.isArray(value) ? value[0] : value
}
