import type {
  PersistedScan,
  PersistedScanStatus,
  ScanAnswers,
  ScanProgressSnapshot,
  ScanStore,
} from './types'
import { SCAN_RECORD_TTL_SECONDS, SCAN_STORE_TIMEOUT_MS } from './config'

const KEY_PREFIX = 'engisols:production-check:'

export class ScanStoreConfigurationError extends Error {}

export class MemoryScanStore implements ScanStore {
  private readonly scans = new Map<string, PersistedScan>()

  constructor(private readonly now: () => Date = () => new Date()) {}

  async create(scan: PersistedScan): Promise<void> {
    this.scans.set(scan.publicId, structuredClone(scan))
  }

  async get(publicId: string): Promise<PersistedScan | null> {
    const scan = this.scans.get(publicId)
    if (!scan) return null
    if (new Date(scan.expiresAt).getTime() <= this.now().getTime()) {
      this.scans.delete(publicId)
      return null
    }
    return structuredClone(scan)
  }

  async updateProgress(publicId: string, progress: ScanProgressSnapshot): Promise<void> {
    this.update(publicId, (scan) => ({ ...scan, progress: structuredClone(progress) }))
  }

  async updateStatus(publicId: string, status: PersistedScanStatus): Promise<void> {
    this.update(publicId, (scan) => ({ ...scan, status }))
  }

  async updateAnswers(publicId: string, answers: ScanAnswers): Promise<boolean> {
    return this.update(publicId, (scan) => ({
      ...scan,
      answers: { ...scan.answers, ...answers },
    }))
  }

  async complete(publicId: string, result: PersistedScan['result']): Promise<void> {
    if (!result) return
    this.update(publicId, (scan) => ({
      ...scan,
      status: result.status,
      result: structuredClone(result),
      error: undefined,
    }))
  }

  async fail(publicId: string, error: NonNullable<PersistedScan['error']>): Promise<void> {
    this.update(publicId, (scan) => ({ ...scan, status: 'failed', error }))
  }

  private update(publicId: string, mutate: (scan: PersistedScan) => PersistedScan): boolean {
    const scan = this.scans.get(publicId)
    if (!scan) return false
    if (new Date(scan.expiresAt).getTime() <= this.now().getTime()) {
      this.scans.delete(publicId)
      return false
    }
    this.scans.set(publicId, mutate(scan))
    return true
  }
}

class UpstashScanStore implements ScanStore {
  constructor(
    private readonly url: string,
    private readonly token: string,
  ) {}

  async create(scan: PersistedScan): Promise<void> {
    await this.hset(scan.publicId, {
      publicId: scan.publicId,
      status: scan.status,
      requestedUrl: scan.requestedUrl,
      progress: scan.progress,
      ...(scan.answers.builder ? { builder: scan.answers.builder } : {}),
      ...(scan.answers.launchStage ? { launchStage: scan.answers.launchStage } : {}),
      createdAt: scan.createdAt,
      expiresAt: scan.expiresAt,
    })
  }

  async get(publicId: string): Promise<PersistedScan | null> {
    const values = await this.command<Array<string>>(['HGETALL', this.key(publicId)])
    if (!values || values.length === 0) return null
    const fields = Object.fromEntries(
      Array.from({ length: Math.floor(values.length / 2) }, (_, index) => [
        values[index * 2] as string,
        values[index * 2 + 1] as string,
      ]),
    )
    return {
      publicId: fields.publicId,
      status: fields.status as PersistedScanStatus,
      requestedUrl: fields.requestedUrl,
      progress: JSON.parse(fields.progress) as ScanProgressSnapshot,
      answers: {
        ...(fields.builder ? { builder: fields.builder as ScanAnswers['builder'] } : {}),
        ...(fields.launchStage ? { launchStage: fields.launchStage as ScanAnswers['launchStage'] } : {}),
      },
      ...(fields.result ? { result: JSON.parse(fields.result) as PersistedScan['result'] } : {}),
      ...(fields.error ? { error: JSON.parse(fields.error) as PersistedScan['error'] } : {}),
      createdAt: fields.createdAt,
      expiresAt: fields.expiresAt,
    }
  }

  async updateProgress(publicId: string, progress: ScanProgressSnapshot): Promise<void> {
    await this.hset(publicId, { progress })
  }

  async updateStatus(publicId: string, status: PersistedScanStatus): Promise<void> {
    await this.hset(publicId, { status })
  }

  async updateAnswers(publicId: string, answers: ScanAnswers): Promise<boolean> {
    const fields = {
      ...(answers.builder ? { builder: answers.builder } : {}),
      ...(answers.launchStage ? { launchStage: answers.launchStage } : {}),
    }
    const fieldArgs = Object.entries(fields).flatMap(([name, value]) => [name, value])
    const result = await this.command<number | string>([
      'EVAL',
      "if redis.call('EXISTS', KEYS[1]) == 0 then return 0 end; for i = 1, #ARGV - 1, 2 do redis.call('HSET', KEYS[1], ARGV[i], ARGV[i + 1]) end; redis.call('EXPIRE', KEYS[1], ARGV[#ARGV]); return 1",
      '1',
      this.key(publicId),
      ...fieldArgs,
      String(SCAN_RECORD_TTL_SECONDS),
    ])
    return Number(result) === 1
  }

  async complete(publicId: string, result: NonNullable<PersistedScan['result']>): Promise<void> {
    await this.hset(publicId, { status: result.status, result })
  }

  async fail(publicId: string, error: NonNullable<PersistedScan['error']>): Promise<void> {
    await this.hset(publicId, { status: 'failed', error })
  }

  private async hset(publicId: string, fields: Record<string, unknown>): Promise<void> {
    const args: string[] = ['HSET', this.key(publicId)]
    for (const [name, value] of Object.entries(fields)) {
      args.push(name, typeof value === 'string' ? value : JSON.stringify(value))
    }
    await this.pipeline([
      args,
      ['EXPIRE', this.key(publicId), String(SCAN_RECORD_TTL_SECONDS)],
    ])
  }

  private key(publicId: string): string {
    return `${KEY_PREFIX}${publicId}`
  }

  private async command<T = unknown>(command: string[]): Promise<T> {
    try {
      const response = await fetch(this.url, {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify(command),
        cache: 'no-store',
        signal: AbortSignal.timeout(SCAN_STORE_TIMEOUT_MS),
      })
      if (!response.ok) throw new Error('persistence request failed')
      const body = (await response.json()) as { result?: T; error?: string }
      if (body.error) throw new Error('persistence command failed')
      return body.result as T
    } catch {
      throw new Error('Scan persistence is temporarily unavailable.')
    }
  }

  private async pipeline(commands: string[][]): Promise<void> {
    try {
      const response = await fetch(`${this.url.replace(/\/$/, '')}/pipeline`, {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify(commands),
        cache: 'no-store',
        signal: AbortSignal.timeout(SCAN_STORE_TIMEOUT_MS),
      })
      if (!response.ok) throw new Error('persistence request failed')
      const body = (await response.json()) as Array<{ error?: string }>
      if (!Array.isArray(body) || body.some((item) => item.error)) {
        throw new Error('persistence pipeline failed')
      }
    } catch {
      throw new Error('Scan persistence is temporarily unavailable.')
    }
  }

  private headers(): HeadersInit {
    return {
      Authorization: `Bearer ${this.token}`,
      'Content-Type': 'application/json',
    }
  }
}

declare global {
  // Next.js may evaluate route modules in separate bundles during development.
  // Keeping the fallback on globalThis makes those bundles share one store.
  var __engisolsProductionCheckStore: MemoryScanStore | undefined
}

const memoryStore =
  globalThis.__engisolsProductionCheckStore ?? new MemoryScanStore()
globalThis.__engisolsProductionCheckStore = memoryStore
let configuredStore: ScanStore | undefined

export function getScanStore(): ScanStore {
  if (configuredStore) return configuredStore
  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN
  if (url && token) {
    configuredStore = new UpstashScanStore(url, token)
    return configuredStore
  }
  if (process.env.NODE_ENV === 'production') {
    throw new ScanStoreConfigurationError(
      'Production scan persistence requires Upstash Redis REST configuration.',
    )
  }
  return memoryStore
}

export function setScanStoreForTests(store: ScanStore | undefined): void {
  configuredStore = store
}
