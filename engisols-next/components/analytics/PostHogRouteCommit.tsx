'use client'

import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

import { POSTHOG_ROUTER_COMMIT_EVENT } from '@/src/production-check/analytics-privacy'

/** Signals that the App Router has committed the destination pathname. */
export function PostHogRouteCommit() {
  const pathname = usePathname()

  useEffect(() => {
    window.dispatchEvent(new Event(POSTHOG_ROUTER_COMMIT_EVENT))
  }, [pathname])

  return null
}
