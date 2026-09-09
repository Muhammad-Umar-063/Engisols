'use client'

import Link from 'next/link'
import type { MouseEvent } from 'react'

import { Logo } from '@/components/layout/Logo'

const navItems = [
  { label: 'What it checks', href: '/production-check#checks' },
  { label: 'How it works', href: '/production-check#how' },
  { label: 'What it means', href: '/production-check#meaning' },
] as const

const reportNavItems = [
  { label: 'Summary', href: '#report-summary' },
  { label: 'Findings', href: '#findings' },
  { label: 'Coverage', href: '#coverage' },
] as const

const resultNavItems = [
  { label: 'Result', href: '#tool' },
  { label: 'Findings', href: '#findings' },
  { label: 'Coverage', href: '#coverage' },
] as const

export function ProductionCheckHeader({ variant = 'landing' }: { variant?: 'landing' | 'result' | 'report' }) {
  const resultState = variant === 'result' || variant === 'report'
  const links = variant === 'report' ? reportNavItems : variant === 'result' ? resultNavItems : navItems

  function focusScanInput(event: MouseEvent<HTMLAnchorElement>) {
    if (variant !== 'landing') return
    const input = document.getElementById('production-check-url')
    if (!(input instanceof HTMLInputElement)) return
    event.preventDefault()
    input.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      block: 'center',
    })
    input.focus({ preventScroll: true })
  }

  function openEngineeringReview() {
    const trigger = document.querySelector<HTMLButtonElement>('[data-production-review-trigger]')
    trigger?.click()
  }

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
          {links.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm text-bordeaux/70 no-underline transition-colors hover:text-bordeaux"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {resultState ? (
          <button
            type="button"
            onClick={openEngineeringReview}
            aria-haspopup="dialog"
            data-ground="dark"
            className="inline-flex min-h-11 cursor-pointer items-center whitespace-nowrap rounded-full bg-cherry px-step-3 font-mono text-[0.7rem] font-medium tracking-tight text-vanilla transition-opacity hover:opacity-90"
          >
            <span className="sm:hidden">NEXT STEP</span>
            <span className="hidden sm:inline">ENGINEERING REVIEW</span>
            <span aria-hidden className="ml-1.5">→</span>
          </button>
        ) : (
          <Link
            href="/production-check#production-check-url"
            onClick={focusScanInput}
            data-ground="dark"
            className="inline-flex min-h-11 items-center whitespace-nowrap rounded-full bg-cherry px-step-3 font-mono text-[0.7rem] font-medium tracking-tight text-vanilla no-underline transition-opacity hover:opacity-90"
          >
            <span className="sm:hidden">CHECK APP</span>
            <span className="hidden sm:inline">CHECK MY APP</span>
            <span aria-hidden className="ml-1.5">→</span>
          </Link>
        )}
      </div>
    </header>
  )
}
