'use client'

import type { ReactNode, SyntheticEvent } from 'react'

import { trackProductionCheck } from '@/src/production-check/analytics'

export function TrackedDisclosure({ findingId, children }: { findingId: string; children: ReactNode }) {
  function toggled(event: SyntheticEvent<HTMLDetailsElement>) {
    if (event.currentTarget.open) trackProductionCheck('finding_expanded', { findingId })
  }
  return (
    <details className="group border-t border-greige/60 pt-step-2" onToggle={toggled}>
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-step-2 font-mono text-xs tracking-[0.06em] underline decoration-bordeaux/35 underline-offset-4">
        TECHNICAL DETAILS
        <span aria-hidden className="text-lg text-cherry transition-transform group-open:rotate-45 motion-reduce:transition-none">+</span>
      </summary>
      {children}
    </details>
  )
}
