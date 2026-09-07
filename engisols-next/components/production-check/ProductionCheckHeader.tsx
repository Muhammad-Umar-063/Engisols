import Link from 'next/link'

import { Logo } from '@/components/layout/Logo'

const navItems = [
  { label: 'What it checks', href: '/production-check#checks' },
  { label: 'How it works', href: '/production-check#how' },
  { label: 'What it means', href: '/production-check#meaning' },
] as const

export function ProductionCheckHeader() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 px-step-2 pt-step-2">
      <div className="shell flex items-center justify-between gap-step-3 rounded-full border border-greige/40 bg-vanilla/90 py-2 pl-step-3 pr-2 shadow-[0_10px_30px_-24px_rgba(42,20,24,0.45)] backdrop-blur-md">
        <Link
          href="/production-check"
          aria-label="Engisols production check"
          className="shrink-0 text-bordeaux"
        >
          <Logo idPrefix="production-check-head" title="Engisols" className="h-5 w-auto" />
        </Link>

        <nav aria-label="Production check" className="hidden items-center gap-step-3 lg:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm text-bordeaux/70 no-underline transition-colors hover:text-bordeaux"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <Link
          href="/production-check#tool"
          data-ground="dark"
          className="inline-flex min-h-11 items-center rounded-full bg-cherry px-step-3 font-mono text-[0.7rem] font-medium tracking-tight text-vanilla no-underline transition-opacity hover:opacity-90"
        >
          CHECK MY APP <span aria-hidden className="ml-1.5">→</span>
        </Link>
      </div>
    </header>
  )
}
