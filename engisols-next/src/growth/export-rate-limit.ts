import { UpstashRestClient } from '../persistence/upstash-rest-client'
import type { CredentialVersion } from './internal-auth'

export interface GrowthInternalRateLimiter {
  consume(scope: 'export' | 'outbox', credentialVersion: CredentialVersion, now: Date): Promise<boolean>
}

export class UpstashGrowthInternalRateLimiter implements GrowthInternalRateLimiter {
  private readonly client: UpstashRestClient

  constructor(
    url: string,
    token: string,
    private readonly limits: { export: number; outbox: number } = { export: 60, outbox: 6 },
  ) {
    this.client = new UpstashRestClient(url, token, 'Growth internal rate limiter is unavailable.', 5_000)
  }

  async consume(scope: 'export' | 'outbox', credentialVersion: CredentialVersion, now: Date): Promise<boolean> {
    const bucket = Math.floor(now.getTime() / 60_000)
    const key = `engisols:growth:rate:${scope}:${credentialVersion}:${bucket}`
    const result = await this.client.command<number | string>([
      'EVAL',
      "local count = redis.call('INCR', KEYS[1]); if count == 1 then redis.call('EXPIRE', KEYS[1], 120) end; return count",
      '1',
      key,
    ])
    return Number(result) <= this.limits[scope]
  }
}

export function growthInternalRateLimiter(environment: NodeJS.ProcessEnv = process.env): GrowthInternalRateLimiter {
  const url = environment.UPSTASH_REDIS_REST_URL ?? environment.KV_REST_API_URL
  const token = environment.UPSTASH_REDIS_REST_TOKEN ?? environment.KV_REST_API_TOKEN
  if (!url || !token) throw new Error('Growth internal rate limiter is not configured')
  return new UpstashGrowthInternalRateLimiter(url, token)
}
