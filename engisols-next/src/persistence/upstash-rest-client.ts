export class UpstashRestClient {
  constructor(
    private readonly url: string,
    private readonly token: string,
    private readonly unavailableMessage: string,
    private readonly timeoutMs: number,
  ) {}

  async command<T = unknown>(command: string[]): Promise<T> {
    try {
      const response = await fetch(this.url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(command),
        cache: 'no-store',
        signal: AbortSignal.timeout(this.timeoutMs),
      })
      if (!response.ok) throw new Error('persistence request failed')
      const body = (await response.json()) as { result?: T; error?: string }
      if (body.error) throw new Error('persistence command failed')
      return body.result as T
    } catch {
      throw new Error(this.unavailableMessage)
    }
  }
}
