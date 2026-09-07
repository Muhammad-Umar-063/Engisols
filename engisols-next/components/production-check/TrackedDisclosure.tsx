'use client'

import type { ReactNode, SyntheticEvent } from 'react'

import { trackProductionCheck } from '@/src/production-check/analytics'

export function TrackedDisclosure({ findingId, children }: { findingId: string; children: ReactNode }) {
  function toggled(event: SyntheticEvent<HTMLDetailsElement>) {
    if (event.currentTarget.open) trackProductionCheck('finding_expanded', { findingId })
  }
  return (
    <details className="group border-t border-bordeaux/15 pt-step-2" onToggle={toggled}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-step-2 text-sm underline decoration-current/30 underline-offset-4">
        Technical details
        <span aria-hidden className="font-mono transition-transform group-open:rotate-45 motion-reduce:transition-none">+</span>
      </summary>
      {children}
    </details>
  )
}
