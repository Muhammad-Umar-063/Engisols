import type { ProductionCheckEvent } from './analytics'
import { stablePostHogInsertId } from './analytics'
import { productionCheckPostHogProperties } from './analytics-properties'

export interface ServerPostHogEvent {
  event: ProductionCheckEvent
  subjectId: string
  distinctId: string
  properties?: Readonly<Record<string, string | number | boolean>>
}

export type ServerPostHogCapture = (
  event: ServerPostHogEvent,
) => Promise<'sent' | 'unconfigured' | 'failed'>

export const captureProductionCheckServerEvent: ServerPostHogCapture = async (input) => {
  const host = process.env.POSTHOG_HOST ?? process.env.NEXT_PUBLIC_POSTHOG_HOST
  const token = process.env.POSTHOG_PROJECT_TOKEN ?? process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN
  if (!host || !token) return 'unconfigured'

  let endpoint: URL
  try {
    endpoint = new URL('/capture/', host)
    if (endpoint.protocol !== 'https:' && process.env.NODE_ENV === 'production') return 'failed'
  } catch {
    return 'failed'
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 1_500)
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: token,
        event: input.event,
        properties: {
          distinct_id: input.distinctId,
          $insert_id: stablePostHogInsertId(input.event, input.subjectId),
          ...productionCheckPostHogProperties(input.properties ?? {}),
        },
      }),
      signal: controller.signal,
      cache: 'no-store',
    })
    return response.ok ? 'sent' : 'failed'
  } catch {
    return 'failed'
  } finally {
    clearTimeout(timeout)
  }
}
