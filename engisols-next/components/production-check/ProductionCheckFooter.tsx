import Link from 'next/link'

import { Logo } from '@/components/layout/Logo'
import { SITE } from '@/lib/site'

export function ProductionCheckFooter() {
  return (
    <footer className="bg-vanilla text-bordeaux">
      <div className="shell flex flex-col gap-step-3 border-t border-greige/40 py-step-4 md:flex-row md:items-center md:justify-between">
        <Link href="/production-check" aria-label="Engisols production check">
          <Logo idPrefix="production-check-foot" title="Engisols" className="h-5 w-auto" />
        </Link>
        <p className="font-mono text-xs text-bordeaux/70">
          AI APP CHECKS · PRODUCT ENGINEERING · BUILD RESCUE
        </p>
        <nav aria-label="Production Check legal and contact links" className="flex flex-wrap gap-step-3 font-mono text-xs">
          <a href={`mailto:${SITE.email}`} className="underline underline-offset-4">{SITE.email}</a>
          <Link href="/privacy" className="underline underline-offset-4">Privacy</Link>
          <Link href="/terms" className="underline underline-offset-4">Terms</Link>
        </nav>
      </div>
    </footer>
  )
}
